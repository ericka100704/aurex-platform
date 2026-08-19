"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardShell({
  children,
  variant = "user",
  baseHref,
  title,
  subtitle,
  userName,
  userEmail,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <div className="dash-shell min-h-dvh overflow-x-hidden">
      <Sidebar
        variant={variant}
        baseHref={baseHref}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden lg:pl-[260px]">
        <Topbar
          title={title}
          subtitle={subtitle}
          userName={userName}
          userEmail={userEmail}
          variant={variant}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="mx-auto w-full min-w-0 max-w-[1400px] flex-1 px-4 pb-12 pt-4 md:px-10 md:pb-14 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
