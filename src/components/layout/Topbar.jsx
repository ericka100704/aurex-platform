"use client";

import Link from "next/link";
import { Menu, Settings } from "lucide-react";
import LogoutButton from "@/components/layout/LogoutButton";
import NotificationBell from "@/components/layout/NotificationBell";

export default function Topbar({
  title,
  subtitle,
  userName = "Investor",
  avatarUrl = "",
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
    <header className="relative z-40 px-4 pb-2 pt-3 md:px-10 md:pb-3 md:pt-5 lg:px-12">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-[#121212]/95 px-3.5 py-3 md:gap-6 md:rounded-[1.75rem] md:px-7 md:py-5">
        <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/[0.04] p-1.5 text-white/70 md:p-2 lg:hidden"
            aria-label="Open menu"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl text-white md:text-3xl">
              {variant === "user" ? `Welcome, ${firstName}` : title}
            </h1>
            <p className="mt-0.5 truncate text-xs text-white/45 md:mt-1 md:text-sm">
              {subtitle ||
                (variant === "user"
                  ? "Here's your investment portfolio overview."
                  : "")}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
          <NotificationBell />
          <Link
            href={variant === "user" ? "/dashboard/profile" : "/admin/profile"}
            className="rounded-full border border-white/10 bg-white/[0.04] p-2.5 text-white/65 transition hover:border-magenta/40 hover:text-white"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>

          <Link
            href={variant === "user" ? "/dashboard/profile" : "/admin/profile"}
            className="shrink-0 overflow-hidden rounded-full border border-white/10"
            aria-label="Profile"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-9 w-9 object-cover md:h-10 md:w-10"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center bg-pink-glow text-[11px] font-bold text-white shadow-glow md:h-10 md:w-10 md:text-xs">
                {initials}
              </span>
            )}
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
