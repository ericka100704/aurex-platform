/**
 * Pure logic checks for daily ROI + maturity principal (no DB).
 * Run: node scripts/test-roi-logic.mjs
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
    hour: Number(parts.hour),
    minute: Number(parts.minute),
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
  const lastKey = investment.lastRoiAt ? zonedDateKey(investment.lastRoiAt, TZ) : null;

  const firstEligible = lastKey ? addDateKeyDays(lastKey, 1) : addDateKeyDays(startKey, 1);
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

  const shouldComplete = today >= endKey;

  return {
    today,
    daysDue,
    profitToCredit,
    shouldComplete,
    principal: shouldComplete ? money(investment.amount) : 0,
  };
}

function assert(name, cond) {
  if (!cond) {
    console.error("FAIL:", name);
    process.exitCode = 1;
    return;
  }
  console.log("OK:", name);
}

const start = new Date("2026-01-01T10:00:00+08:00");
const endKey = addDateKeyDays(zonedDateKey(start), 8);
const endDate = new Date(`${endKey}T23:59:59.999+08:00`);

const base = {
  startDate: start,
  endDate,
  dailyReturn: 10,
  totalExpected: 80,
  earnedAmount: 0,
  amount: 500,
  lastRoiAt: null,
};

// Day after start: first ROI
const d1 = new Date("2026-01-02T12:00:00+08:00");
const r1 = planInvestmentRoi(base, d1);
assert("first ROI day credits once", r1.daysDue === 1 && r1.profitToCredit === 10);
assert("not complete before end", !r1.shouldComplete && r1.principal === 0);

// Maturity day: ROI + principal
const matured = { ...base, earnedAmount: 70, lastRoiAt: new Date("2026-01-08T12:00:00+08:00") };
const rEnd = planInvestmentRoi(matured, endDate);
assert("maturity completes", rEnd.shouldComplete === true);
assert("maturity returns principal", rEnd.principal === 500);
assert("final ROI day included", rEnd.profitToCredit === 10);

// Already fully earned before maturity: still return principal
const fullyEarned = { ...base, earnedAmount: 80, lastRoiAt: new Date("2026-01-07T12:00:00+08:00") };
const rPrincipalOnly = planInvestmentRoi(fullyEarned, endDate);
assert("principal when fully earned", rPrincipalOnly.profitToCredit === 0 && rPrincipalOnly.principal === 500);

// Real user scenario: invest Oct 6 → ROI Oct 7 → second ROI due Oct 8 after midnight
const startOct6 = new Date("2026-10-06T15:00:00+08:00");
const endOct15 = new Date("2026-10-15T23:59:59.999+08:00");
const afterFirstRoi = {
  startDate: startOct6,
  endDate: endOct15,
  dailyReturn: 31.25,
  totalExpected: 281.25,
  earnedAmount: 31.25,
  amount: 1000,
  lastRoiAt: new Date("2026-10-07T00:05:00+08:00"),
};
const oct8morning = planInvestmentRoi(
  afterFirstRoi,
  new Date("2026-10-08T00:24:00+08:00")
);
assert(
  "Oct 8 credits second daily ROI",
  oct8morning.daysDue === 1 && oct8morning.profitToCredit === 31.25
);
assert("Oct 8 not yet maturity", !oct8morning.shouldComplete);

if (process.exitCode) {
  console.error("\nROI logic tests failed.");
} else {
  console.log("\nAll ROI logic tests passed.");
}
