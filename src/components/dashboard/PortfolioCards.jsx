import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";

export default function PortfolioCards({ investments = [], compact = false }) {
  const items = investments.slice(0, compact ? 2 : 4);

  return (
    <GlassCard
      hover={false}
      className={compact ? "!rounded-[1.75rem]" : "h-full !rounded-[1.75rem]"}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-white">My Portfolio</h3>
          <p className="mt-1 text-xs text-white/40">Active & recent investments</p>
        </div>
        <Link
          href="/dashboard/investments"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition hover:border-magenta/40 hover:text-white"
        >
          See all
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div
          className={
            compact
              ? "flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-white/40"
              : "flex h-44 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-white/40"
          }
        >
          No investments yet
        </div>
      ) : (
        <div className={compact ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "grid grid-cols-2 gap-4"}>
          {items.map((inv) => (
            <div
              key={inv.id}
              className="rounded-2xl border border-white/[0.07] bg-black/25 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-medium text-white">
                  {inv.planName || inv.plan?.name || "Plan"}
                </p>
                <StatusBadge status={inv.status} />
              </div>
              <p className="mt-3 font-display text-lg text-gold">
                {formatCurrency(inv.amount)}
              </p>
              <p className="mt-1 text-xs text-emerald-300/90">
                +{formatCurrency(inv.earnedAmount)} earned
              </p>
              <p className="mt-2 text-[11px] text-white/35">
                Daily {formatCurrency(inv.dailyReturn)}
              </p>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
