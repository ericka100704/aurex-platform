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

export function roiTimelineFromInvestments(investments = []) {
  const daily = investments
    .filter((i) => i.status === "ACTIVE")
    .reduce((s, i) => s + toNumber(i.dailyReturn), 0);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day) => ({ day, earned: daily }));
}

function mapDepositRows(rows) {
  return serialize(
    rows.map((d) => ({
      id: d.id,
      user: d.user.fullName,
      amount: toNumber(d.amount),
      method: d.method?.name || "—",
      createdAt: new Date(d.createdAt).toLocaleString("en-PH"),
      status: d.status,
      proofImageUrl: d.proofImageUrl,
    }))
  );
}

export async function getPendingDeposits() {
  const rows = await prisma.deposit.findMany({
    where: { status: "PENDING" },
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
      createdAt: new Date(w.createdAt).toLocaleString("en-PH"),
      status: w.status,
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
