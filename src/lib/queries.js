import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { serialize, toNumber } from "@/lib/serialize";
import { getSettingsMap } from "@/lib/settings";
import { ADMIN_LIST_REVALIDATE } from "@/lib/adminCache";

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

/** Lean payload for dashboard overview — fewer columns, fewer round-trips. */
export const getUserOverview = cache(async (userId) => {
  const [investments, referralCount] = await Promise.all([
    prisma.investment.findMany({
      where: { userId },
      select: {
        id: true,
        amount: true,
        earnedAmount: true,
        dailyReturn: true,
        status: true,
        startDate: true,
        endDate: true,
        lastRoiAt: true,
        plan: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.referral.count({
      where: { referrerId: userId, level: 1 },
    }),
  ]);

  return {
    investments: serialize(
      investments.map((inv) => ({
        ...inv,
        planName: inv.plan?.name,
      }))
    ),
    referralCount,
  };
});

/** Fresh wallet balance (use on money pages). */
export const getUserBalance = cache(async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });
  return toNumber(user?.balance);
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

function mapDepositRow(d) {
  const proof = d.proofImageUrl;
  return {
    id: d.id,
    user: d.user.fullName,
    amount: toNumber(d.amount),
    method: d.method?.name || "—",
    createdAt: new Date(d.createdAt).toLocaleString("en-PH"),
    status: d.status,
    provider: d.provider || "manual",
    hasProof: Boolean(proof && String(proof).length > 0),
  };
}

/** Load deposit list fields; proof flag only (no large URL sent to client). */
async function loadDepositList(where, { take } = {}) {
  const rows = await prisma.deposit.findMany({
    where,
    select: {
      id: true,
      amount: true,
      status: true,
      provider: true,
      createdAt: true,
      proofImageUrl: true,
      user: { select: { fullName: true } },
      method: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    ...(take ? { take } : {}),
  });

  return serialize(rows.map(mapDepositRow));
}

export const getPendingDeposits = unstable_cache(
  async () =>
    loadDepositList({
      status: "PENDING",
      OR: [{ provider: "manual" }, { provider: null }],
    }),
  ["admin-pending-deposits"],
  { revalidate: ADMIN_LIST_REVALIDATE, tags: ["admin-deposits"] }
);

export const getRecentDeposits = unstable_cache(
  async () => loadDepositList({}, { take: 40 }),
  ["admin-recent-deposits-40"],
  { revalidate: ADMIN_LIST_REVALIDATE, tags: ["admin-deposits"] }
);

export async function getUserDeposits(userId) {
  const rows = await prisma.deposit.findMany({
    where: { userId },
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      reviewedAt: true,
      method: { select: { name: true } },
    },
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

export const getPendingWithdrawals = unstable_cache(
  async () => {
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
  },
  ["admin-pending-withdrawals"],
  { revalidate: ADMIN_LIST_REVALIDATE, tags: ["admin-withdrawals"] }
);

export const getRecentWithdrawals = unstable_cache(
  async () => {
    const rows = await prisma.withdrawal.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      include: { user: { select: { fullName: true } } },
      orderBy: [{ reviewedAt: "desc" }, { createdAt: "desc" }],
      take: 40,
    });
    return serialize(
      rows.map((w) => ({
        id: w.id,
        user: w.user.fullName,
        amount: toNumber(w.amount),
        method: w.methodType,
        accountDetails: w.accountDetails,
        createdAt: new Date(w.reviewedAt || w.createdAt).toLocaleString("en-PH"),
        status: w.status,
      }))
    );
  },
  ["admin-recent-withdrawals-40"],
  { revalidate: ADMIN_LIST_REVALIDATE, tags: ["admin-withdrawals"] }
);

export const getAdminInvestments = unstable_cache(
  async () => {
    const rows = await prisma.investment.findMany({
      take: 150,
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
  },
  ["admin-investments-150"],
  { revalidate: ADMIN_LIST_REVALIDATE, tags: ["admin-investments"] }
);

export const getManagedUsers = unstable_cache(
  async () => {
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
        referredBy: {
          select: { fullName: true, referralCode: true },
        },
      },
    });
    return serialize(
      users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        balance: toNumber(u.balance),
        status: u.status,
        role: u.role,
        referralCode: u.referralCode,
        createdAt: u.createdAt,
        referredByName: u.referredBy?.fullName || null,
        referredByCode: u.referredBy?.referralCode || null,
      }))
    );
  },
  ["admin-managed-users"],
  { revalidate: ADMIN_LIST_REVALIDATE, tags: ["admin-users"] }
);

export const getRecentRegistrations = unstable_cache(
  async () => {
    const users = await prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        fullName: true,
        email: true,
        referralCode: true,
        createdAt: true,
        referredBy: {
          select: { fullName: true, referralCode: true },
        },
      },
    });
    return serialize(
      users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        referralCode: u.referralCode,
        createdAt: new Date(u.createdAt).toLocaleString("en-PH"),
        referredByName: u.referredBy?.fullName || null,
        referredByCode: u.referredBy?.referralCode || null,
      }))
    );
  },
  ["admin-recent-registrations"],
  { revalidate: ADMIN_LIST_REVALIDATE, tags: ["admin-users", "admin-metrics"] }
);

export const getAdminDashboardMetrics = unstable_cache(
  async () => {
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
  },
  ["admin-dashboard-metrics"],
  { revalidate: ADMIN_LIST_REVALIDATE, tags: ["admin-metrics"] }
);

export async function getAppSettings() {
  return getSettingsMap();
}
