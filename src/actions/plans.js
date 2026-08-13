"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { serialize } from "@/lib/serialize";

export async function createPlanAction(data) {
  await requireAdmin();

  const plan = await prisma.plan.create({
    data: {
      name: String(data.name).trim(),
      description: data.description ? String(data.description) : null,
      minAmount: Number(data.minAmount),
      maxAmount: data.maxAmount ? Number(data.maxAmount) : null,
      dailyReturnPct: Number(data.dailyReturnPct),
      durationDays: Number(data.durationDays),
      totalReturnPct: Number(data.totalReturnPct),
      status: data.status || "ACTIVE",
      sortOrder: Number(data.sortOrder || 0),
    },
  });

  revalidateTag("plans");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/plans");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  return { ok: true, data: serialize(plan) };
}

export async function updatePlanAction(data) {
  await requireAdmin();

  const plan = await prisma.plan.update({
    where: { id: data.id },
    data: {
      name: String(data.name).trim(),
      description: data.description ? String(data.description) : null,
      minAmount: Number(data.minAmount),
      maxAmount: data.maxAmount ? Number(data.maxAmount) : null,
      dailyReturnPct: Number(data.dailyReturnPct),
      durationDays: Number(data.durationDays),
      totalReturnPct: Number(data.totalReturnPct),
      status: data.status || "ACTIVE",
    },
  });

  revalidateTag("plans");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/plans");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  return { ok: true, data: serialize(plan) };
}

export async function deletePlanAction(id) {
  await requireAdmin();

  const activeCount = await prisma.investment.count({
    where: { planId: id, status: "ACTIVE" },
  });
  if (activeCount > 0) {
    await prisma.plan.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  } else {
    await prisma.plan.delete({ where: { id } });
  }

  revalidateTag("plans");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/plans");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/plans");
  return { ok: true };
}
