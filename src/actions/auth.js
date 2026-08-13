"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  createSessionToken,
  requireUser,
  setSessionCookie,
} from "@/lib/auth";
import { createReferralChain } from "@/lib/business";
import { generateReferralCode } from "@/lib/utils";
import { getSettingsMap, settingBool } from "@/lib/settings";
import { clearRateLimit, rateLimit } from "@/lib/rateLimit";
import { createRawToken, hashToken, tokenExpiry } from "@/lib/tokens";
import { sendResetEmail, sendVerifyEmail } from "@/lib/mail";
import { verifyEmailByToken } from "@/lib/emailAuth";
import { uploadAvatar } from "@/lib/storage";
import { createNotification } from "@/lib/notifications";

async function issueSession(user) {
  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.fullName,
  });
  await setSessionCookie(token);
}

function clientKey(email) {
  const forwarded = headers().get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0].trim() || headers().get("x-real-ip") || "local";
  return `${ip}:${email}`;
}

async function issueEmailVerify(userId, email) {
  const raw = createRawToken();
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerifyToken: hashToken(raw),
      emailVerifyExpires: tokenExpiry(24),
    },
  });
  await sendVerifyEmail(email, raw);
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
  const agreed = String(formData.get("agree") || "") === "1";
  if (!agreed) {
    return { ok: false, message: "You must agree to the Terms, Privacy Policy, and Risk Disclosure." };
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

  await issueEmailVerify(user.id, user.email);
  await createNotification({
    userId: user.id,
    type: "account",
    title: "Welcome to AUREX",
    body: "Your account is ready. Verify your email, then deposit to start a plan.",
    href: "/dashboard",
  });
  await issueSession(user);
  redirect("/dashboard");
}

export async function loginAction(formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { ok: false, message: "Email and password are required." };
  }

  const limit = rateLimit({ key: `login:${clientKey(email)}`, limit: 5 });
  if (!limit.ok) return { ok: false, message: limit.message };

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

  clearRateLimit(`login:${clientKey(email)}`);
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

export async function forgotPasswordAction(formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const generic = "If that email is registered, we sent a reset link.";

  if (!email) return { ok: false, message: "Enter your email." };

  const limit = rateLimit({
    key: `reset:${clientKey(email)}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) return { ok: false, message: limit.message };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status === "BANNED") {
    return { ok: true, message: generic };
  }

  const raw = createRawToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashToken(raw),
      passwordResetExpires: tokenExpiry(1),
    },
  });
  await sendResetEmail(user.email, raw);
  return { ok: true, message: generic };
}

export async function resetPasswordAction(formData) {
  const raw = String(formData.get("token") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!raw) return { ok: false, message: "Reset link is invalid." };
  if (password.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters." };
  }
  if (password !== confirm) {
    return { ok: false, message: "Passwords do not match." };
  }

  const hashed = hashToken(raw);
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashed,
      passwordResetExpires: { gt: new Date() },
    },
  });
  if (!user) {
    return { ok: false, message: "Reset link is invalid or expired." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  await createNotification({
    userId: user.id,
    type: "account",
    title: "Password reset",
    body: "Your password was reset using the email link. If this wasn’t you, contact support.",
    href: user.role === "ADMIN" ? "/admin/profile" : "/dashboard/profile",
  });

  await issueSession(user);
  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}

export async function verifyEmailAction(rawToken) {
  return verifyEmailByToken(rawToken);
}

export async function resendVerifyEmailAction() {
  const user = await requireUser();
  if (user.emailVerifiedAt) {
    return { ok: true, message: "Email is already verified." };
  }
  const limit = rateLimit({
    key: `verify:${user.id}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) return { ok: false, message: limit.message };

  await issueEmailVerify(user.id, user.email);
  return { ok: true, message: "Verification email sent. Check your inbox (or server logs in dev)." };
}

export async function updateProfileAction(formData) {
  const user = await requireUser();
  const fullName = String(formData.get("fullName") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const avatar = formData.get("avatar");

  if (!fullName) return { ok: false, message: "Name is required." };

  const data = { fullName, phone };
  try {
    if (avatar && typeof avatar !== "string" && avatar.size > 0) {
      data.avatarUrl = await uploadAvatar(avatar, user.id);
    }
  } catch (error) {
    return { ok: false, message: error.message || "Photo upload failed." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data,
  });
  await createNotification({
    userId: user.id,
    type: "account",
    title: "Profile updated",
    body: data.avatarUrl
      ? "Your profile photo and details were saved."
      : "Your name and contact details were saved.",
    href: user.role === "ADMIN" ? "/admin/profile" : "/dashboard/profile",
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/admin");
  revalidatePath("/admin/profile");
  return { ok: true, message: "Profile updated." };
}

export async function changePasswordAction(formData) {
  const user = await requireUser();
  const current = String(formData.get("current") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 6) {
    return { ok: false, message: "New password must be at least 6 characters." };
  }
  if (password !== confirm) {
    return { ok: false, message: "Passwords do not match." };
  }

  const row = await prisma.user.findUnique({ where: { id: user.id } });
  const valid = await bcrypt.compare(current, row.passwordHash);
  if (!valid) return { ok: false, message: "Current password is incorrect." };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  await createNotification({
    userId: user.id,
    type: "account",
    title: "Password changed",
    body: "Your password was updated. If this wasn’t you, reset it immediately.",
    href: user.role === "ADMIN" ? "/admin/profile" : "/dashboard/profile",
  });
  return { ok: true, message: "Password changed." };
}
