"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

export default function RecentRegistrations({
  registrations = [],
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <GlassCard hover={false} className="overflow-hidden p-0">
      <div
        className={`flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
          open ? "border-b border-white/5" : ""
        }`}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left transition hover:opacity-90"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <div className="min-w-0">
            <h3 className="font-display text-lg text-white">Recent Sign-ups</h3>
            <p className="text-xs text-white/45">
              New registrations and whose referral code they used · {registrations.length}
            </p>
          </div>
          <ChevronDown
            className={`mt-1 h-5 w-5 shrink-0 text-white/45 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
        <Link href="/admin/users" className="shrink-0 text-xs text-gold hover:underline">
          View all users →
        </Link>
      </div>

      {open ? (
        <ul className="divide-y divide-white/5">
          {registrations.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-white/40">No registrations yet</li>
          ) : (
            registrations.map((user) => (
              <li
                key={user.id}
                className="list-row-hover flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-white">{user.fullName}</p>
                  <p className="text-[11px] text-white/40">{user.email}</p>
                  <p className="text-[11px] text-white/35">{user.createdAt}</p>
                </div>
                <div className="text-left sm:text-right">
                  {user.referredByName ? (
                    <>
                      <p className="text-xs text-white/55">Referred by</p>
                      <p className="text-sm text-gold">{user.referredByName}</p>
                      <p className="text-[11px] text-white/40">Code: {user.referredByCode}</p>
                    </>
                  ) : (
                    <p className="text-xs text-white/45">Direct signup · no referral</p>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </GlassCard>
  );
}
