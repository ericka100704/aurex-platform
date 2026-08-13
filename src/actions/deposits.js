"use server";

import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import { payReferralCommissions } from "@/lib/business";
import { serialize, toNumber } from "@/lib/serialize";

async function saveProof(file) {
  if (!file || typeof file === "string" || file.size === 0) return null;
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
  const filename = `deposit_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${filename}`;
}

export async function submitDepositAction(formData) {
  const user = await requireUser();
  const amount = Number(formData.get("amount"));
  const methodId = String(formData.get("methodId") || "");
  const referenceNote = String(formData.get("referenceNote") || "").trim() || null;
  const file = formData.get("proof");

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Enter a valid deposit amount." };
  }
  if (!methodId) {
    return { ok: false, message: "Select a payment method." };
  }

  const method = await prisma.depositMethod.findFirst({
    where: { id: methodId, isActive: true },
  });
  if (!method) {
    return { ok: false, message: "Payment method unavailable." };
  }

  let proofImageUrl = null;
  try {
    proofImageUrl = await saveProof(file);
  } catch {
    return { ok: false, message: "Failed to upload receipt image." };
  }

  try {
    const deposit = await prisma.$transaction(async (tx) => {
      const created = await tx.deposit.create({
        data: {
          userId: user.id,
          methodId: method.id,
          amount,
          referenceNote,
          proofImageUrl,
          status: "APPROVED",
          reviewedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: amount } },
      });
      await payReferralCommissions(user.id, amount, tx);
      return created;
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/deposit");
    revalidatePath("/dashboard/wallet");
    revalidatePath("/dashboard/referrals");
    revalidatePath("/admin");
    revalidatePath("/admin/deposits");
    revalidatePath("/admin/users");
    return {
      ok: true,
      data: serialize(deposit),
      message: "Deposit credited. Your balance is updated.",
    };
  } catch {
    return { ok: false, message: "Failed to credit deposit." };
  }
}

export async function reviewDepositAction({ id, action, adminNote }) {
  const admin = await requireAdmin();
  if (!["APPROVED", "REJECTED"].includes(action)) {
    return { ok: false, message: "Invalid action." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const deposit = await tx.deposit.findUnique({ where: { id } });
      if (!deposit || deposit.status !== "PENDING") {
        throw new Error("Deposit is not pending.");
      }

      await tx.deposit.update({
        where: { id },
        data: {
          status: action,
          adminNote: adminNote || null,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });

      if (action === "APPROVED") {
        await tx.user.update({
          where: { id: deposit.userId },
          data: { balance: { increment: toNumber(deposit.amount) } },
        });
        await payReferralCommissions(deposit.userId, deposit.amount, tx);
      }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/deposits");
    revalidatePath("/admin/users");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/wallet");
    revalidatePath("/dashboard/referrals");
    return { ok: true, message: `Deposit ${action.toLowerCase()}.` };
  } catch (e) {
    return { ok: false, message: e.message || "Review failed." };
  }
}
