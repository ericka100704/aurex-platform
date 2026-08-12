import { prisma } from "@/lib/prisma";

const DEFAULTS = {
  site_name: "AUREX",
  is_kyc_required: "false",
  referral_direct_rate: "8",
  referral_level_rate: "1",
  referral_max_level: "4",
  min_withdrawal: "500",
  withdrawal_fee_pct: "0",
  withdrawal_window_start: "06:00",
  withdrawal_window_end: "16:00",
  withdrawal_release_time: "21:00",
  withdrawal_timezone: "Asia/Manila",
};

export async function getSettingsMap() {
  const rows = await prisma.systemSetting.findMany();
  const map = { ...DEFAULTS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

export async function getSetting(key) {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key] ?? null;
}

export function settingNumber(map, key, fallback = 0) {
  const n = Number(map[key]);
  return Number.isFinite(n) ? n : fallback;
}

export function settingBool(map, key, fallback = false) {
  const v = String(map[key] ?? fallback).toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}
