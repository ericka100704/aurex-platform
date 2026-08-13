"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";
import GlassCard from "@/components/ui/GlassCard";
import {
  changePasswordAction,
  resendVerifyEmailAction,
  updateProfileAction,
} from "@/actions/auth";

export default function ProfileForm({ user }) {
  const [profileMsg, setProfileMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [verifyMsg, setVerifyMsg] = useState("");
  const [pending, setPending] = useState("");
  const [pwOpen, setPwOpen] = useState(false);
  const [preview, setPreview] = useState(user.avatarUrl || "");
  const fileRef = useRef(null);

  useEffect(() => {
    setPreview(user.avatarUrl || "");
  }, [user.avatarUrl]);

  async function saveProfile(e) {
    e.preventDefault();
    setPending("profile");
    setProfileMsg("");
    const result = await updateProfileAction(new FormData(e.currentTarget));
    setProfileMsg(result.message || (result.ok ? "Saved." : "Failed."));
    setPending("");
  }

  async function savePassword(e) {
    e.preventDefault();
    setPending("password");
    setPasswordMsg("");
    const result = await changePasswordAction(new FormData(e.currentTarget));
    setPasswordMsg(result.message || (result.ok ? "Saved." : "Failed."));
    if (result.ok) e.currentTarget.reset();
    setPending("");
  }

  async function resendVerify() {
    setPending("verify");
    setVerifyMsg("");
    const result = await resendVerifyEmailAction();
    setVerifyMsg(result.message || "");
    setPending("");
  }

  const verified = Boolean(user.emailVerifiedAt);
  const initials = String(user.fullName || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-4">
      <GlassCard hover={false}>
        <h3 className="font-display text-lg text-white">Profile</h3>
        <p className="text-xs text-white/45">{user.email}</p>
        {!verified ? (
          <div className="mt-3 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
            Email not verified.
            <button
              type="button"
              className="ml-2 underline"
              disabled={pending === "verify"}
              onClick={resendVerify}
            >
              {pending === "verify" ? "Sending..." : "Resend link"}
            </button>
            {verifyMsg ? <p className="mt-1 text-xs text-white/60">{verifyMsg}</p> : null}
          </div>
        ) : (
          <p className="mt-2 text-xs text-emerald-400">Email verified</p>
        )}
        <form onSubmit={saveProfile} className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs text-white/50">Profile photo</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-pink-glow shadow-glow"
                aria-label="Change profile photo"
              >
                {preview ? (
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                    {initials}
                  </span>
                )}
              </button>
              <div>
                <button
                  type="button"
                  className="btn-ghost text-xs"
                  onClick={() => fileRef.current?.click()}
                >
                  Choose photo
                </button>
                <p className="mt-1 text-[11px] text-white/40">PNG or JPG · max 2MB</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                name="avatar"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = URL.createObjectURL(file);
                  setPreview((prev) => {
                    if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
                    return url;
                  });
                }}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-white/50">Full name</label>
            <input
              className="input-luxury"
              name="fullName"
              defaultValue={user.fullName}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-white/50">Phone</label>
            <input className="input-luxury" name="phone" defaultValue={user.phone || ""} />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn-rose" disabled={pending === "profile"}>
              {pending === "profile" ? "Saving..." : "Save profile"}
            </button>
            {profileMsg ? (
              <span
                className={`ml-3 text-xs ${
                  profileMsg.toLowerCase().includes("fail") ||
                  profileMsg.toLowerCase().includes("must") ||
                  profileMsg.toLowerCase().includes("required")
                    ? "text-rose"
                    : "text-emerald-400"
                }`}
              >
                {profileMsg}
              </span>
            ) : null}
          </div>
        </form>
      </GlassCard>

      <GlassCard hover={false}>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={() => setPwOpen((open) => !open)}
          aria-expanded={pwOpen}
        >
          <h3 className="font-display text-lg text-white">Change password</h3>
          <ChevronDown
            className={`h-5 w-5 text-white/50 transition ${pwOpen ? "rotate-180" : ""}`}
          />
        </button>
        {pwOpen ? (
          <form onSubmit={savePassword} className="mt-5 space-y-3">
            <PasswordInput name="current" placeholder="Current password" required />
            <PasswordInput name="password" placeholder="New password (min 6)" minLength={6} required />
            <PasswordInput name="confirm" placeholder="Confirm new password" minLength={6} required />
            <button type="submit" className="btn-gold" disabled={pending === "password"}>
              {pending === "password" ? "Saving..." : "Update password"}
            </button>
            {passwordMsg ? (
              <span
                className={`ml-3 text-xs ${
                  passwordMsg.toLowerCase().includes("changed") ||
                  passwordMsg.toLowerCase().includes("updated")
                    ? "text-emerald-400"
                    : "text-rose"
                }`}
              >
                {passwordMsg}
              </span>
            ) : null}
          </form>
        ) : (
          <p className="mt-2 text-xs text-white/40">Tap to update your password.</p>
        )}
      </GlassCard>
    </div>
  );
}
