import { createClient } from "@supabase/supabase-js";

export const DEPOSIT_PROOF_BUCKET = "deposit-proofs";
export const AVATAR_BUCKET = "avatars";
const SIGNED_URL_TTL_SEC = 60 * 60;
const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"]);

export function getSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    ""
  );
}

export function isSupabaseStorageConfigured() {
  return Boolean(getSupabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

function getSupabaseAdmin() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function safeExt(name) {
  const ext = String(name || "")
    .split(".")
    .pop()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return ALLOWED_EXT.has(ext) ? ext : "jpg";
}

function contentTypeFor(ext) {
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic" || ext === "heif") return "image/heic";
  return "image/jpeg";
}

async function ensureBucket(supabase) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((bucket) => bucket.name === DEPOSIT_PROOF_BUCKET)) return;

  const { error } = await supabase.storage.createBucket(DEPOSIT_PROOF_BUCKET, {
    public: false,
    fileSizeLimit: MAX_PROOF_BYTES,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ],
  });
  if (error && !String(error.message || "").toLowerCase().includes("already")) {
    throw error;
  }
}

async function ensureAvatarBucket(supabase) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((bucket) => bucket.name === AVATAR_BUCKET)) return;

  const { error } = await supabase.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: MAX_AVATAR_BYTES,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (error && !String(error.message || "").toLowerCase().includes("already")) {
    throw error;
  }
}

export async function uploadAvatar(file, userId) {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Photo must be 2MB or smaller.");
  }

  const ext = safeExt(file.name);
  const objectPath = `${userId}/avatar.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const supabase = getSupabaseAdmin();
  await ensureAvatarBucket(supabase);

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(objectPath, bytes, {
    contentType: contentTypeFor(ext),
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);
  const publicUrl = data?.publicUrl;
  if (!publicUrl) throw new Error("Could not get photo URL.");
  return `${publicUrl}?v=${Date.now()}`;
}

export async function uploadDepositProof(file, userId) {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (file.size > MAX_PROOF_BYTES) {
    throw new Error("Receipt must be 5MB or smaller.");
  }

  const ext = safeExt(file.name);
  const objectPath = `${userId}/deposit_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);

  const { error } = await supabase.storage
    .from(DEPOSIT_PROOF_BUCKET)
    .upload(objectPath, bytes, {
      contentType: contentTypeFor(ext),
      upsert: false,
    });
  if (error) throw error;

  return objectPath;
}

export function isLegacyProofPath(stored) {
  if (!stored) return false;
  return (
    stored.startsWith("/") ||
    stored.startsWith("http://") ||
    stored.startsWith("https://")
  );
}

export async function resolveProofUrl(stored) {
  if (!stored) return null;
  if (isLegacyProofPath(stored)) return stored;
  if (!isSupabaseStorageConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(DEPOSIT_PROOF_BUCKET)
    .createSignedUrl(stored, SIGNED_URL_TTL_SEC);
  if (error) {
    console.error("Failed to sign deposit proof URL:", error.message);
    return null;
  }
  return data?.signedUrl || null;
}

export async function resolveProofUrls(storedPaths) {
  return Promise.all(storedPaths.map((path) => resolveProofUrl(path)));
}
