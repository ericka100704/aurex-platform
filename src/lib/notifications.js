import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export async function createNotification(
  { userId, type, title, body, href },
  db = prisma
) {
  if (!userId || !title) return null;
  try {
    return await db.notification.create({
      data: {
        userId,
        type: type || "update",
        title,
        body: body || null,
        href: href || null,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
}

export async function notifyAdmins({ type, title, body, href }, db = prisma) {
  const admins = await db.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification({ userId: admin.id, type, title, body, href }, db)
    )
  );
}

export { formatCurrency };
