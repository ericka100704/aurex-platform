"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { serialize } from "@/lib/serialize";

async function sessionUserId() {
  const session = await getSession();
  return session?.sub ? String(session.sub) : null;
}

export async function getNotificationsAction() {
  const userId = await sessionUserId();
  if (!userId) return { ok: false, items: [], unread: 0 };

  try {
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          href: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);
    return { ok: true, items: serialize(items), unread };
  } catch {
    return { ok: true, items: [], unread: 0 };
  }
}

export async function getUnreadCountAction() {
  const userId = await sessionUserId();
  if (!userId) return { ok: false, unread: 0 };
  try {
    const unread = await prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { ok: true, unread };
  } catch {
    return { ok: true, unread: 0 };
  }
}

export async function markNotificationReadAction(id) {
  const userId = await sessionUserId();
  if (!userId || !id) return { ok: false };

  await prisma.notification.updateMany({
    where: { id: String(id), userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

export async function markAllNotificationsReadAction() {
  const userId = await sessionUserId();
  if (!userId) return { ok: false };

  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}
