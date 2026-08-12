"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import PasswordInput from "@/components/ui/PasswordInput";
import { registerAction } from "@/actions/auth";

export default function RegisterForm({ referralCode = "" }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setPending(true);
    setMessage("");
    const formData = new FormData(e.currentTarget);
    const result = await registerAction(formData);
    if (result?.ok === false) {
      setMessage(result.message);
      setPending(false);
    }
  }

  return (
    <div className="glass-card w-full max-w-md p-8">
      <Logo />
      <h1 className="mt-6 font-display text-3xl text-white">Create account</h1>
      <p className="mt-1 text-sm text-white/45">Join AUREX</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input className="input-luxury" name="fullName" placeholder="Full name" required />
        <input className="input-luxury" type="email" name="email" placeholder="Email" required />
        <input className="input-luxury" name="phone" placeholder="Phone (optional)" />
        <PasswordInput
          name="password"
          placeholder="Password (min 6)"
          minLength={6}
          required
        />
        <input
          className="input-luxury"
          name="referralCode"
          placeholder="Referral code (optional)"
          defaultValue={referralCode}
        />
        <button type="submit" className="btn-rose w-full" disabled={pending}>
          {pending ? "Creating..." : "Create account"}
        </button>
        {message ? (
          <p className="text-center text-xs text-rose">{message}</p>
        ) : null}
      </form>
      <p className="mt-4 text-center text-xs text-white/40">
        Already registered?{" "}
        <Link href="/login" className="text-gold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
