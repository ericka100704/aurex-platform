import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { createNotification } from "@/lib/notifications";

export async function verifyEmailByToken(rawToken) {
  const raw = String(rawToken || "").trim();
  if (!raw) return { ok: false, message: "Verification link is invalid." };

  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: hashToken(raw),
      emailVerifyExpires: { gt: new Date() },
    },
  });
  if (!user) {
    return { ok: false, message: "Verification link is invalid or expired." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  });
  await createNotification({
    userId: user.id,
    type: "account",
    title: "Email verified",
    body: "Your email address is confirmed.",
    href: "/dashboard/profile",
  });
  return { ok: true, message: "Email verified." };
}
