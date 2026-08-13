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
    if (next.shouldComplete && next.principal > 0) {
      await adjustWallet(tx, {
        userId: fresh.userId,
        type: "PRINCIPAL",
        amount: next.principal,
        refType: "investment",
        refId: fresh.id,
        note: `${planName} principal returned`,
      });
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
      parts.push(`${formatCurrency(next.principal)} principal returned`);
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

    return next;
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
    principal: applied.principal,
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

export async function runDailyRoiCredit(now = new Date()) {
  const investments = await prisma.investment.findMany({
    where: { status: "ACTIVE" },
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
          summary.principalReturned + result.principal
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
