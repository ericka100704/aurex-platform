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
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
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
    REJECTED: "text-rose-400 bg-rose-400/10 border-rose-400/30",
    CANCELLED: "text-white/50 bg-white/5 border-white/10",
    SUSPENDED: "text-orange-300 bg-orange-300/10 border-orange-300/30",
    BANNED: "text-red-400 bg-red-400/10 border-red-400/30",
    INACTIVE: "text-white/50 bg-white/5 border-white/10",
  };
  return map[status] || "text-white/70 bg-white/5 border-white/10";
}
