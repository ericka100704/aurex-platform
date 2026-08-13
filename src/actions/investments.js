"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { calcDailyReturn, calcTotalExpected } from "@/lib/business";
import { serialize, toNumber } from "@/lib/serialize";
import { createNotification, formatCurrency } from "@/lib/notifications";
import { adjustWallet } from "@/lib/ledger";

export async function investAction({ planId, amount }) {
  const user = await requireUser();
  const investAmount = Number(amount);

  if (!planId || !Number.isFinite(investAmount) || investAmount <= 0) {
    return { ok: false, message: "Valid plan and amount are required." };
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.status !== "ACTIVE") {
    return { ok: false, message: "Plan is not available." };
  }

  const min = toNumber(plan.minAmount);
  const max = plan.maxAmount != null ? toNumber(plan.maxAmount) : null;
  if (investAmount < min) {
    return { ok: false, message: `Minimum investment is ₱${min.toLocaleString()}.` };
  }
  if (max != null && investAmount > max) {
    return { ok: false, message: `Maximum investment is ₱${max.toLocaleString()}.` };
  }

  try {
    const investment = await prisma.$transaction(async (tx) => {
      const fresh = await tx.user.findUnique({ where: { id: user.id } });
      if (toNumber(fresh.balance) < investAmount) {
        throw new Error("Insufficient balance.");
      }

      const dailyReturn = calcDailyReturn(investAmount, plan.dailyReturnPct);
      const totalExpected = calcTotalExpected(investAmount, plan.totalReturnPct);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.durationDays);

      const created = await tx.investment.create({
        data: {
          userId: user.id,
          planId: plan.id,
          amount: investAmount,
          dailyReturn,
          totalExpected,
          earnedAmount: 0,
          status: "ACTIVE",
          endDate,
        },
        include: { plan: true },
      });

      await adjustWallet(tx, {
        userId: user.id,
        type: "INVEST",
        amount: -investAmount,
        refType: "investment",
        refId: created.id,
        note: created.plan?.name || "Investment",
      });

      return created;
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/plans");
    revalidatePath("/dashboard/wallet");
    revalidatePath("/admin");
    await createNotification({
      userId: user.id,
      type: "investment",
      title: "Investment activated",
      body: `${formatCurrency(investAmount)} invested in ${investment.plan?.name || "a plan"}.`,
      href: "/dashboard/plans",
    });
    return { ok: true, data: serialize(investment), message: "Investment activated." };
  } catch (e) {
    return { ok: false, message: e.message || "Investment failed." };
  }
}
