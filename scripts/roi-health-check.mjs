/**
 * ROI / maturity health check — read-only.
 * Run: node scripts/roi-health-check.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TZ = "Asia/Manila";

function zonedDateKey(date = new Date(), timeZone = TZ) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
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
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDateKeyDays(key, days) {
  const [year, month, day] = String(key).split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
}

async function main() {
  const now = new Date();
  const today = zonedDateKey(now);
  const issues = [];
  const ok = [];

  const active = await prisma.investment.findMany({
    where: { status: "ACTIVE" },
    include: { plan: { select: { name: true } }, user: { select: { email: true } } },
    orderBy: { endDate: "asc" },
  });

  const completed = await prisma.investment.count({ where: { status: "COMPLETED" } });
  const overdue = [];
  const dueTodayOrSoon = [];

  for (const inv of active) {
    const endKey = zonedDateKey(inv.endDate);
    const startKey = zonedDateKey(inv.startDate || inv.createdAt);
    const lastKey = inv.lastRoiAt ? zonedDateKey(inv.lastRoiAt) : null;
    const firstEligible = lastKey
      ? addDateKeyDays(lastKey, 1)
      : addDateKeyDays(startKey, 1);

    if (today >= endKey) {
      overdue.push({
        id: inv.id,
        email: inv.user?.email,
        plan: inv.plan?.name,
        endKey,
        earned: String(inv.earnedAmount),
        amount: String(inv.amount),
      });
    } else if (firstEligible <= today) {
      dueTodayOrSoon.push({
        id: inv.id.slice(0, 8),
        email: inv.user?.email,
        plan: inv.plan?.name,
        endKey,
        lastKey,
      });
    }
  }

  // PRINCIPAL missing for COMPLETED investments (data integrity)
  const completedRows = await prisma.investment.findMany({
    where: { status: "COMPLETED" },
    select: { id: true, userId: true, amount: true, endDate: true },
    orderBy: { endDate: "desc" },
    take: 50,
  });

  let missingPrincipal = 0;
  for (const inv of completedRows) {
    const row = await prisma.walletLedger.findFirst({
      where: {
        userId: inv.userId,
        type: "PRINCIPAL",
        refType: "investment",
        refId: inv.id,
      },
      select: { id: true },
    });
    if (!row) missingPrincipal += 1;
  }

  console.log("=== AUREX ROI / Maturity Health Check ===");
  console.log("Now (UTC):", now.toISOString());
  console.log("Manila day:", today);
  console.log("");
  console.log("ACTIVE investments:", active.length);
  console.log("COMPLETED investments:", completed);
  console.log("Overdue still ACTIVE (should be 0):", overdue.length);
  console.log("ACTIVE with ROI due today:", dueTodayOrSoon.length);
  console.log(
    "Recent COMPLETED missing PRINCIPAL ledger (sample ≤50):",
    missingPrincipal
  );

  if (overdue.length) {
    issues.push(`${overdue.length} matured plan(s) still ACTIVE — principal not returned`);
    console.log("\nOVERDUE ACTIVE:");
    for (const row of overdue) {
      console.log(" -", row);
    }
  } else {
    ok.push("No overdue ACTIVE investments");
  }

  if (missingPrincipal > 0) {
    issues.push(
      `${missingPrincipal} COMPLETED investment(s) have no PRINCIPAL ledger entry`
    );
  } else {
    ok.push("Sampled COMPLETED investments have PRINCIPAL ledger rows");
  }

  // Cron / settings gate presence
  const gate = await prisma.systemSetting.findUnique({
    where: { key: "roi_ensure_gate" },
  });
  if (gate?.value) {
    const ageMin = Math.round((Date.now() - Number(gate.value)) / 60000);
    ok.push(`ROI ensure gate exists (last touch ~${ageMin}m ago)`);
  } else {
    issues.push("ROI ensure gate not set yet (ok if nobody logged in since deploy)");
  }

  console.log("\n--- OK ---");
  ok.forEach((m) => console.log("✓", m));
  console.log("\n--- ISSUES ---");
  if (!issues.length) console.log("✓ none");
  else issues.forEach((m) => console.log("✗", m));

  console.log("\n--- Manual checklist ---");
  console.log("1. Vercel → Project → Deployments: latest commit includes ROI timeout fix");
  console.log("2. Vercel → Settings → Cron Jobs: /api/cron/roi scheduled");
  console.log("3. Vercel → Settings → Environment: CRON_SECRET set");
  console.log("4. Admin → Settings → Run daily ROI now → expect 0 errors");
  console.log("5. Test user: invest small amount → next Manila day ROI should credit");
  console.log("6. After plan end date: status COMPLETED + principal in Available Balance");

  const exitCode = overdue.length || missingPrincipal ? 1 : 0;
  process.exitCode = exitCode;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
