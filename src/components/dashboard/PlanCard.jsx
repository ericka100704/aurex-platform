"use client";

import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { calcDailyReturn, formatCurrency, formatPercent } from "@/lib/utils";
import { investAction } from "@/actions/investments";

export default function PlanCard({ plan, delay = 0, canInvest = true }) {
  const [amount, setAmount] = useState(String(plan.minAmount));
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const sampleDaily = calcDailyReturn(plan.minAmount, plan.dailyReturnPct);

  async function handleInvest() {
    setPending(true);
    setMessage("");
    const result = await investAction({ planId: plan.id, amount: Number(amount) });
    setMessage(result.message || (result.ok ? "Invested." : "Failed."));
    setPending(false);
  }

  return (
    <GlassCard delay={delay} className="flex h-full flex-col !rounded-[1.75rem]" glow>
      <div className="relative z-10 mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-xl text-white">{plan.name}</h3>
          <p className="mt-1 text-sm text-white/45">{plan.description}</p>
        </div>
        <span className="rounded-full border border-magenta/35 bg-magenta/10 px-2.5 py-1 text-[11px] text-magenta">
          {plan.durationDays}d
        </span>
      </div>

      <div className="metallic-line relative z-10 my-3" />

      <dl className="relative z-10 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-white/35">Daily ROI</dt>
          <dd className="mt-0.5 font-medium text-gold">
            {formatPercent(plan.dailyReturnPct)}
          </dd>
        </div>
        <div>
          <dt className="text-white/35">Total ROI</dt>
          <dd className="mt-0.5 font-medium text-magenta">
            {formatPercent(plan.totalReturnPct)}
          </dd>
        </div>
        <div>
          <dt className="text-white/35">Min Invest</dt>
          <dd className="mt-0.5 text-white">{formatCurrency(plan.minAmount)}</dd>
        </div>
        <div>
          <dt className="text-white/35">Daily @ Min</dt>
          <dd className="mt-0.5 text-white">{formatCurrency(sampleDaily)}</dd>
        </div>
      </dl>

      {canInvest ? (
        <div className="relative z-10 mt-4 space-y-2">
          <input
            type="number"
            className="input-luxury"
            min={plan.minAmount}
            max={plan.maxAmount || undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            type="button"
            disabled={pending}
            onClick={handleInvest}
            className="btn-rose w-full disabled:opacity-60"
          >
            {pending ? "Processing..." : "Invest Now"}
          </button>
          {message ? (
            <p className="text-center text-xs text-gold">{message}</p>
          ) : null}
        </div>
      ) : null}
    </GlassCard>
  );
}
