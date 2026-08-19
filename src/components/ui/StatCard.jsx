"use client";

import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  Users,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Coins,
  Share2,
} from "lucide-react";
import GlassCard from "./GlassCard";
import { cn } from "@/lib/utils";

const ICONS = {
  wallet: Wallet,
  trendingUp: TrendingUp,
  piggyBank: PiggyBank,
  users: Users,
  layers: Layers,
  arrowDown: ArrowDownToLine,
  arrowUp: ArrowUpFromLine,
  chart: BarChart3,
  coins: Coins,
  share: Share2,
};

export default function StatCard({
  label,
  value,
  subtext,
  icon = "wallet",
  accent = "gold",
  delay = 0,
  href,
}) {
  const Icon = ICONS[icon] || Wallet;
  const accentClass =
    accent === "rose"
      ? "text-magenta border-magenta/30 bg-magenta/10 shadow-glow-soft"
      : "text-gold border-gold/30 bg-gold/10 shadow-gold";

  const card = (
    <GlassCard
      delay={delay}
      className="relative h-full overflow-hidden !rounded-[1.75rem]"
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-25 md:h-28 md:w-28 md:opacity-30 md:blur-3xl",
          accent === "rose" ? "bg-magenta" : "bg-gold"
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 pr-2">
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">{label}</p>
          <p
            className={cn(
              "mt-3 font-display text-2xl md:text-3xl",
              accent === "rose" ? "text-magenta" : "text-gold"
            )}
          >
            {value}
          </p>
          {subtext ? <p className="mt-2 text-xs leading-relaxed text-white/40">{subtext}</p> : null}
        </div>
        <div className={cn("shrink-0 rounded-2xl border p-3", accentClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </GlassCard>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block h-full cursor-pointer">
      {card}
    </Link>
  );
}
