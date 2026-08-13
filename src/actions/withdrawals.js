"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import { assertWithdrawalWindowOpen } from "@/lib/business";
import { getSettingsMap, settingNumber } from "@/lib/settings";
import { serialize, toNumber } from "@/lib/serialize";
import { createNotification, formatCurrency, notifyAdmins } from "@/lib/notifications";
import { adjustWallet } from "@/lib/ledger";
import { formatPayoutDestination, normalizePhMobile } from "@/lib/utils";

export async function requestWithdrawalAction(formData) {
  const user = await requireUser();
  const amount = Number(formData.get("amount"));
  const methodType = String(formData.get("methodType") || "").trim();
  const accountName = String(formData.get("accountName") || "").trim();
  const accountNumber = normalizePhMobile(
    formData.get("accountNumber") || formData.get("accountDetails")
  );

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Enter a valid amount." };
  }
  if (!methodType) {
    return { ok: false, message: "Choose a payout method." };
  }
  if (!accountName) {
    return { ok: false, message: "Enter the account name on the wallet." };
  }
  if (!accountNumber) {
    return { ok: false, message: "Enter a valid 11-digit mobile number (09XXXXXXXXX)." };
  }

  const accountDetails = formatPayoutDestination({ accountName, accountNumber });

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

      const created = await tx.withdrawal.create({
        data: {
          userId: user.id,
          amount,
          methodType,
          accountDetails,
          status: "PENDING",
        },
      });

      await adjustWallet(tx, {
        userId: user.id,
        type: "WITHDRAW",
        amount: -amount,
        refType: "withdrawal",
        refId: created.id,
        note: methodType,
      });

      return created;
    });

    await createNotification({
      userId: user.id,
      type: "withdrawal",
      title: "Withdrawal submitted",
      body: `${formatCurrency(amount)} to ${methodType} ${accountNumber} is pending admin approval.`,
      href: "/dashboard/withdraw",
    });
    await notifyAdmins({
      type: "admin_withdrawal",
      title: "New withdrawal request",
      body: `${user.fullName} requested ${formatCurrency(amount)} to ${accountNumber}.`,
      href: "/admin/withdrawals",
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
      const row = await tx.withdrawal.findUnique({ where: { id } });
      if (!row || row.status !== "PENDING") {
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

      if (action === "REJECTED") {
        await adjustWallet(tx, {
          userId: row.userId,
          type: "WITHDRAW_REFUND",
          amount: toNumber(row.amount),
          refType: "withdrawal",
          refId: row.id,
          note: adminNote || "Withdrawal rejected",
        });
        await createNotification(
          {
            userId: row.userId,
            type: "withdrawal",
            title: "Withdrawal rejected",
            body: adminNote
              ? `${formatCurrency(row.amount)} was refunded to your wallet. ${adminNote}`
              : `${formatCurrency(row.amount)} was rejected and refunded to your wallet.`,
            href: "/dashboard/wallet",
          },
          tx
        );
      } else {
        await createNotification(
          {
            userId: row.userId,
            type: "withdrawal",
            title: "Withdrawal approved",
            body: `${formatCurrency(row.amount)} is approved and will be sent to ${row.accountDetails || "your wallet"}.`,
            href: "/dashboard/withdraw",
          },
          tx
        );
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
