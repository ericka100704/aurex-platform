"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import PasswordInput from "@/components/ui/PasswordInput";
import { loginAction } from "@/actions/auth";

export default function LoginForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

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

  return (
    <div className="glass-card w-full max-w-md p-8">
      <Logo />
      <h1 className="mt-6 font-display text-3xl text-white">Welcome back</h1>
      <p className="mt-1 text-sm text-white/45">Sign in to AUREX</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          className="input-luxury"
          type="email"
          name="email"
          placeholder="Email"
          required
          defaultValue="demo@aurex.app"
        />
        <PasswordInput
          name="password"
          placeholder="Password"
          required
          defaultValue="user123"
        />
        <button type="submit" className="btn-gold w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </button>
        {message ? (
          <p className="text-center text-xs text-rose">{message}</p>
        ) : null}
      </form>
      <p className="mt-4 text-center text-xs text-white/40">
        No account?{" "}
        <Link href="/register" className="text-rose hover:underline">
          Register
        </Link>
      </p>
      <p className="mt-3 text-center text-[11px] text-white/30">
        Admin: admin@aurex.app / admin123
      </p>
    </div>
  );
}
