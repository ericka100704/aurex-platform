"use client";

import Link from "next/link";
import { Bell, Menu, Settings } from "lucide-react";
import LogoutButton from "@/components/layout/LogoutButton";

export default function Topbar({
  title,
  subtitle,
  userName = "Investor",
  userEmail = "",
  variant = "user",
  onMenuClick,
}) {
  const firstName = userName.split(" ")[0] || userName;
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 isolate px-5 pb-3 pt-5 md:px-10 lg:px-12">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 rounded-[1.75rem] border border-white/[0.06] bg-[#121212]/95 px-5 py-5 md:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/70 lg:hidden"
            aria-label="Open menu"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="font-display text-2xl text-white md:text-3xl">
              {variant === "user" ? `Welcome, ${firstName}` : title}
            </h1>
            <p className="mt-1 text-sm text-white/45">
              {subtitle ||
                (variant === "user"
                  ? "Here's your investment portfolio overview."
                  : "")}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/[0.04] p-2.5 text-white/65 transition hover:border-magenta/40 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <Link
            href={variant === "user" ? "/dashboard/wallet" : "/admin/settings"}
            className="hidden rounded-full border border-white/10 bg-white/[0.04] p-2.5 text-white/65 transition hover:border-magenta/40 hover:text-white sm:inline-flex"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-glow text-xs font-bold text-white shadow-glow">
              {initials}
            </span>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              {userEmail ? (
                <p className="truncate text-[11px] text-white/40">{userEmail}</p>
              ) : null}
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
