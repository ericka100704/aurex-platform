const WEAK = new Set([
  "",
  "dev-only-aurex-secret",
  "change-me-to-a-long-random-secret",
]);

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim() || "";
  if (process.env.NODE_ENV === "production" && WEAK.has(secret)) {
    throw new Error("JWT_SECRET must be a strong unique value in production.");
  }
  return secret || "dev-only-aurex-secret";
}
