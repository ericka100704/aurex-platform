"use client";

import Link from "next/link";
import { Menu, Settings } from "lucide-react";
import LogoutButton from "@/components/layout/LogoutButton";
import NotificationBell from "@/components/layout/NotificationBell";

export default function Topbar({
  title,
  subtitle,
  userName = "Investor",
  userEmail = "",
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
            className="hidden rounded-full border border-white/10 bg-white/[0.04] p-2.5 text-white/65 transition hover:border-magenta/40 hover:text-white sm:inline-flex"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>

          <Link
            href={variant === "user" ? "/dashboard/profile" : "/admin/profile"}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-2 md:gap-2.5 md:py-1.5 md:pl-1.5 md:pr-3"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover md:h-9 md:w-9"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-glow text-[11px] font-bold text-white shadow-glow md:h-9 md:w-9 md:text-xs">
                {initials}
              </span>
            )}
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              {userEmail ? (
                <p className="truncate text-[11px] text-white/40">{userEmail}</p>
              ) : null}
            </div>
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
