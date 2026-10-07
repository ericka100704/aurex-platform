import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

const HISTORY_LIMIT = 5;
/** bcryptjs is CPU-heavy; 8 is still strong and much faster than 10 on Node. */
export const BCRYPT_ROUNDS = 8;

/** Human-friendly "you changed your password …" for an old-password login attempt. */
export function formatOldPasswordMessage(changedAt) {
  if (!changedAt) {
    return "You previously changed this password. Use your current password, or reset it.";
  }

  const when = new Date(changedAt);
  const days = Math.max(0, Math.floor((Date.now() - when.getTime()) / 86_400_000));
  let relative;
  if (days < 1) relative = "today";
  else if (days === 1) relative = "yesterday";
  else if (days < 7) relative = `${days} days ago`;
  else if (days < 14) relative = "last week";
  else if (days < 30) relative = `${Math.floor(days / 7)} weeks ago`;
  else if (days < 60) relative = "last month";
  else relative = `${Math.floor(days / 30)} months ago`;

  return `You changed your password ${relative} (${formatDate(when)}). Use your current password, or reset it.`;
}

async function prunePasswordHistory(userId) {
  const keep = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
    select: { id: true },
  });
  if (keep.length < HISTORY_LIMIT) return;
  await prisma.passwordHistory.deleteMany({
    where: {
      userId,
      id: { notIn: keep.map((row) => row.id) },
    },
  });
}

/**
 * Archive the current hash (if any), set a new password, stamp passwordChangedAt.
 * @param {string} userId
 * @param {string} newPlainPassword
 * @param {{ archiveCurrent?: boolean, currentHash?: string | null }} [opts]
 */
export async function setUserPassword(userId, newPlainPassword, opts = {}) {
  const archiveCurrent = opts.archiveCurrent !== false;
  let currentHash = opts.currentHash;

  if (currentHash === undefined) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new Error("User not found.");
    currentHash = user.passwordHash;
  }

  const passwordHash = await bcrypt.hash(newPlainPassword, BCRYPT_ROUNDS);
  const now = new Date();

  const shouldArchive = Boolean(archiveCurrent && currentHash);

  await prisma.$transaction(async (tx) => {
    if (shouldArchive) {
      await tx.passwordHistory.create({
        data: {
          userId,
          passwordHash: currentHash,
        },
      });
    }
    await tx.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: now,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  });

  if (shouldArchive) {
    await prunePasswordHistory(userId);
  }

  return { passwordHash, passwordChangedAt: now };
}

/** If plain password matches a stored previous hash, return the change timestamp. */
export async function findOldPasswordMatch(userId, plainPassword) {
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
    select: { passwordHash: true, createdAt: true },
  });

  for (const entry of history) {
    if (await bcrypt.compare(plainPassword, entry.passwordHash)) {
      return entry.createdAt;
    }
  }
  return null;
}
