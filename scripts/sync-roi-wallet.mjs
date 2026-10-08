/**
 * Sync available balance: credit any earned ROI not yet in the wallet.
 * Run: node scripts/sync-roi-wallet.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function money(v) {
  return Number(Number(v).toFixed(2));
}

async function main() {
  const investments = await prisma.investment.findMany({
    where: { status: "ACTIVE" },
    include: {
      plan: { select: { name: true } },
      user: { select: { email: true, balance: true } },
    },
  });

  for (const inv of investments) {
    const rows = await prisma.walletLedger.findMany({
      where: {
        userId: inv.userId,
        type: "ROI",
        refType: "investment",
        refId: inv.id,
      },
      select: { amount: true },
    });
    const netRoi = money(rows.reduce((s, r) => s + Number(r.amount), 0));
    const earned = money(inv.earnedAmount);
    const due = money(earned - netRoi);
    if (due <= 0) {
      console.log("ok", inv.user.email, inv.plan?.name, { earned, netRoi });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const fresh = await tx.user.findUnique({
        where: { id: inv.userId },
        select: { balance: true },
      });
      const next = money(Number(fresh.balance) + due);
      const updated = await tx.user.update({
        where: { id: inv.userId },
        data: { balance: next },
        select: { balance: true },
      });
      await tx.walletLedger.create({
        data: {
          userId: inv.userId,
          type: "ROI",
          amount: due,
          balanceAfter: updated.balance,
          refType: "investment",
          refId: inv.id,
          note: `${inv.plan?.name || "Plan"} ROI`,
        },
      });
    });

    console.log("credited", inv.user.email, inv.plan?.name, due);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
