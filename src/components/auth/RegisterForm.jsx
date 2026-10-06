"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import PasswordInput from "@/components/ui/PasswordInput";
import Spinner from "@/components/ui/Spinner";
import { LegalFooter } from "@/components/legal/LegalLayout";
import { registerAction } from "@/actions/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS_CLASS = {
  ok: "!border-emerald-400/70 !ring-2 !ring-emerald-400/30 focus:!border-emerald-400",
  error: "!border-red-400/70 !ring-2 !ring-red-400/35 focus:!border-red-400",
};

function emailStatus(value) {
  if (!value) return undefined;
  return EMAIL_RE.test(value.trim()) ? "ok" : "error";
}

function passwordStatus(value) {
  if (!value) return undefined;
  return value.length >= 6 ? "ok" : "error";
}

function confirmStatus(password, confirm) {
  if (!confirm) return undefined;
  return confirm === password && password.length >= 6 ? "ok" : "error";
}

export default function RegisterForm({ referralCode = "" }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (password.length < 6 || password !== confirm) {
      setMessage(
        password !== confirm
          ? "Passwords do not match."
          : "Password must be at least 6 characters."
      );
      return;
    }
    setPending(true);
    setMessage("");
    const formData = new FormData(e.currentTarget);
    formData.delete("confirm");
    const result = await registerAction(formData);
    if (result?.ok === false) {
      setMessage(result.message);
      setPending(false);
    }
  }

  const emailState = emailStatus(email);
  const matchOk = password.length >= 6 && password === confirm;

  return (
    <div className="glass-card w-full max-w-md p-8">
      <Logo />
      <h1 className="mt-6 font-display text-3xl text-white">Create account</h1>
      <p className="mt-1 text-sm text-white/45">Join SOLANA</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input className="input-luxury" name="fullName" placeholder="Full name" required />
        <input
          className={`input-luxury ${emailState ? STATUS_CLASS[emailState] : ""}`}
          type="email"
          name="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={emailState === "error"}
        />
        <input className="input-luxury" name="phone" placeholder="Phone (optional)" />
        <PasswordInput
          name="password"
          placeholder="Password (min 6)"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          status={passwordStatus(password)}
        />
        <PasswordInput
          name="confirm"
          placeholder="Confirm password"
          minLength={6}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          status={confirmStatus(password, confirm)}
        />
        {confirm ? (
          <p className={`text-xs ${matchOk ? "text-emerald-400" : "text-red-400"}`}>
            {matchOk ? "Passwords match." : "Passwords do not match."}
          </p>
        ) : null}
        <input
          className="input-luxury"
          name="referralCode"
          placeholder="Referral code (optional)"
          defaultValue={referralCode}
        />
        <label className="flex items-start gap-2 text-[11px] leading-relaxed text-white/50">
          <input
            type="checkbox"
            name="agree"
            value="1"
            required
            className="mt-0.5 accent-[#8A2BE2]"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-gold hover:underline" target="_blank">
              Terms
            </Link>
            ,{" "}
            <Link href="/privacy" className="text-gold hover:underline" target="_blank">
              Privacy Policy
            </Link>
            , and{" "}
            <Link href="/risk" className="text-gold hover:underline" target="_blank">
              Risk Disclosure
            </Link>
            .
          </span>
        </label>
        <button
          type="submit"
          className="btn-rose w-full"
          disabled={pending || !matchOk || emailState === "error"}
        >
          {pending ? (
            <>
              <Spinner className="h-4 w-4" />
              Creating...
            </>
          ) : (
            "Create account"
          )}
        </button>
        {message ? (
          <p className="text-center text-xs text-red-400">{message}</p>
        ) : null}
      </form>
      <p className="mt-4 text-center text-xs text-white/40">
        Already registered?{" "}
        <Link href="/login" className="text-gold hover:underline">
          Sign in
        </Link>
      </p>
      <LegalFooter />
    </div>
  );
}
