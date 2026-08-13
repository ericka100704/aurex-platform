"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { LegalFooter } from "@/components/legal/LegalLayout";
import { forgotPasswordAction } from "@/actions/auth";

export default function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setPending(true);
    setMessage("");
    const result = await forgotPasswordAction(new FormData(e.currentTarget));
    setOk(Boolean(result?.ok));
    setMessage(result?.message || "");
    setPending(false);
  }

  return (
    <div className="glass-card w-full max-w-md p-8">
      <Logo />
      <h1 className="mt-6 font-display text-3xl text-white">Forgot password</h1>
      <p className="mt-1 text-sm text-white/45">
        We&apos;ll email a reset link if the account exists.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          className="input-luxury"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <button type="submit" className="btn-gold w-full" disabled={pending}>
          {pending ? "Sending..." : "Send reset link"}
        </button>
        {message ? (
          <p className={`text-center text-xs ${ok ? "text-emerald-400" : "text-rose"}`}>
            {message}
          </p>
        ) : null}
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
