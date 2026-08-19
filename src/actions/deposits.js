"use server";

import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import { payReferralCommissions } from "@/lib/business";
import {
  fulfillPendingDeposit,
  revalidateWalletPaths,
} from "@/lib/depositFulfill";
import {
  createCheckoutSession,
  expireCheckoutSession,
  getPaidPayment,
  isPaymongoConfigured,
  retrieveCheckoutSession,
} from "@/lib/paymongo";
import { serialize, toNumber } from "@/lib/serialize";
import { createNotification, formatCurrency, notifyAdmins } from "@/lib/notifications";
import { uploadDepositProof } from "@/lib/storage";
import { adjustWallet } from "@/lib/ledger";

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

  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, message: "Upload a receipt photo." };
  }

  let proofImageUrl = null;
  try {
    proofImageUrl = await uploadDepositProof(file, user.id);
  } catch (error) {
    return {
      ok: false,
      message: error.message || "Failed to upload receipt image.",
    };
  }
  if (!proofImageUrl) {
    return { ok: false, message: "Upload a receipt photo." };
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
          provider: "manual",
          status: "PENDING",
        },
      });

      await createNotification(
        {
          userId: user.id,
          type: "deposit",
          title: "Deposit submitted",
          body: `${formatCurrency(amount)} is waiting for admin review.`,
          href: "/dashboard/deposit",
        },
        tx
      );
      await notifyAdmins(
        {
          type: "admin_deposit",
          title: "Deposit pending review",
          body: `${user.fullName} submitted ${formatCurrency(amount)} via ${method.name}.`,
          href: "/admin/deposits",
        },
        tx
      );
      return created;
    });

    revalidateWalletPaths();
    return {
      ok: true,
      data: serialize(deposit),
      message: "Receipt submitted. Your wallet will credit after admin approval.",
    };
  } catch {
    return { ok: false, message: "Failed to submit deposit." };
  }
}

export async function reviewDepositAction({ id, action, adminNote }) {
  const admin = await requireAdmin();
  if (!["APPROVED", "REJECTED"].includes(action)) {
    return { ok: false, message: "Invalid action." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const deposit = await tx.deposit.findUnique({
        where: { id },
        include: { user: { select: { fullName: true } } },
      });
      if (!deposit || deposit.status !== "PENDING") {
        throw new Error("Deposit is not pending.");
      }
      if (deposit.provider === "paymongo") {
        throw new Error(
          "PayMongo deposits credit automatically when paid. Do not approve unpaid checkouts."
        );
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
        await adjustWallet(tx, {
          userId: deposit.userId,
          type: "DEPOSIT",
          amount: toNumber(deposit.amount),
          refType: "deposit",
          refId: deposit.id,
          note: "Manual deposit approved",
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
      } else {
        await createNotification(
          {
            userId: deposit.userId,
            type: "deposit",
            title: "Deposit rejected",
            body: adminNote
              ? `${formatCurrency(deposit.amount)} was rejected. ${adminNote}`
              : `${formatCurrency(deposit.amount)} deposit was rejected.`,
            href: "/dashboard/deposit",
          },
          tx
        );
      }
    });

    revalidateWalletPaths();
    return { ok: true, message: `Deposit ${action.toLowerCase()}.` };
  } catch (e) {
    return { ok: false, message: e.message || "Review failed." };
  }
}

const QR_TTL_MS = 30 * 60 * 1000;

export async function initiatePaymongoDepositAction({ methodId, amount }) {
  const user = await requireUser();
  const pesos = Number(amount);

  if (!isPaymongoConfigured()) {
    return {
      ok: false,
      useManual: true,
      message: "Online GCash payments are not configured yet.",
    };
  }
  if (!Number.isFinite(pesos) || pesos <= 0) {
    return { ok: false, message: "Enter a valid deposit amount." };
  }
  if (!methodId) {
    return { ok: false, message: "Select a payment method." };
  }

  const method = await prisma.depositMethod.findFirst({
    where: { id: String(methodId), isActive: true },
  });
  if (!method) {
    return { ok: false, useManual: true, message: "Use the receipt form for this method." };
  }

  const previous = await prisma.deposit.findMany({
    where: {
      userId: user.id,
      status: "PENDING",
      provider: "paymongo",
    },
    select: { id: true, providerSessionId: true },
  });

  await Promise.all(
    previous.map((row) => expireCheckoutSession(row.providerSessionId))
  );

  if (previous.length) {
    await prisma.deposit.updateMany({
      where: { id: { in: previous.map((row) => row.id) } },
      data: {
        status: "CANCELLED",
        adminNote: "Replaced by a new payment QR",
      },
    });
  }

  const deposit = await prisma.deposit.create({
    data: {
      userId: user.id,
      methodId: method.id,
      amount: pesos,
      status: "PENDING",
      provider: "paymongo",
      expiresAt: new Date(Date.now() + QR_TTL_MS),
    },
  });

  try {
    const session = await createCheckoutSession({
      amount: pesos,
      depositId: deposit.id,
      methodType: method.type,
      description: `AUREX deposit — ${user.email}`,
      customer: user,
    });
    const checkoutUrl = session?.data?.attributes?.checkout_url;
    const sessionId = session?.data?.id;
    if (!checkoutUrl || !sessionId) {
      throw new Error("PayMongo did not return a checkout URL.");
    }

    const qrDataUrl = await QRCode.toDataURL(checkoutUrl, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#ffffff" },
    });

    const updated = await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        providerSessionId: sessionId,
        checkoutUrl,
        referenceNote: sessionId,
      },
    });

    return {
      ok: true,
      depositId: updated.id,
      checkoutUrl,
      qrDataUrl,
      expiresAt: updated.expiresAt,
      amount: pesos,
      methodName: method.name,
      methodType: method.type,
      message: `Scan the ${method.name} QR or open checkout to pay. Your deposit will credit automatically.`,
    };
  } catch (error) {
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        status: "CANCELLED",
        adminNote: error.message || "PayMongo checkout failed",
      },
    });
    return {
      ok: false,
      message: error.message || "Failed to create GCash payment.",
    };
  }
}

export async function getDepositPaymentStatusAction(depositId) {
  const user = await requireUser();
  if (!depositId) return { ok: false, message: "Missing deposit." };

  const deposit = await prisma.deposit.findFirst({
    where: { id: String(depositId), userId: user.id },
  });
  if (!deposit) return { ok: false, message: "Deposit not found." };

  if (deposit.status === "APPROVED") {
    return {
      ok: true,
      status: "APPROVED",
      amount: toNumber(deposit.amount),
      message: "We received your deposit. Your wallet has been credited.",
    };
  }

  if (
    deposit.status === "PENDING" &&
    deposit.expiresAt &&
    new Date(deposit.expiresAt).getTime() < Date.now()
  ) {
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { status: "CANCELLED", adminNote: "QR / checkout expired" },
    });
    return {
      ok: true,
      status: "CANCELLED",
      message: "This QR expired. Enter the amount again to generate a new one.",
    };
  }

  if (
    deposit.status === "PENDING" &&
    deposit.provider === "paymongo" &&
    deposit.providerSessionId &&
    isPaymongoConfigured()
  ) {
    try {
      const session = await retrieveCheckoutSession(deposit.providerSessionId);
      const paid = getPaidPayment(session);
      if (paid) {
        const result = await fulfillPendingDeposit({
          depositId: deposit.id,
          sessionId: deposit.providerSessionId,
          paymentId: paid.id,
          paidAmountCentavos: paid.amount,
        });
        if (result.ok) {
          return {
            ok: true,
            status: "APPROVED",
            message: "We received your deposit. Your wallet has been credited.",
          };
        }
      }
    } catch {
      // Keep waiting — webhook may still arrive.
    }
  }

  return {
    ok: true,
    status: deposit.status,
    checkoutUrl: deposit.checkoutUrl || null,
    amount: toNumber(deposit.amount),
    message:
      deposit.status === "PENDING"
        ? "Waiting for GCash payment…"
        : `Deposit is ${deposit.status.toLowerCase()}.`,
  };
}

export async function generateGcashAmountQrAction(amount, methodId) {
  await requireUser();
  const pesos = Number(amount);
  if (!Number.isFinite(pesos) || pesos <= 0) {
    return { ok: false, message: "Enter a valid deposit amount." };
  }

  const method = methodId
    ? await prisma.depositMethod.findFirst({
        where: { id: String(methodId), isActive: true },
      })
    : await prisma.depositMethod.findFirst({
        where: { type: "GCASH", isActive: true },
        orderBy: { sortOrder: "asc" },
      });

  const payload = [
    method?.name || "AUREX",
    method?.accountName || "MABEL HULAR",
    method?.accountNumber || "",
    `PHP ${pesos.toFixed(2)}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const qrDataUrl = await QRCode.toDataURL(payload, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#ffffff" },
    });
    return { ok: true, qrDataUrl, amount: pesos };
  } catch (error) {
    return {
      ok: false,
      message: error.message || "Could not generate the payment QR.",
    };
  }
}
