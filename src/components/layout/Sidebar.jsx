"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Spinner from "@/components/ui/Spinner";
import { adminNav, userNav } from "@/constants/nav";
import { cn } from "@/lib/utils";

export default function Sidebar({
  variant = "user",
  baseHref = "/dashboard",
  mobileOpen = false,
  onClose,
}) {
  const pathname = usePathname();
  const items = variant === "admin" ? adminNav : userNav;
  const [pendingHref, setPendingHref] = useState(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-[260px] flex-col border-r border-white/[0.06] bg-[#0d0d0d] pt-[env(safe-area-inset-top)] transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col px-5 py-7">
          <div className="px-2">
            <Logo href={baseHref} showText />
          </div>

          <nav className="mt-10 flex flex-1 flex-col gap-2.5">
            {items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== baseHref && pathname?.startsWith(item.href));
              const Icon = item.icon;
              const pending = pendingHref === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => {
                    if (!active) setPendingHref(item.href);
                    onClose?.();
                  }}
                  className={cn(
                    "relative flex items-center gap-3 rounded-full px-4 py-3 text-sm transition-opacity",
                    active
                      ? "bg-nav-active text-white"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white/85",
                    pending ? "opacity-90" : ""
                  )}
                  aria-busy={pending}
                >
                  {pending ? (
                    <Spinner className="h-4 w-4 shrink-0 text-gold" />
                  ) : Icon ? (
                    <Icon className="h-4 w-4 shrink-0" />
                  ) : null}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {variant === "user" ? (
            <div className="mt-auto space-y-1 border-t border-white/[0.06] pt-4">
              <a
                href="mailto:support@solana.app"
                className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white/80"
              >
                <LifeBuoy className="h-4 w-4" />
                Support
              </a>
              <div className="mt-3 rounded-3xl border border-white/[0.06] bg-white/[0.03] p-3 text-xs text-white/45">
                <p className="font-medium text-gold">SOLANA</p>
                <p className="mt-1">Trade · Grow · Succeed</p>
              </div>
            </div>
          ) : (
            <div className="mt-auto rounded-3xl border border-white/[0.06] bg-white/[0.03] p-3 text-xs text-white/45">
              <p className="font-medium text-gold">SOLANA Admin</p>
              <p className="mt-1">Control plans, deposits, and users.</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
