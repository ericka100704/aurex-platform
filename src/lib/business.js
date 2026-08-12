import { prisma } from "@/lib/prisma";
import { getSettingsMap, settingNumber } from "@/lib/settings";
import { toNumber } from "@/lib/serialize";

/** Current time parts in a given IANA timezone */
export function getZonedParts(date = new Date(), timeZone = "Asia/Manila") {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  );
  return {
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function parseHHMM(value, fallbackMinutes) {
  if (!value || !String(value).includes(":")) return fallbackMinutes;
  const [h, m] = String(value).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return fallbackMinutes;
  return h * 60 + m;
}

/**
 * Withdrawal requests allowed only between 6:00 AM and 4:00 PM (Asia/Manila by default).
 */
export async function assertWithdrawalWindowOpen() {
  const settings = await getSettingsMap();
  const tz = settings.withdrawal_timezone || "Asia/Manila";
  const start = parseHHMM(settings.withdrawal_window_start, 6 * 60);
  const end = parseHHMM(settings.withdrawal_window_end, 16 * 60);
  const { hour, minute } = getZonedParts(new Date(), tz);
  const now = hour * 60 + minute;

  if (now < start || now >= end) {
    const err = new Error(
      `Withdrawals are only accepted from ${settings.withdrawal_window_start} to ${settings.withdrawal_window_end} (${tz}). Batch release is at ${settings.withdrawal_release_time}.`
    );
    err.code = "WITHDRAWAL_WINDOW_CLOSED";
    throw err;
  }
}

/** Create referral rows for direct (8%) + levels 2–4 (1% each) */
export async function createReferralChain(newUserId, referrerId) {
  const settings = await getSettingsMap();
  const directRate = settingNumber(settings, "referral_direct_rate", 8);
  const levelRate = settingNumber(settings, "referral_level_rate", 1);
  const maxLevel = settingNumber(settings, "referral_max_level", 4);

  let currentId = referrerId;
  let level = 1;

  while (currentId && level <= maxLevel) {
    const rate = level === 1 ? directRate : levelRate;
    await prisma.referral.create({
      data: {
        referrerId: currentId,
        referredId: newUserId,
        level,
        commissionRate: rate,
      },
    });

    const parent = await prisma.user.findUnique({
      where: { id: currentId },
      select: { referredById: true },
    });
    currentId = parent?.referredById || null;
    level += 1;
  }
}

/**
 * Pay multi-level referral commissions from a deposit amount.
 * Level 1 = direct 8%, levels 2–4 = 1% each (configurable via settings).
 */
export async function payReferralCommissions(depositorId, depositAmount, tx = prisma) {
  const amount = toNumber(depositAmount);
  if (amount <= 0) return;

  const links = await tx.referral.findMany({
    where: { referredId: depositorId },
    orderBy: { level: "asc" },
  });

  for (const link of links) {
    const rate = toNumber(link.commissionRate);
    const commission = Number(((amount * rate) / 100).toFixed(2));
    if (commission <= 0) continue;

    await tx.user.update({
      where: { id: link.referrerId },
      data: { balance: { increment: commission } },
    });
    await tx.referral.update({
      where: { id: link.id },
      data: { commissionEarned: { increment: commission } },
    });
  }
}

export function calcDailyReturn(amount, dailyReturnPct) {
  return Number(((toNumber(amount) * toNumber(dailyReturnPct)) / 100).toFixed(2));
}

export function calcTotalExpected(amount, totalReturnPct) {
  return Number(((toNumber(amount) * toNumber(totalReturnPct)) / 100).toFixed(2));
}
