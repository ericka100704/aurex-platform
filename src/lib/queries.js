import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { serialize, toNumber } from "@/lib/serialize";
import { getSettingsMap } from "@/lib/settings";

export const getActivePlans = unstable_cache(
  async () => {
    const plans = await prisma.plan.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
    });
    return serialize(plans);
  },
  ["active-plans"],
  { revalidate: 60, tags: ["plans"] }
);

export async function getAllPlans() {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  return serialize(plans);
}

export const getActiveDepositMethods = unstable_cache(
  async () => {
    const methods = await prisma.depositMethod.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return serialize(methods);
  },
  ["active-deposit-methods"],
  { revalidate: 60, tags: ["deposit-methods"] }
);

export async function getAllDepositMethods() {
  const methods = await prisma.depositMethod.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return serialize(methods);
}

export const getUserInvestments = cache(async (userId) => {
  const investments = await prisma.investment.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  return serialize(
    investments.map((inv) => ({
      ...inv,
      planName: inv.plan?.name,
    }))
  );
});

export const getUserLedger = cache(async (userId, take = 80) => {
  const rows = await prisma.walletLedger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
  return serialize(rows);
});

export const getUserReferrals = cache(async (userId) => {
  const refs = await prisma.referral.findMany({
    where: { referrerId: userId, level: 1 },
    include: {
      referred: { select: { fullName: true, createdAt: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return serialize(
    refs.map((r) => ({
      id: r.id,
      name: r.referred.fullName,
      joined: r.referred.createdAt,
      earned: toNumber(r.commissionEarned),
      level: r.level,
    }))
  );
});

function mapDepositRows(rows) {
  return serialize(
    rows.map((d) => ({
      id: d.id,
      user: d.user.fullName,
      amount: toNumber(d.amount),
      method: d.method?.name || "—",
      createdAt: new Date(d.createdAt).toLocaleString("en-PH"),
      status: d.status,
      provider: d.provider || "manual",
      hasProof: Boolean(d.proofImageUrl),
    }))
  );
}

export async function getPendingDeposits() {
  const rows = await prisma.deposit.findMany({
    where: {
      status: "PENDING",
      OR: [{ provider: "manual" }, { provider: null }],
    },
    include: {
      user: { select: { fullName: true } },
      method: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return mapDepositRows(rows);
}

export async function getRecentDeposits(limit = 40) {
  const rows = await prisma.deposit.findMany({
    include: {
      user: { select: { fullName: true } },
      method: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return mapDepositRows(rows);
}

export async function getUserDeposits(userId) {
  const rows = await prisma.deposit.findMany({
    where: { userId },
    include: { method: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return serialize(
    rows.map((d) => ({
      id: d.id,
      amount: toNumber(d.amount),
      method: d.method?.name || "Deposit",
      status: d.status,
      createdAt: d.createdAt,
      reviewedAt: d.reviewedAt,
    }))
  );
}

export async function getPendingWithdrawals() {
  const rows = await prisma.withdrawal.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  });
  return serialize(
    rows.map((w) => ({
      id: w.id,
      user: w.user.fullName,
      amount: toNumber(w.amount),
      method: w.methodType,
      accountDetails: w.accountDetails,
      createdAt: new Date(w.createdAt).toLocaleString("en-PH"),
      status: w.status,
    }))
  );
}

export async function getAdminInvestments() {
  const rows = await prisma.investment.findMany({
    include: {
      user: { select: { fullName: true, email: true } },
      plan: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return serialize(
    rows.map((inv) => ({
      id: inv.id,
      userName: inv.user?.fullName || "—",
      userEmail: inv.user?.email || "",
      planName: inv.plan?.name || "Plan",
      amount: toNumber(inv.amount),
      dailyReturn: toNumber(inv.dailyReturn),
      totalExpected: toNumber(inv.totalExpected),
      earnedAmount: toNumber(inv.earnedAmount),
      status: inv.status,
      startDate: inv.startDate,
      endDate: inv.endDate,
      lastRoiAt: inv.lastRoiAt,
    }))
  );
}

export async function getManagedUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      balance: true,
      status: true,
      role: true,
      referralCode: true,
      createdAt: true,
    },
  });
  return serialize(users);
}

export async function getAdminDashboardMetrics() {
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

  return {
    totalUsers,
    activeInvestments,
    depositsToday,
    pendingWithdrawals,
    totalVolume:
      toNumber(investments._sum.amount) + toNumber(deposits._sum.amount),
    todayRoiPaid: 0,
  };
}

export async function getAppSettings() {
  return getSettingsMap();
}
