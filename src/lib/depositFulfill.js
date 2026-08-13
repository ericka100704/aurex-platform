import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { payReferralCommissions } from "@/lib/business";
import { toNumber } from "@/lib/serialize";
import { createNotification, formatCurrency, notifyAdmins } from "@/lib/notifications";
import { adjustWallet } from "@/lib/ledger";

export function revalidateWalletPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/deposit");
  revalidatePath("/dashboard/wallet");
  revalidatePath("/dashboard/referrals");
  revalidatePath("/admin");
  revalidatePath("/admin/deposits");
  revalidatePath("/admin/users");
}

export async function fulfillPendingDeposit({
  depositId,
  sessionId,
  paymentId,
  paidAmountCentavos,
} = {}) {
  const deposit = depositId
    ? await prisma.deposit.findUnique({ where: { id: depositId } })
    : sessionId
      ? await prisma.deposit.findFirst({ where: { providerSessionId: sessionId } })
      : null;

  if (!deposit) return { ok: false, message: "Deposit not found." };
  if (deposit.status === "APPROVED") {
    return { ok: true, alreadyCredited: true, deposit };
  }

  const canFulfill =
    deposit.status === "PENDING" ||
    (deposit.status === "CANCELLED" && deposit.provider === "paymongo");
  if (!canFulfill) {
    return { ok: false, message: `Deposit is ${deposit.status}.` };
  }

  const expected = Math.round(toNumber(deposit.amount) * 100);
  if (
    Number.isFinite(Number(paidAmountCentavos)) &&
    Number(paidAmountCentavos) > 0 &&
    Number(paidAmountCentavos) < expected
  ) {
    return { ok: false, message: "Paid amount is less than the deposit amount." };
  }

  const credited = await prisma.$transaction(async (tx) => {
    const updated = await tx.deposit.updateMany({
      where: {
        id: deposit.id,
        status: { in: ["PENDING", "CANCELLED"] },
      },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        providerPaymentId: paymentId || deposit.providerPaymentId,
        adminNote: "PayMongo — payment detected, auto-credited",
      },
    });
    if (updated.count !== 1) return false;

    await adjustWallet(tx, {
      userId: deposit.userId,
      type: "DEPOSIT",
      amount: toNumber(deposit.amount),
      refType: "deposit",
      refId: deposit.id,
      note: "PayMongo deposit",
    });
    await payReferralCommissions(deposit.userId, deposit.amount, tx);
    await createNotification(
      {
        userId: deposit.userId,
        type: "deposit",
        title: "We received your deposit",
        body: `${formatCurrency(deposit.amount)} is now in your wallet.`,
        href: "/dashboard/wallet",
      },
      tx
    );
    const payer = await tx.user.findUnique({
      where: { id: deposit.userId },
      select: { fullName: true },
    });
    await notifyAdmins(
      {
        type: "admin_deposit",
        title: "New deposit",
        body: `${payer?.fullName || "A user"} deposited ${formatCurrency(deposit.amount)}.`,
        href: "/admin/deposits",
      },
      tx
    );
    return true;
  });

  if (!credited) return { ok: true, alreadyCredited: true, deposit };

  revalidateWalletPaths();
  return { ok: true, alreadyCredited: false, deposit };
}
