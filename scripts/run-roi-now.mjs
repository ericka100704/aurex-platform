/**
 * Force-run daily ROI catch-up against the linked DATABASE_URL.
 * Run: node scripts/run-roi-now.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TZ = "Asia/Manila";

function getZonedParts(date, timeZone = TZ) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function zonedDateKey(date = new Date(), timeZone = TZ) {
  const { year, month, day } = getZonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDateKeyDays(key, days) {
  const [year, month, day] = String(key).split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
}

function money(value) {
  return Number(Number(value).toFixed(2));
}

function planInvestmentRoi(investment, now = new Date()) {
  const today = zonedDateKey(now, TZ);
  const startKey = zonedDateKey(investment.startDate || investment.createdAt, TZ);
  const endKey = zonedDateKey(investment.endDate || investment.startDate, TZ);
  const lastKey = investment.lastRoiAt
    ? zonedDateKey(investment.lastRoiAt, TZ)
    : null;

  const firstEligible = lastKey
    ? addDateKeyDays(lastKey, 1)
    : addDateKeyDays(startKey, 1);
  const lastEligible = today < endKey ? today : endKey;

  const daily = money(investment.dailyReturn);
  const expected = money(investment.totalExpected);
  const earned = money(investment.earnedAmount);
  let remaining = money(expected - earned);
  let profitToCredit = 0;
  let daysDue = 0;

  if (firstEligible <= lastEligible && remaining > 0 && daily > 0) {
    for (
      let key = firstEligible;
      key <= lastEligible && remaining > 0 && daysDue < 366;
      key = addDateKeyDays(key, 1)
    ) {
      const chunk = Math.min(daily, remaining);
      profitToCredit = money(profitToCredit + chunk);
      remaining = money(remaining - chunk);
      daysDue += 1;
    }
  }

  const shouldComplete = today >= endKey;
  return {
    today,
    daysDue,
    profitToCredit,
    shouldComplete,
    principal: shouldComplete ? money(investment.amount) : 0,
  };
}

async function netRoiInWallet(tx, { userId, investmentId }) {
  const rows = await tx.walletLedger.findMany({
    where: {
      userId,
      type: "ROI",
      refType: "investment",
      refId: investmentId,
    },
    select: { amount: true },
  });
  return money(rows.reduce((sum, row) => sum + Number(row.amount), 0));
}

async function adjustWallet(tx, { userId, type, amount, refType, refId, note }) {
  const delta = money(amount);
  if (!delta) return;
  const fresh = await tx.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });
  const next = money(Number(fresh.balance) + delta);
  if (next < 0) throw new Error("Insufficient balance.");
  const updated = await tx.user.update({
    where: { id: userId },
    data: { balance: next },
    select: { balance: true },
  });
  await tx.walletLedger.create({
    data: {
      userId,
      type,
      amount: delta,
      balanceAfter: updated.balance,
      refType: refType || null,
      refId: refId || null,
      note: note || null,
    },
  });
}

async function creditOne(investment, now) {
  return prisma.$transaction(async (tx) => {
    const fresh = await tx.investment.findUnique({ where: { id: investment.id } });
    if (!fresh || fresh.status !== "ACTIVE") return { skipped: true };

    const next = planInvestmentRoi(fresh, now);
    const priorNetRoi = await netRoiInWallet(tx, {
      userId: fresh.userId,
      investmentId: fresh.id,
    });

    if (next.profitToCredit <= 0 && !next.shouldComplete && priorNetRoi <= 0) {
      return { skipped: true };
    }

    const earnedAfter = money(Number(fresh.earnedAmount) + next.profitToCredit);
    const planName = investment.plan?.name || "plan";

    if (next.profitToCredit > 0 || next.shouldComplete) {
      await tx.investment.update({
        where: { id: fresh.id },
        data: {
          earnedAmount: { increment: next.profitToCredit },
          lastRoiAt: now,
          status: next.shouldComplete ? "COMPLETED" : "ACTIVE",
        },
      });
    }

    let clawedBack = 0;
    let roiWallet = 0;
    let principal = 0;

    if (next.shouldComplete) {
      const roiDue = money(earnedAfter - priorNetRoi);
      if (roiDue > 0) {
        await adjustWallet(tx, {
          userId: fresh.userId,
          type: "ROI",
          amount: roiDue,
          refType: "investment",
          refId: fresh.id,
          note: `${planName} ROI released at maturity`,
        });
        roiWallet = roiDue;
      }
      if (next.principal > 0) {
        const already = await tx.walletLedger.findFirst({
          where: {
            userId: fresh.userId,
            type: "PRINCIPAL",
            refType: "investment",
            refId: fresh.id,
          },
          select: { id: true },
        });
        if (!already) {
          await adjustWallet(tx, {
            userId: fresh.userId,
            type: "PRINCIPAL",
            amount: next.principal,
            refType: "investment",
            refId: fresh.id,
            note: `${planName} principal returned`,
          });
          principal = next.principal;
        }
      }
    } else if (priorNetRoi > 0) {
      const holder = await tx.user.findUnique({
        where: { id: fresh.userId },
        select: { balance: true },
      });
      const claw = money(Math.min(priorNetRoi, Math.max(0, Number(holder?.balance || 0))));
      if (claw > 0) {
        await adjustWallet(tx, {
          userId: fresh.userId,
          type: "ROI",
          amount: -claw,
          refType: "investment",
          refId: fresh.id,
          note: `${planName} ROI held until maturity`,
        });
        clawedBack = claw;
      }
    }

    return {
      skipped: false,
      email: investment.user?.email,
      plan: planName,
      daysDue: next.daysDue,
      profit: next.profitToCredit,
      earnedAfter,
      clawedBack,
      roiWallet,
      principal,
      completed: next.shouldComplete,
    };
  }, { maxWait: 15000, timeout: 60000 });
}

async function main() {
  const now = new Date();
  console.log("Manila day:", zonedDateKey(now), "UTC:", now.toISOString());
  const investments = await prisma.investment.findMany({
    where: { status: "ACTIVE" },
    include: {
      plan: { select: { name: true } },
      user: { select: { email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  console.log("ACTIVE:", investments.length);

  for (const inv of investments) {
    try {
      const result = await creditOne(inv, now);
      if (result.skipped) {
        console.log("skip", inv.user?.email, inv.plan?.name);
      } else {
        console.log("OK", result);
      }
    } catch (e) {
      console.error("FAIL", inv.user?.email, inv.id, e.message);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
