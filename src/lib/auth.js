import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { getJwtSecret } from "@/lib/jwtSecret";

const COOKIE_NAME = "solana_session";

function getSecret() {
  return new TextEncoder().encode(getJwtSecret());
}

export async function createSessionToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Fast shell auth from the JWT only (no DB). Use in dashboard/admin layouts
 * so nav between pages does not wait on a user row round-trip.
 */
export const getShellUser = cache(async () => {
  const session = await getSession();
  if (!session?.sub) return null;
  return {
    id: String(session.sub),
    email: session.email ? String(session.email) : "",
    fullName: session.name ? String(session.name) : "Member",
    role: session.role === "ADMIN" ? "ADMIN" : "USER",
  };
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      status: true,
      balance: true,
      referralCode: true,
      referredById: true,
      createdAt: true,
      emailVerifiedAt: true,
    },
  });

  if (!user || user.status === "BANNED") return null;
  return serialize(user);
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("Unauthorized");
    err.code = "UNAUTHORIZED";
    throw err;
  }
  if (user.status === "SUSPENDED") {
    const err = new Error("Account suspended");
    err.code = "SUSPENDED";
    throw err;
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    const err = new Error("Forbidden");
    err.code = "FORBIDDEN";
    throw err;
  }
  return user;
}

export { COOKIE_NAME };
