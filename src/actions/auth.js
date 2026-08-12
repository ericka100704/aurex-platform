"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";
import { createReferralChain } from "@/lib/business";
import { generateReferralCode } from "@/lib/utils";
import { getSettingsMap, settingBool } from "@/lib/settings";

async function issueSession(user) {
  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.fullName,
  });
  await setSessionCookie(token);
}

export async function registerAction(formData) {
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const phone = String(formData.get("phone") || "").trim() || null;
  const referralInput = String(formData.get("referralCode") || "").trim().toUpperCase();

  if (!fullName || !email || password.length < 6) {
    return { ok: false, message: "Name, email, and password (min 6 chars) are required." };
  }

  const settings = await getSettingsMap();
  if (settingBool(settings, "is_kyc_required", false)) {
    return { ok: false, message: "KYC is required before registration." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, message: "Email is already registered." };
  }

  let referrer = null;
  if (referralInput) {
    referrer = await prisma.user.findUnique({ where: { referralCode: referralInput } });
    if (!referrer) {
      return { ok: false, message: "Invalid referral code." };
    }
  }

  let referralCode = generateReferralCode(fullName);
  while (await prisma.user.findUnique({ where: { referralCode } })) {
    referralCode = generateReferralCode(fullName);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phone,
      passwordHash,
      referralCode,
      referredById: referrer?.id || null,
      role: "USER",
      status: "ACTIVE",
      balance: 0,
    },
  });

  if (referrer) {
    await createReferralChain(user.id, referrer.id);
  }

  await issueSession(user);
  redirect("/dashboard");
}

export async function loginAction(formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { ok: false, message: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { ok: false, message: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { ok: false, message: "Invalid email or password." };
  }

  if (user.status === "BANNED") {
    return { ok: false, message: "This account has been banned." };
  }

  await issueSession(user);

  if (user.role === "ADMIN") {
    redirect("/admin");
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
