import { toNumber } from "@/lib/serialize";

export const ROI_RANGES = [
  { id: "1D", label: "Today's ROI" },
  { id: "1W", label: "Last 7 days" },
  { id: "1M", label: "Last 30 days" },
  { id: "6M", label: "Last 6 months" },
  { id: "1Y", label: "Last 12 months" },
];

function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(value, count) {
  const d = new Date(value);
  d.setDate(d.getDate() + count);
  return d;
}

function earnedOnDay(investments, day) {
  const t = startOfDay(day).getTime();
  return investments.reduce((sum, inv) => {
    const start = startOfDay(inv.startDate || inv.createdAt).getTime();
    const end = startOfDay(inv.endDate || inv.startDate || inv.createdAt).getTime();
    if (t >= start && t <= end) return sum + toNumber(inv.dailyReturn);
    return sum;
  }, 0);
}

function sumRange(investments, from, to) {
  let total = 0;
  for (let d = startOfDay(from); d <= to; d = addDays(d, 1)) {
    total += earnedOnDay(investments, d);
  }
  return Number(total.toFixed(2));
}

function labelEvery(points, count) {
  if (points.length <= count) {
    return points.map((p) => ({ ...p, showLabel: true }));
  }
  const step = (points.length - 1) / (count - 1);
  const keep = new Set(
    Array.from({ length: count }, (_, i) => Math.round(i * step))
  );
  return points.map((p, i) => ({ ...p, showLabel: keep.has(i) }));
}

export function buildRoiSeries(investments = [], range = "1W") {
  const now = new Date();
  const today = startOfDay(now);

  if (range === "1D") {
    const daily = earnedOnDay(investments, today);
    const hourNow = now.getHours();
    let accrued = 0;
    const points = [];
    for (let hour = 0; hour < 24; hour += 2) {
      if (hour <= hourNow) {
        accrued = Number(((daily * Math.min(hourNow + 1, hour + 2)) / 24).toFixed(2));
      }
      const h = hour % 12 || 12;
      const suffix = hour < 12 ? "A" : "P";
      points.push({
        key: `h-${hour}`,
        label: `${h}${suffix}`,
        earned: accrued,
      });
    }
    return {
      points: labelEvery(points, 8),
      total: accrued,
      caption: "Today's ROI",
    };
  }

  if (range === "1W") {
    const points = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(today, i - 6);
      return {
        key: day.toISOString(),
        label: day.toLocaleDateString("en-PH", { weekday: "short" }),
        earned: Number(earnedOnDay(investments, day).toFixed(2)),
      };
    });
    return {
      points: labelEvery(points, 7),
      total: points.reduce((s, p) => s + p.earned, 0),
      caption: "Last 7 days",
    };
  }

  if (range === "1M") {
    const points = Array.from({ length: 30 }, (_, i) => {
      const day = addDays(today, i - 29);
      return {
        key: day.toISOString(),
        label: day.toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
        earned: Number(earnedOnDay(investments, day).toFixed(2)),
      };
    });
    return {
      points: labelEvery(points, 6),
      total: points.reduce((s, p) => s + p.earned, 0),
      caption: "Last 30 days",
    };
  }

  if (range === "6M") {
    const points = Array.from({ length: 26 }, (_, i) => {
      const weekEnd = addDays(today, (i - 25) * 7);
      const weekStart = addDays(weekEnd, -6);
      return {
        key: weekStart.toISOString(),
        label: weekStart.toLocaleDateString("en-PH", { month: "short" }),
        earned: sumRange(investments, weekStart, weekEnd > today ? today : weekEnd),
      };
    });
    return {
      points: labelEvery(points, 6),
      total: points.reduce((s, p) => s + p.earned, 0),
      caption: "Last 6 months",
    };
  }

  const points = Array.from({ length: 12 }, (_, i) => {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const end = monthEnd > today ? today : monthEnd;
    return {
      key: monthStart.toISOString(),
      label: monthStart.toLocaleDateString("en-PH", { month: "short" }),
      earned: sumRange(investments, monthStart, end),
    };
  });
  return {
    points: labelEvery(points, 12),
    total: points.reduce((s, p) => s + p.earned, 0),
    caption: "Last 12 months",
  };
}
