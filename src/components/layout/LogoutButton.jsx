"use client";

import { logoutAction } from "@/actions/auth";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs font-medium text-white/60 md:px-3"
      >
        Logout
      </button>
    </form>
  );
}
