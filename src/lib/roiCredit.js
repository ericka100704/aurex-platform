import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { addDateKeyDays, zonedDateKey } from "@/lib/business";
import { toNumber } from "@/lib/serialize";
import { createNotification, formatCurrency } from "@/lib/notifications";
import { adjustWallet } from "@/lib/ledger";

const TZ = "Asia/Manila";

function money(value) {
  return Number(toNumber(value).toFixed(2));
}

/**
 * First ROI is the Manila day after startDate.
 * Credits once per Manila day through endDate, capped at totalExpected.
 * When today >= endDate (and due days are caught up), return principal and complete.
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

async function creditOneInvestment(investment, now) {
  const preview = planInvestmentRoi(investment, now);
  if (preview.profitToCredit <= 0 && !preview.shouldComplete) {
    return { id: investment.id, skipped: true, credited: false, completed: false };
  }

  const applied = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM investments WHERE id = ${investment.id} FOR UPDATE
    `;
    const fresh = await tx.investment.findUnique({
      where: { id: investment.id },
    });
    if (!fresh || fresh.status !== "ACTIVE") return null;

    const next = planInvestmentRoi(fresh, now);
    if (next.profitToCredit <= 0 && !next.shouldComplete) return null;

    await tx.investment.update({
      where: { id: fresh.id },
      data: {
        earnedAmount: { increment: next.profitToCredit },
        lastRoiAt: now,
        status: next.shouldComplete ? "COMPLETED" : "ACTIVE",
      },
    });

    const planName = investment.plan?.name || "your plan";
    if (next.profitToCredit > 0) {
      await adjustWallet(tx, {
        userId: fresh.userId,
        type: "ROI",
        amount: next.profitToCredit,
        refType: "investment",
        refId: fresh.id,
        note:
          next.daysDue > 1
            ? `${planName} ROI (${next.daysDue} days)`
            : `${planName} daily ROI`,
      });
    }
    let principalCredited = 0;
    if (next.shouldComplete && next.principal > 0) {
      // Idempotent: never return principal twice for the same investment.
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
    if (next.profitToCredit > 0 && !next.shouldComplete) {
      await createNotification(
        {
          userId: fresh.userId,
          type: "roi",
          title: "Daily ROI credited",
          body: `${formatCurrency(next.profitToCredit)} from ${planName}${
            next.daysDue > 1 ? ` (${next.daysDue} days)` : ""
          }.`,
          href: "/dashboard/wallet",
        },
        tx
      );
    }
    if (next.shouldComplete) {
      const parts = [];
      if (next.profitToCredit > 0) {
        parts.push(`${formatCurrency(next.profitToCredit)} ROI`);
      }
      if (principalCredited > 0) {
        parts.push(`${formatCurrency(principalCredited)} principal returned`);
      } else if (next.principal > 0) {
        parts.push("principal already returned");
      }
      await createNotification(
        {
          userId: fresh.userId,
          type: "investment",
          title: `${planName} completed`,
          body: `${parts.join(". ")}.`,
          href: "/dashboard/plans",
        },
        tx
      );
    }

    return { ...next, principalCredited };
  });

  if (!applied) {
    return { id: investment.id, skipped: true, credited: false, completed: false };
  }

  return {
    id: investment.id,
    skipped: false,
    credited: applied.profitToCredit > 0,
    completed: applied.shouldComplete,
    profit: applied.profitToCredit,
    principal: applied.principalCredited ?? applied.principal,
    daysDue: applied.daysDue,
  };
}

export function revalidateRoiPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/wallet");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
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
    } catch (error) {
      summary.errors.push({
        id: investment.id,
        message: error.message || "ROI credit failed",
      });
    }
  }

  revalidateRoiPaths();
  return summary;
}

/** In-flight + DB gate so serverless navigations stay fast. */
const ensurePromises = new Map();
const GATE_KEY = "roi_ensure_gate";
const GATE_TTL_MS = 60_000;

function manilaDayStart(now = new Date()) {
  const key = zonedDateKey(now, TZ);
  return new Date(`${key}T00:00:00+08:00`);
}

/** Inclusive end of the current Manila calendar day. */
function manilaDayEnd(now = new Date()) {
  const key = zonedDateKey(now, TZ);
  return new Date(`${key}T23:59:59.999+08:00`);
}

function gateKeyFor(userId) {
  return userId ? `roi_ensure_u:${userId}` : GATE_KEY;
}

async function readEnsureGate(userId) {
  const row = await prisma.systemSetting.findUnique({
    where: { key: gateKeyFor(userId) },
  });
  const last = Number(row?.value);
  return Number.isFinite(last) ? last : 0;
}

async function touchEnsureGate(userId) {
  const key = gateKeyFor(userId);
  const value = String(Date.now());
  await prisma.systemSetting.upsert({
    where: { key },
    create: {
      key,
      value,
      label: userId ? "ROI ensure gate (user)" : "ROI ensure gate",
      group: "system",
    },
    update: { value },
  });
}

/**
 * Auto catch-up when cron is missed. Prefer passing userId from the logged-in
 * session so only that user's plans are processed (keeps UI snappy).
 * Probe first; only throttle after a successful check/run.
 */
export async function ensureDailyRoiCredit(now = new Date(), { userId } = {}) {
  const flightKey = userId || "__all__";
  if (ensurePromises.has(flightKey)) return ensurePromises.get(flightKey);

  const work = (async () => {
    try {
      const last = await readEnsureGate(userId);
      if (Date.now() - last < GATE_TTL_MS) {
        return { ok: true, ran: false, reason: "throttled" };
      }

      const dayStart = manilaDayStart(now);
      // Use end-of-Manila-day so maturity-morning still finds plans whose
      // stored endDate timestamp is later today (e.g. invested in the afternoon).
      const dayEnd = manilaDayEnd(now);
      const dueProbe = await prisma.investment.findFirst({
        where: {
          status: "ACTIVE",
          ...(userId ? { userId } : {}),
          OR: [
            { lastRoiAt: null, startDate: { lt: dayStart } },
            { lastRoiAt: { lt: dayStart } },
            { endDate: { lte: dayEnd } },
          ],
        },
        select: { id: true },
      });

      if (!dueProbe) {
        await touchEnsureGate(userId);
        return { ok: true, ran: false, reason: "nothing_due" };
      }

      const summary = await runDailyRoiCredit(now, { userId });
      // Only throttle after a clean run so partial failures can retry soon.
      if (!summary.errors?.length) {
        await touchEnsureGate(userId);
      }
      return { ok: true, ran: true, ...summary };
    } finally {
      ensurePromises.delete(flightKey);
    }
  })();

  ensurePromises.set(flightKey, work);
  return work;
}
