export function formatCurrency(amount, currency = "PHP") {
  const value = Number(amount || 0);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

export function formatDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Format "HH:mm" / "H:mm" as 12-hour clock, e.g. "06:00" → "6:00 AM". */
export function formatClockTime(hhmm) {
  const raw = String(hhmm || "").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return raw || "—";
  let hour = Number(match[1]);
  const minute = match[2];
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return raw;
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
}

/** Split stored "HH:mm" (24h) into 12-hour parts for admin AM/PM editors. */
export function splitClockTime(hhmm, fallback = "06:00") {
  const raw = String(hhmm || fallback || "06:00").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  let hour24 = 6;
  let minute = 0;
  if (match) {
    hour24 = Number(match[1]);
    minute = Number(match[2]);
  }
  if (!Number.isFinite(hour24) || hour24 < 0 || hour24 > 23) hour24 = 6;
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) minute = 0;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return {
    hour12,
    minute,
    period,
    display: `${hour12}:${String(minute).padStart(2, "0")}`,
  };
}

/** Build stored "HH:mm" from 12-hour hour, minute, and AM/PM. */
export function joinClockTime(hour12, minute, period) {
  let h = Number(hour12);
  let m = Number(minute);
  if (!Number.isFinite(h) || h < 1 || h > 12) h = 12;
  if (!Number.isFinite(m) || m < 0 || m > 59) m = 0;
  const isPm = String(period || "AM").toUpperCase() === "PM";
  let hour24 = h % 12;
  if (isPm) hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/** Normalize a PH mobile to 09XXXXXXXXX, or null if invalid. */
export function normalizePhMobile(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  let local = digits;
  if (digits.startsWith("63") && digits.length === 12) local = `0${digits.slice(2)}`;
  else if (digits.startsWith("9") && digits.length === 10) local = `0${digits}`;
  if (/^09\d{9}$/.test(local)) return local;
  return null;
}

export function formatPayoutDestination({ accountName, accountNumber }) {
  const name = String(accountName || "").trim();
  const number = String(accountNumber || "").trim();
  if (name && number) return `${name} · ${number}`;
  return number || name;
}

export function calcDailyReturn(amount, dailyReturnPct) {
  return (Number(amount) * Number(dailyReturnPct)) / 100;
}

export function calcTotalReturn(amount, totalReturnPct) {
  return (Number(amount) * Number(totalReturnPct)) / 100;
}

export function generateReferralCode(name = "AX") {
  const prefix = name
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 4)
    .toUpperCase() || "AX";
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}${suffix}`;
}

export function statusColor(status) {
  const map = {
    ACTIVE: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    PENDING: "text-amber-300 bg-amber-300/10 border-amber-300/30",
    APPROVED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    COMPLETED: "text-sky-300 bg-sky-300/10 border-sky-300/30",
    REJECTED: "text-red-400 bg-red-400/10 border-red-400/30",
    CANCELLED: "text-white/50 bg-white/5 border-white/10",
    SUSPENDED: "text-orange-300 bg-orange-300/10 border-orange-300/30",
    BANNED: "text-red-400 bg-red-400/10 border-red-400/30",
    INACTIVE: "text-white/50 bg-white/5 border-white/10",
  };
  return map[status] || "text-white/70 bg-white/5 border-white/10";
}
