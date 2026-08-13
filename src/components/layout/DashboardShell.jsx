"use client";

import { useState } from "react";
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
  avatarUrl,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dash-shell min-h-screen">
      <Sidebar
        variant={variant}
        baseHref={baseHref}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-[260px]">
        <Topbar
          title={title}
          subtitle={subtitle}
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          variant={variant}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 pb-12 pt-4 md:px-10 md:pb-14 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
