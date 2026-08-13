import { toNumber } from "@/lib/serialize";

export async function adjustWallet(
  tx,
  { userId, type, amount, refType = null, refId = null, note = null }
) {
  const delta = Number(toNumber(amount).toFixed(2));
  if (!delta) return { skipped: true, balanceAfter: null };

  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
  const fresh = await tx.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });
  if (!fresh) throw new Error("User not found.");

  const next = Number((toNumber(fresh.balance) + delta).toFixed(2));
  if (next < 0) throw new Error("Insufficient balance.");

  const updated = await tx.user.update({
    where: { id: userId },
    data: { balance: next },
    select: { balance: true },
  });

  await tx.walletLedger.create({
    data: {
      userId,
      type,
      amount: delta,
      balanceAfter: updated.balance,
      refType,
      refId,
      note,
    },
  });

  return { skipped: false, balanceAfter: toNumber(updated.balance) };
}
