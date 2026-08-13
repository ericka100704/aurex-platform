const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@aurex.app" },
    update: {
      fullName: "AUREX Admin",
      role: "ADMIN",
      status: "ACTIVE",
    },
    create: {
      email: "admin@aurex.app",
      passwordHash: adminPassword,
      fullName: "AUREX Admin",
      role: "ADMIN",
      referralCode: "AXADMIN",
      balance: 0,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@aurex.app" },
    update: {
      fullName: "AUREX Demo",
      status: "ACTIVE",
    },
    create: {
      email: "demo@aurex.app",
      passwordHash: userPassword,
      fullName: "AUREX Demo",
      role: "USER",
      referralCode: "AXDEMO01",
      balance: 5000,
    },
  });

  const planDefs = [
    {
      name: "AUREX START",
      description: "Beginner-Friendly Account",
      minAmount: 300,
      maxAmount: 2999,
      dailyReturnPct: 3.125,
      durationDays: 8,
      totalReturnPct: 25,
      sortOrder: 1,
      status: "ACTIVE",
    },
    {
      name: "AUREX PRO",
      description: "Advanced Trading Tools",
      minAmount: 3000,
      maxAmount: 5999,
      dailyReturnPct: 3.3333,
      durationDays: 15,
      totalReturnPct: 50,
      sortOrder: 2,
      status: "ACTIVE",
    },
    {
      name: "AUREX ELITE",
      description: "Premium Platform Features — 4% Daily",
      minAmount: 6000,
      maxAmount: 100000,
      dailyReturnPct: 4.0,
      durationDays: 25,
      totalReturnPct: 100,
      sortOrder: 3,
      status: "ACTIVE",
    },
  ];

  for (const plan of planDefs) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (existing) {
      await prisma.plan.update({ where: { id: existing.id }, data: plan });
    } else {
      await prisma.plan.create({ data: plan });
    }
  }

  const methods = [
    {
      name: "GCash",
      type: "GCASH",
      accountName: "AUREX",
      accountNumber: "09171234567",
      qrImageUrl: "/qr/gcash.png",
      instructions: "Scan the GCash QR, send the exact amount, then upload your receipt.",
      sortOrder: 1,
      isActive: true,
    },
    {
      name: "GoTyme",
      type: "GOTYME",
      accountName: "AUREX",
      accountNumber: "09189876543",
      qrImageUrl: "/qr/gcash.png",
      instructions: "Scan the GCash QR, send the exact amount, then upload your receipt.",
      sortOrder: 2,
      isActive: true,
    },
  ];

  for (const method of methods) {
    const existing = await prisma.depositMethod.findFirst({
      where: { name: method.name },
    });
    if (existing) {
      await prisma.depositMethod.update({ where: { id: existing.id }, data: method });
    } else {
      await prisma.depositMethod.create({ data: method });
    }
  }

  const settings = [
    { key: "site_name", value: "AUREX", label: "Site Name", group: "general" },
    { key: "is_kyc_required", value: "false", label: "KYC Required", group: "general" },
    { key: "referral_direct_rate", value: "8", label: "Direct Referral Bonus %", group: "referral" },
    { key: "referral_level_rate", value: "1", label: "Downline Level Commission %", group: "referral" },
    { key: "referral_max_level", value: "4", label: "Max Referral Levels", group: "referral" },
    { key: "min_withdrawal", value: "500", label: "Minimum Withdrawal", group: "withdrawal" },
    { key: "withdrawal_fee_pct", value: "0", label: "Withdrawal Fee %", group: "withdrawal" },
    { key: "withdrawal_window_start", value: "06:00", label: "Withdrawal Window Start", group: "withdrawal" },
    { key: "withdrawal_window_end", value: "16:00", label: "Withdrawal Window End", group: "withdrawal" },
    { key: "withdrawal_release_time", value: "21:00", label: "Withdrawal Release Batch", group: "withdrawal" },
    { key: "withdrawal_timezone", value: "Asia/Manila", label: "Business Timezone", group: "withdrawal" },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, label: setting.label, group: setting.group },
      create: setting,
    });
  }

  console.log("AUREX seed complete:", {
    admin: admin.email,
    demoUser: demoUser.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
