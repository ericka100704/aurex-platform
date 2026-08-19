"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import { createNotification, formatCurrency } from "@/lib/notifications";
import { runDailyRoiCredit } from "@/lib/roiCredit";

export async function updateUserAction({ id, status }) {
  await requireAdmin();

  const allowed = ["ACTIVE", "SUSPENDED", "BANNED"];
  if (!status || !allowed.includes(status)) {
    return { ok: false, message: "Invalid status." };
  }

  // Balance is intentionally not editable here — only via deposits,
  // investments, withdrawals, ROI, and referral commissions.
  const user = await prisma.user.update({
    where: { id },
    data: { status },
  });

  const statusLabel = status.toLowerCase();
  await createNotification({
    userId: user.id,
    type: "account",
    title: "Account update",
    body:
      status === "ACTIVE"
        ? "Your account is active again."
        : `Your account was set to ${statusLabel}.`,
    href: "/dashboard",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  return { ok: true, data: serialize(user), message: "Status updated." };
}

export async function createDepositMethodAction(data) {
  await requireAdmin();

  const method = await prisma.depositMethod.create({
    data: {
      name: String(data.name).trim(),
      type: data.type || "CUSTOM",
      accountName: data.accountName || null,
      accountNumber: data.accountNumber || null,
      instructions: data.instructions || null,
      isActive: true,
      sortOrder: Number(data.sortOrder || 0),
    },
  });

  revalidateTag("deposit-methods");
  revalidatePath("/admin/methods");
  revalidatePath("/dashboard/deposit");
  return { ok: true, data: serialize(method) };
}

export async function toggleDepositMethodAction(id) {
  await requireAdmin();
  const current = await prisma.depositMethod.findUnique({ where: { id } });
  if (!current) return { ok: false, message: "Method not found." };

  const method = await prisma.depositMethod.update({
    where: { id },
    data: { isActive: !current.isActive },
  });

  revalidateTag("deposit-methods");
  revalidatePath("/admin/methods");
  revalidatePath("/dashboard/deposit");
  return { ok: true, data: serialize(method) };
}

export async function updateDepositMethodAction({ id, ...data }) {
  await requireAdmin();
  if (!id) return { ok: false, message: "Method not found." };

  const current = await prisma.depositMethod.findUnique({ where: { id } });
  if (!current) return { ok: false, message: "Method not found." };

  const method = await prisma.depositMethod.update({
    where: { id },
    data: {
      name: String(data.name || current.name).trim(),
      type: data.type || current.type,
      accountName: data.accountName || null,
      accountNumber: data.accountNumber || null,
      instructions: data.instructions ?? current.instructions,
    },
  });

  revalidateTag("deposit-methods");
  revalidatePath("/admin/methods");
  revalidatePath("/dashboard/deposit");
  return { ok: true, data: serialize(method), message: "Method updated." };
}

export async function deleteDepositMethodAction(id) {
  await requireAdmin();
  const current = await prisma.depositMethod.findUnique({ where: { id } });
  if (!current) return { ok: false, message: "Method not found." };

  await prisma.$transaction(async (tx) => {
    await tx.deposit.updateMany({
      where: { methodId: id },
      data: { methodId: null },
    });
    await tx.depositMethod.delete({ where: { id } });
  });

  revalidateTag("deposit-methods");
  revalidatePath("/admin/methods");
  revalidatePath("/dashboard/deposit");
  return { ok: true, message: "Method deleted." };
}

export async function updateSettingsAction(values) {
  await requireAdmin();

  const entries = Object.entries(values || {});
  for (const [key, value] of entries) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: {
        key,
        value: String(value),
        label: key,
        group: key.startsWith("referral")
          ? "referral"
          : key.startsWith("withdrawal")
            ? "withdrawal"
            : "general",
      },
    });
  }

  revalidateTag("settings");
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/dashboard/withdraw");
  revalidatePath("/dashboard/referrals");
  return { ok: true, message: "Settings saved." };
}

export async function runRoiCreditAction() {
  await requireAdmin();
  try {
    const summary = await runDailyRoiCredit();
    const parts = [
      `${summary.credited} ROI credit${summary.credited === 1 ? "" : "s"}`,
      `${summary.completed} completed`,
    ];
    if (summary.profitCredited > 0) {
      parts.push(`${formatCurrency(summary.profitCredited)} profit`);
    }
    if (summary.principalReturned > 0) {
      parts.push(`${formatCurrency(summary.principalReturned)} principal`);
    }
    if (summary.errors.length) {
      parts.push(`${summary.errors.length} error${summary.errors.length === 1 ? "" : "s"}`);
    }
    return {
      ok: summary.errors.length === 0,
      data: serialize(summary),
      message: `ROI run: ${parts.join(" · ")}.`,
    };
  } catch (error) {
    return { ok: false, message: error.message || "ROI run failed." };
  }
}

export async function getAdminMetrics() {
  await requireAdmin();

  const [
    totalUsers,
    activeInvestments,
    depositsToday,
    pendingWithdrawals,
    investments,
    deposits,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.investment.count({ where: { status: "ACTIVE" } }),
    prisma.deposit.count({
      where: {
        status: "APPROVED",
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.investment.aggregate({ _sum: { amount: true } }),
    prisma.deposit.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    }),
  ]);

  return serialize({
    totalUsers,
    activeInvestments,
    depositsToday,
    pendingWithdrawals,
    totalVolume:
      Number(investments._sum.amount || 0) + Number(deposits._sum.amount || 0),
    todayRoiPaid: 0,
  });
}
