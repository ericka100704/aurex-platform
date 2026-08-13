"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import PasswordInput from "@/components/ui/PasswordInput";
import { LegalFooter } from "@/components/legal/LegalLayout";
import { resetPasswordAction } from "@/actions/auth";

export default function ResetPasswordForm({ token = "" }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setPending(true);
    setMessage("");
    const result = await resetPasswordAction(new FormData(e.currentTarget));
    if (result?.ok === false) {
      setMessage(result.message);
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div className="glass-card w-full max-w-md p-8">
        <Logo />
        <h1 className="mt-6 font-display text-3xl text-white">Invalid link</h1>
        <p className="mt-2 text-sm text-white/45">Request a new password reset.</p>
        <Link href="/forgot-password" className="btn-gold mt-6 w-full">
          Forgot password
        </Link>
        <LegalFooter />
      </div>
    );
  }

  return (
    <div className="glass-card w-full max-w-md p-8">
      <Logo />
      <h1 className="mt-6 font-display text-3xl text-white">New password</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input type="hidden" name="token" value={token} />
        <PasswordInput name="password" placeholder="New password (min 6)" minLength={6} required />
        <PasswordInput name="confirm" placeholder="Confirm password" minLength={6} required />
        <button type="submit" className="btn-gold w-full" disabled={pending}>
          {pending ? "Saving..." : "Update password"}
        </button>
        {message ? <p className="text-center text-xs text-rose">{message}</p> : null}
      </form>
      <p className="mt-4 text-center text-xs text-white/40">
        <Link href="/login" className="text-gold hover:underline">
          Back to sign in
        </Link>
      </p>
      <LegalFooter />
    </div>
  );
}
