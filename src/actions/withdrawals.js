"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import { assertWithdrawalWindowOpen } from "@/lib/business";
import { getSettingsMap, settingNumber } from "@/lib/settings";
import { serialize, toNumber } from "@/lib/serialize";

export async function requestWithdrawalAction(formData) {
  const user = await requireUser();
  const amount = Number(formData.get("amount"));
  const methodType = String(formData.get("methodType") || "").trim();
  const accountDetails = String(formData.get("accountDetails") || "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Enter a valid amount." };
  }
  if (!methodType || !accountDetails) {
    return { ok: false, message: "Method and account details are required." };
  }

  try {
    await assertWithdrawalWindowOpen();
  } catch (e) {
    return { ok: false, message: e.message };
  }

  const settings = await getSettingsMap();
  const minWithdrawal = settingNumber(settings, "min_withdrawal", 500);
  if (amount < minWithdrawal) {
    return { ok: false, message: `Minimum withdrawal is ₱${minWithdrawal.toLocaleString()}.` };
  }

  try {
    const withdrawal = await prisma.$transaction(async (tx) => {
      const fresh = await tx.user.findUnique({ where: { id: user.id } });
      if (toNumber(fresh.balance) < amount) {
        throw new Error("Insufficient balance.");
      }

      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: amount } },
      });

      return tx.withdrawal.create({
        data: {
          userId: user.id,
          amount,
          methodType,
          accountDetails,
          status: "PENDING",
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/withdraw");
    revalidatePath("/dashboard/wallet");
    revalidatePath("/admin");
    revalidatePath("/admin/withdrawals");
    return {
      ok: true,
      data: serialize(withdrawal),
      message: `Withdrawal queued. Batch release processes at ${settings.withdrawal_release_time}.`,
    };
  } catch (e) {
    return { ok: false, message: e.message || "Withdrawal failed." };
  }
}

export async function reviewWithdrawalAction({ id, action, adminNote }) {
  const admin = await requireAdmin();
  if (!["APPROVED", "REJECTED"].includes(action)) {
    return { ok: false, message: "Invalid action." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({ where: { id } });
      if (!withdrawal || withdrawal.status !== "PENDING") {
        throw new Error("Withdrawal is not pending.");
      }

      await tx.withdrawal.update({
        where: { id },
        data: {
          status: action,
          adminNote: adminNote || null,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });

      // Funds already reserved on request; refund if rejected
      if (action === "REJECTED") {
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: { balance: { increment: toNumber(withdrawal.amount) } },
        });
      }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/withdrawals");
    revalidatePath("/admin/users");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/wallet");
    revalidatePath("/dashboard/withdraw");
    return { ok: true, message: `Withdrawal ${action.toLowerCase()}.` };
  } catch (e) {
    return { ok: false, message: e.message || "Review failed." };
  }
}
