import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { addDateKeyDays, zonedDateKey } from "@/lib/business";
import { toNumber } from "@/lib/serialize";
import { createNotification, formatCurrency } from "@/lib/notifications";
import { adjustWallet } from "@/lib/ledger";
import { revalidateAdminListTags } from "@/lib/adminCache";

const TZ = "Asia/Manila";

/** Neon + catch-up can exceed Prisma's default 5s interactive tx timeout. */
const TX_OPTIONS = { maxWait: 15_000, timeout: 60_000 };

function money(value) {
  return Number(toNumber(value).toFixed(2));
}

/**
 * First ROI is the Manila day after startDate.
 * Accrues once per Manila day through endDate, capped at totalExpected.
 * Wallet (available balance) is funded only at maturity: principal + total earned.
 */
export function planInvestmentRoi(investment, now = new Date()) {
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
  return money(rows.reduce((sum, row) => sum + toNumber(row.amount), 0));
}

async function creditOneInvestment(investment, now) {
  const preview = planInvestmentRoi(investment, now);
  const planName = investment.plan?.name || "your plan";

  // Keep the transaction lean: wallet + investment only. Notifications after commit.
  const applied = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM investments WHERE id = ${investment.id} FOR UPDATE
    `;
    const fresh = await tx.investment.findUnique({
      where: { id: investment.id },
    });
    if (!fresh || fresh.status !== "ACTIVE") return null;

    const next = planInvestmentRoi(fresh, now);
    const priorNetRoi = await netRoiInWallet(tx, {
      userId: fresh.userId,
      investmentId: fresh.id,
    });

    // Nothing to accrue, not maturity, and wallet already clean → skip.
    if (
      next.profitToCredit <= 0 &&
      !next.shouldComplete &&
      priorNetRoi <= 0
    ) {
      return null;
    }

    const earnedAfter = money(toNumber(fresh.earnedAmount) + next.profitToCredit);

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

    let roiWalletDelta = 0;
    let principalCredited = 0;
    let clawedBack = 0;

    if (next.shouldComplete) {
      // Maturity: unlock principal + all accrued ROI into available balance.
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
        roiWalletDelta = roiDue;
      }

      if (next.principal > 0) {
        const alreadyReturned = await tx.walletLedger.findFirst({
          where: {
            userId: fresh.userId,
            type: "PRINCIPAL",
            refType: "investment",
            refId: fresh.id,
          },
          select: { id: true },
        });
        if (!alreadyReturned) {
          await adjustWallet(tx, {
            userId: fresh.userId,
            type: "PRINCIPAL",
            amount: next.principal,
            refType: "investment",
            refId: fresh.id,
            note: `${planName} principal returned`,
          });
          principalCredited = next.principal;
        }
      }
    } else if (priorNetRoi > 0) {
      // Legacy daily wallet ROI — pull back so available stays locked until end.
      const holder = await tx.user.findUnique({
        where: { id: fresh.userId },
        select: { balance: true },
      });
      const claw = money(
        Math.min(priorNetRoi, Math.max(0, toNumber(holder?.balance)))
      );
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
      ...next,
      earnedAfter,
      roiWalletDelta,
      principalCredited,
      clawedBack,
      userId: fresh.userId,
      planName,
    };
  }, TX_OPTIONS);

  if (!applied) {
    return {
      id: investment.id,
      skipped: true,
      credited: false,
      completed: false,
      walletTouched: false,
    };
  }

  // Best-effort notifications — must not roll back wallet changes.
  try {
    if (applied.profitToCredit > 0 && !applied.shouldComplete) {
      await createNotification({
        userId: applied.userId,
        type: "roi",
        title: "Daily ROI accrued",
        body: `${formatCurrency(applied.profitToCredit)} from ${applied.planName}${
          applied.daysDue > 1 ? ` (${applied.daysDue} days)` : ""
        } — locked until the plan ends.`,
        href: "/dashboard/investments",
      });
    }
    if (applied.shouldComplete) {
      const parts = [];
      if (applied.roiWalletDelta > 0) {
        parts.push(`${formatCurrency(applied.roiWalletDelta)} ROI unlocked`);
      }
      if (applied.principalCredited > 0) {
        parts.push(
          `${formatCurrency(applied.principalCredited)} principal returned`
        );
      } else if (applied.principal > 0) {
        parts.push("principal already returned");
      }
      await createNotification({
        userId: applied.userId,
        type: "investment",
        title: `${applied.planName} completed`,
        body: `${parts.join(". ") || "Plan completed"}. Now in your available balance.`,
        href: "/dashboard/wallet",
      });
    }
  } catch {
    // ignore notification failures
  }

  const walletTouched =
    applied.roiWalletDelta > 0 ||
    applied.principalCredited > 0 ||
    applied.clawedBack > 0;

  return {
    id: investment.id,
    skipped: false,
    credited: applied.profitToCredit > 0,
    completed: applied.shouldComplete,
    profit: applied.profitToCredit,
    principal: applied.principalCredited ?? applied.principal,
    daysDue: applied.daysDue,
    walletTouched,
    clawedBack: applied.clawedBack,
  };
}

export function revalidateRoiPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/wallet");
  revalidatePath("/dashboard/investments");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/investments");
  revalidateAdminListTags("admin-investments", "admin-metrics");
}

export async function runDailyRoiCredit(now = new Date(), { userId } = {}) {
  const investments = await prisma.investment.findMany({
    where: {
      status: "ACTIVE",
      ...(userId ? { userId } : {}),
    },
    include: { plan: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const summary = {
    processed: investments.length,
    credited: 0,
    completed: 0,
    skipped: 0,
    profitCredited: 0,
    principalReturned: 0,
    walletTouched: 0,
    errors: [],
  };

  for (const investment of investments) {
    try {
      const result = await creditOneInvestment(investment, now);
      if (result.skipped) {
        summary.skipped += 1;
        continue;
      }
      if (result.credited) {
        summary.credited += 1;
        summary.profitCredited = money(summary.profitCredited + result.profit);
      }
      if (result.completed) {
        summary.completed += 1;
        summary.principalReturned = money(
          summary.principalReturned + (result.principal || 0)
        );
      }
      if (result.walletTouched) {
        summary.walletTouched += 1;
      }
    } catch (error) {
      summary.errors.push({
        id: investment.id,
        message: error?.message || String(error) || "ROI credit failed",
      });
    }
  }

  revalidateRoiPaths();
  return summary;
}

/** In-flight dedupe only — never skip a due credit because of a throttle gate. */
const ensurePromises = new Map();

function manilaDayStart(now = new Date()) {
  const key = zonedDateKey(now, TZ);
  return new Date(`${key}T00:00:00+08:00`);
}

/** Inclusive end of the current Manila calendar day. */
function manilaDayEnd(now = new Date()) {
  const key = zonedDateKey(now, TZ);
  return new Date(`${key}T23:59:59.999+08:00`);
}

/**
 * Auto catch-up when cron is missed (or user opens the app after midnight).
 * Prefer passing userId so only that member's ACTIVE plans are processed.
 * User-scoped runs always process (accrual + clawback + maturity).
 * Global cron probes first for efficiency.
 */
export async function ensureDailyRoiCredit(now = new Date(), { userId } = {}) {
  const flightKey = userId || "__all__";
  if (ensurePromises.has(flightKey)) return ensurePromises.get(flightKey);

  const work = (async () => {
    try {
      if (!userId) {
        const dayStart = manilaDayStart(now);
        const dayEnd = manilaDayEnd(now);
        const dueProbe = await prisma.investment.findFirst({
          where: {
            status: "ACTIVE",
            OR: [
              { lastRoiAt: null, startDate: { lt: dayStart } },
              { lastRoiAt: { lt: dayStart } },
              { endDate: { lte: dayEnd } },
            ],
          },
          select: { id: true },
        });

        if (!dueProbe) {
          return { ok: true, ran: false, reason: "nothing_due" };
        }
      }

      const summary = await runDailyRoiCredit(now, { userId });
      return { ok: true, ran: true, ...summary };
    } finally {
      ensurePromises.delete(flightKey);
    }
  })();

  ensurePromises.set(flightKey, work);
  return work;
}
