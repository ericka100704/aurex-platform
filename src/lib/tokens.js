import crypto from "crypto";

export function createRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

export function tokenExpiry(hours = 1) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
