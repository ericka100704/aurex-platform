"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export default function ReferralPanel({
  referralCode,
  referrals = [],
  tabs = false,
  compact = false,
}) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("network");
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${referralCode}`
      : `https://aurex.app/register?ref=${referralCode}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* noop */
    }
  }

  const sorted = [...referrals].sort(
    (a, b) => Number(b.earned || 0) - Number(a.earned || 0)
  );
  const shown =
    tab === "gain"
      ? sorted.filter((r) => Number(r.earned) > 0)
      : tab === "idle"
        ? sorted.filter((r) => Number(r.earned) <= 0)
        : sorted;

  return (
    <GlassCard
      hover={false}
      className={compact ? "!rounded-[1.75rem]" : "h-full !rounded-[1.75rem]"}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-white">Referral Network</h3>
          <p className="mt-1 text-xs text-white/40">Share your link and earn commission</p>
        </div>
        {tabs ? (
          <div className="flex flex-wrap gap-2">
            {[
              { id: "network", label: "All" },
              { id: "gain", label: "Earning" },
              { id: "idle", label: "Pending" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn("pill !px-3 !py-1.5", tab === item.id && "pill-active")}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input readOnly value={link} className="input-luxury flex-1 text-xs" />
        <button type="button" onClick={copyLink} className="btn-ghost shrink-0 !rounded-2xl">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <ul
        className={
          compact
            ? "mt-4 max-h-32 space-y-2.5 overflow-y-auto pr-1"
            : "mt-5 max-h-64 space-y-2.5 overflow-y-auto pr-1"
        }
      >
        {shown.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/35">
            No referrals in this view yet
          </li>
        ) : (
          shown.map((ref) => (
            <li
              key={ref.id}
              className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2.5"
            >
              <div>
                <p className="text-sm text-white">{ref.name}</p>
                <p className="text-[11px] text-white/35">Joined {formatDate(ref.joined)}</p>
              </div>
              <span className="text-sm text-emerald-300/90">
                +{formatCurrency(ref.earned)}
              </span>
            </li>
          ))
        )}
      </ul>
    </GlassCard>
  );
}
