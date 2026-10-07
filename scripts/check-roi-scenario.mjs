/**
 * Sanity-check: invest Oct 6, first ROI Oct 7 12:05, expect 2nd day on Oct 8 00:24.
 * Run: node scripts/check-roi-scenario.mjs
 */

const TZ = "Asia/Manila";

function getZonedParts(date, timeZone = TZ) {
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
    fmt
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function zonedDateKey(date = new Date(), timeZone = TZ) {
  const { year, month, day } = getZonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDateKeyDays(key, days) {
  const [year, month, day] = String(key).split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
}

function money(value) {
  return Number(Number(value).toFixed(2));
}

function planInvestmentRoi(investment, now = new Date()) {
  const today = zonedDateKey(now, TZ);
  const startKey = zonedDateKey(investment.startDate || investment.createdAt, TZ);
  const endKey = zonedDateKey(investment.endDate || investment.startDate, TZ);
  const lastKey = investment.lastRoiAt
    ? zonedDateKey(investment.lastRoiAt, TZ)
    : null;

  const firstEligible = lastKey
    ? addDateKeyDays(lastKey, 1)
    : addDateKeyDays(startKey, 1);
  const lastEligible = today < endKey ? today : endKey;

  const daily = money(investment.dailyReturn);
  const expected = money(investment.totalExpected);
  const earned = money(investment.earnedAmount);
  let remaining = money(expected - earned);
  let profitToCredit = 0;
  let daysDue = 0;

  if (firstEligible <= lastEligible && remaining > 0 && daily > 0) {
    for (
      let key = firstEligible;
      key <= lastEligible && remaining > 0 && daysDue < 366;
      key = addDateKeyDays(key, 1)
    ) {
      const chunk = Math.min(daily, remaining);
      profitToCredit = money(profitToCredit + chunk);
      remaining = money(remaining - chunk);
      daysDue += 1;
    }
  }

  return {
    today,
    startKey,
    lastKey,
    firstEligible,
    lastEligible,
    daysDue,
    profitToCredit,
  };
}

const inv = {
  startDate: new Date("2026-10-06T15:00:00+08:00"),
  endDate: new Date("2026-10-15T23:59:59.999+08:00"),
  lastRoiAt: new Date("2026-10-07T00:05:00+08:00"),
  dailyReturn: 31.25,
  totalExpected: 281.25,
  earnedAmount: 31.25,
  amount: 1000,
};

const atOct8 = planInvestmentRoi(inv, new Date("2026-10-08T00:24:00+08:00"));
console.log(atOct8);
if (atOct8.daysDue !== 1 || atOct8.profitToCredit !== 31.25) {
  console.error("FAIL: Oct 8 should credit one more day (31.25)");
  process.exit(1);
}
console.log("OK: Oct 8 is due for second daily ROI (31.25 → earned 62.50 after credit)");
