/**
 * Production reset: delete ALL users + money history, keep plans/methods,
 * rename AUREX* plans → SOLANA*, set site_name, create fresh admin only.
 *
 * Run: node scripts/reset-to-zero.mjs
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@solana.app";
const ADMIN_PASSWORD = "admin123";

async function main() {
  console.log("=== Solana reset: wipe users & money data ===\n");

  const before = {
    users: await prisma.user.count(),
    investments: await prisma.investment.count(),
    deposits: await prisma.deposit.count(),
    withdrawals: await prisma.withdrawal.count(),
    ledger: await prisma.walletLedger.count(),
    referrals: await prisma.referral.count(),
    notifications: await prisma.notification.count(),
  };
  console.log("Before:", before);

  // Order matters for FKs (ledger/notifications cascade, but be explicit).
  const deleted = {};
  deleted.notifications = (await prisma.notification.deleteMany({})).count;
  deleted.ledger = (await prisma.walletLedger.deleteMany({})).count;
  deleted.referrals = (await prisma.referral.deleteMany({})).count;
  deleted.investments = (await prisma.investment.deleteMany({})).count;
  deleted.deposits = (await prisma.deposit.deleteMany({})).count;
  deleted.withdrawals = (await prisma.withdrawal.deleteMany({})).count;
  deleted.users = (await prisma.user.deleteMany({})).count;

  // Clear per-user ROI gates; keep other settings.
  const gates = await prisma.systemSetting.deleteMany({
    where: {
      OR: [
        { key: "roi_ensure_gate" },
        { key: { startsWith: "roi_ensure_u:" } },
      ],
    },
  });
  deleted.roiGates = gates.count;

  console.log("Deleted:", deleted);

  // Rename plans AUREX → SOLANA
  const planRenames = [
    ["AUREX START", "SOLANA START"],
    ["AUREX PRO", "SOLANA PRO"],
    ["AUREX ELITE", "SOLANA ELITE"],
  ];
  for (const [from, to] of planRenames) {
    const updated = await prisma.plan.updateMany({
      where: { name: from },
      data: { name: to },
    });
    // Also catch already-partial renames / case variants
    if (!updated.count) {
      const fuzzy = await prisma.plan.findMany({
        where: { name: { contains: from.replace("AUREX ", ""), mode: "insensitive" } },
      });
      for (const p of fuzzy) {
        if (/aurex/i.test(p.name)) {
          await prisma.plan.update({
            where: { id: p.id },
            data: { name: p.name.replace(/aurex/gi, "SOLANA") },
          });
        }
      }
    }
    console.log(`Plan rename ${from} → ${to}:`, updated.count);
  }

  // Any remaining plan names with AUREX
  const leftover = await prisma.plan.findMany({
    where: { name: { contains: "AUREX", mode: "insensitive" } },
  });
  for (const p of leftover) {
    await prisma.plan.update({
      where: { id: p.id },
      data: { name: p.name.replace(/aurex/gi, "SOLANA") },
    });
    console.log("Leftover plan renamed:", p.name);
  }

  await prisma.systemSetting.upsert({
    where: { key: "site_name" },
    update: { value: "Solana", label: "Site Name", group: "general" },
    create: {
      key: "site_name",
      value: "Solana",
      label: "Site Name",
      group: "general",
    },
  });
  console.log("site_name → Solana");

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      fullName: "Solana Admin",
      role: "ADMIN",
      status: "ACTIVE",
      referralCode: "SOLADMIN",
      balance: 0,
      emailVerifiedAt: new Date(),
    },
  });

  const after = {
    users: await prisma.user.count(),
    investments: await prisma.investment.count(),
    deposits: await prisma.deposit.count(),
    withdrawals: await prisma.withdrawal.count(),
    plans: await prisma.plan.findMany({ select: { name: true, status: true } }),
  };

  console.log("\nAfter:", after);
  console.log("\nFresh admin:");
  console.log("  email:", admin.email);
  console.log("  password:", ADMIN_PASSWORD);
  console.log("\nDone. Update Vercel NEXT_PUBLIC_APP_NAME / MAIL_FROM to Solana.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
