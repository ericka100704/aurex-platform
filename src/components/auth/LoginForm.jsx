"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import PasswordInput from "@/components/ui/PasswordInput";
import Spinner from "@/components/ui/Spinner";
import { LegalFooter } from "@/components/legal/LegalLayout";
import { loginAction } from "@/actions/auth";

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

export default function LoginForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setPending(true);
    setMessage("");
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    if (result?.ok === false) {
      setMessage(result.message);
      setPending(false);
    }
  }

  const emailState = emailStatus(email);
  const passwordState = passwordStatus(password);

  return (
    <div className="glass-card w-full max-w-md p-8">
      <Logo />
      <h1 className="mt-6 font-display text-3xl text-white">Welcome back</h1>
      <p className="mt-1 text-sm text-white/45">Sign in to SOLANA</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
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
        <PasswordInput
          name="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          status={passwordState}
        />
        <p className="text-right text-xs">
          <Link href="/forgot-password" className="text-gold/80 hover:underline">
            Forgot password?
          </Link>
        </p>
        <button type="submit" className="btn-gold w-full" disabled={pending}>
          {pending ? (
            <>
              <Spinner className="h-4 w-4" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
        {message ? (
          <p className="text-center text-xs text-red-400">{message}</p>
        ) : null}
      </form>
      <p className="mt-4 text-center text-xs text-white/40">
        No account?{" "}
        <Link href="/register" className="text-rose hover:underline">
          Register
        </Link>
      </p>
      <LegalFooter />
    </div>
  );
}
