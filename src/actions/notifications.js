"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { serialize } from "@/lib/serialize";

export async function getNotificationsAction() {
  const user = await getCurrentUser();
  if (!user) return { ok: false, items: [], unread: 0 };

  try {
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.notification.count({
        where: { userId: user.id, readAt: null },
      }),
    ]);
    return { ok: true, items: serialize(items), unread };
  } catch {
    return { ok: true, items: [], unread: 0 };
  }
}

export async function markNotificationReadAction(id) {
  const user = await getCurrentUser();
  if (!user || !id) return { ok: false };

  await prisma.notification.updateMany({
    where: { id: String(id), userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}
