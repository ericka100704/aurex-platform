"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import { createNotification, formatCurrency } from "@/lib/notifications";
import { revalidateAdminListTags } from "@/lib/adminCache";
import { runDailyRoiCredit } from "@/lib/roiCredit";
import { uploadMethodQr } from "@/lib/storage";

export async function updateUserAction({ id, status }) {
  await requireAdmin();

  const allowed = ["ACTIVE", "SUSPENDED", "BANNED"];
  if (!status || !allowed.includes(status)) {
    return { ok: false, message: "Invalid status." };
  }

  // Balance is intentionally not editable here — only via deposits,
  // investments, withdrawals, ROI, and referral commissions.
  const user = await prisma.user.update({
    where: { id },
    data: { status },
  });

  const statusLabel = status.toLowerCase();
  await createNotification({
    userId: user.id,
    type: "account",
    title: "Account update",
    body:
      status === "ACTIVE"
        ? "Your account is active again."
        : `Your account was set to ${statusLabel}.`,
    href: "/dashboard",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  revalidateAdminListTags("admin-users");
  return { ok: true, data: serialize(user), message: "Status updated." };
}

async function resolveMethodQrUrl(formDataOrFields, existingUrl = null) {
  if (formDataOrFields instanceof FormData) {
    const file = formDataOrFields.get("qrImage");
    if (file && typeof file !== "string" && file.size > 0) {
      return uploadMethodQr(file);
    }
    const clear = formDataOrFields.get("clearQr");
    if (clear === "1") return null;
    const keep = formDataOrFields.get("qrImageUrl");
    if (keep != null && String(keep).trim()) return String(keep).trim();
    return existingUrl;
  }
  if (formDataOrFields?.qrImageUrl !== undefined) {
    return formDataOrFields.qrImageUrl || null;
  }
  return existingUrl;
}

function methodFieldsFrom(input) {
  if (input instanceof FormData) {
    return {
      name: String(input.get("name") || "").trim(),
      type: String(input.get("type") || "CUSTOM"),
      accountName: String(input.get("accountName") || "").trim() || null,
      accountNumber: String(input.get("accountNumber") || "").trim() || null,
      instructions: String(input.get("instructions") || "").trim() || null,
      sortOrder: Number(input.get("sortOrder") || 0),
    };
  }
  return {
    name: String(input.name || "").trim(),
    type: input.type || "CUSTOM",
    accountName: input.accountName || null,
    accountNumber: input.accountNumber || null,
    instructions: input.instructions || null,
    sortOrder: Number(input.sortOrder || 0),
  };
}

export async function createDepositMethodAction(data) {
  await requireAdmin();

  try {
    const fields = methodFieldsFrom(data);
    if (!fields.name) return { ok: false, message: "Display name is required." };

    const qrImageUrl = await resolveMethodQrUrl(data, null);

    const method = await prisma.depositMethod.create({
      data: {
        name: fields.name,
        type: fields.type || "CUSTOM",
        accountName: fields.accountName,
        accountNumber: fields.accountNumber,
        qrImageUrl,
        instructions: fields.instructions,
        isActive: true,
        sortOrder: fields.sortOrder,
      },
    });

    revalidateTag("deposit-methods");
    revalidatePath("/admin/methods");
    revalidatePath("/dashboard/deposit");
    return { ok: true, data: serialize(method) };
  } catch (error) {
    return { ok: false, message: error.message || "Failed to add method." };
  }
}

export async function toggleDepositMethodAction(id) {
  await requireAdmin();
  const current = await prisma.depositMethod.findUnique({ where: { id } });
  if (!current) return { ok: false, message: "Method not found." };

  const method = await prisma.depositMethod.update({
    where: { id },
    data: { isActive: !current.isActive },
  });

  revalidateTag("deposit-methods");
  revalidatePath("/admin/methods");
  revalidatePath("/dashboard/deposit");
  return { ok: true, data: serialize(method) };
}

export async function updateDepositMethodAction(input) {
  await requireAdmin();

  try {
    const id =
      input instanceof FormData
        ? String(input.get("id") || "").trim()
        : String(input?.id || "").trim();
    if (!id) return { ok: false, message: "Method not found." };

    const current = await prisma.depositMethod.findUnique({ where: { id } });
    if (!current) return { ok: false, message: "Method not found." };

    const fields = methodFieldsFrom(input);
    const qrImageUrl = await resolveMethodQrUrl(input, current.qrImageUrl);

    const method = await prisma.depositMethod.update({
      where: { id },
      data: {
        name: fields.name || current.name,
        type: fields.type || current.type,
        accountName: fields.accountName,
        accountNumber: fields.accountNumber,
        qrImageUrl,
        instructions:
          fields.instructions !== undefined
            ? fields.instructions
            : current.instructions,
      },
    });

    revalidateTag("deposit-methods");
    revalidatePath("/admin/methods");
    revalidatePath("/dashboard/deposit");
    return { ok: true, data: serialize(method), message: "Method updated." };
  } catch (error) {
    return { ok: false, message: error.message || "Failed to update method." };
  }
}

export async function deleteDepositMethodAction(id) {
  await requireAdmin();
  const current = await prisma.depositMethod.findUnique({ where: { id } });
  if (!current) return { ok: false, message: "Method not found." };

  await prisma.$transaction(async (tx) => {
    await tx.deposit.updateMany({
      where: { methodId: id },
      data: { methodId: null },
    });
    await tx.depositMethod.delete({ where: { id } });
  });

  revalidateTag("deposit-methods");
  revalidatePath("/admin/methods");
  revalidatePath("/dashboard/deposit");
  return { ok: true, message: "Method deleted." };
}

export async function updateSettingsAction(values) {
  await requireAdmin();

  const entries = Object.entries(values || {});
  for (const [key, value] of entries) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: {
        key,
        value: String(value),
        label: key,
        group: key.startsWith("referral")
          ? "referral"
          : key.startsWith("withdrawal")
            ? "withdrawal"
            : "general",
      },
    });
  }

  revalidateTag("settings");
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/dashboard/withdraw");
  revalidatePath("/dashboard/referrals");
  return { ok: true, message: "Settings saved." };
}

export async function runRoiCreditAction() {
  await requireAdmin();
  try {
    const summary = await runDailyRoiCredit();
    const parts = [
      `${summary.credited} ROI credit${summary.credited === 1 ? "" : "s"}`,
      `${summary.completed} completed`,
    ];
    if (summary.profitCredited > 0) {
      parts.push(`${formatCurrency(summary.profitCredited)} profit`);
    }
    if (summary.principalReturned > 0) {
      parts.push(`${formatCurrency(summary.principalReturned)} principal`);
    }
    if (summary.errors.length) {
      parts.push(`${summary.errors.length} error${summary.errors.length === 1 ? "" : "s"}`);
      const sample = summary.errors
        .slice(0, 3)
        .map((e) => e.message)
        .filter(Boolean);
      if (sample.length) {
        parts.push(`e.g. ${sample.join(" | ")}`);
      }
    }
    return {
      ok: summary.errors.length === 0,
      data: serialize(summary),
      message: `ROI run: ${parts.join(" · ")}.`,
    };
  } catch (error) {
    return { ok: false, message: error.message || "ROI run failed." };
  }
}

export async function getAdminMetrics() {
  await requireAdmin();

  const [
    totalUsers,
    activeInvestments,
    depositsToday,
    pendingWithdrawals,
    investments,
    deposits,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.investment.count({ where: { status: "ACTIVE" } }),
    prisma.deposit.count({
      where: {
        status: "APPROVED",
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.investment.aggregate({ _sum: { amount: true } }),
    prisma.deposit.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    }),
  ]);

  return serialize({
    totalUsers,
    activeInvestments,
    depositsToday,
    pendingWithdrawals,
    totalVolume:
      Number(investments._sum.amount || 0) + Number(deposits._sum.amount || 0),
    todayRoiPaid: 0,
  });
}
