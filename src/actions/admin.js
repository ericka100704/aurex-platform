"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { serialize } from "@/lib/serialize";

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
  revalidatePath("/admin/settings");
  revalidatePath("/dashboard/withdraw");
  revalidatePath("/dashboard/referrals");
  return { ok: true, message: "Settings saved." };
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
