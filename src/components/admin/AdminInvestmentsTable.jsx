"use client";

import { useMemo, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

const FILTERS = ["ALL", "ACTIVE", "COMPLETED", "CANCELLED"];

export default function AdminInvestmentsTable({ investments = [] }) {
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return investments.filter((inv) => {
      if (status !== "ALL" && inv.status !== status) return false;
      if (!term) return true;
      return (
        inv.userName.toLowerCase().includes(term) ||
        inv.userEmail.toLowerCase().includes(term) ||
        inv.planName.toLowerCase().includes(term)
      );
    });
  }, [investments, status, q]);

  const locked = investments
    .filter((inv) => inv.status === "ACTIVE")
    .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

  return (
    <GlassCard hover={false} className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-white/5 px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="font-display text-lg text-white">Investments</h3>
          <p className="text-xs text-white/45">
            Who availed a plan · {investments.filter((i) => i.status === "ACTIVE").length}{" "}
            active · {formatCurrency(locked)} locked
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input-luxury min-w-[12rem] py-2 text-sm"
            placeholder="Search user or plan"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-wide ${
                  status === item
                    ? "border-magenta/40 bg-magenta/15 text-white"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Daily</th>
              <th className="px-4 py-3">Earned</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Ends</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-white/40">
                  No investments found
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} className="border-t border-white/5 text-white/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{inv.userName}</p>
                    <p className="text-[11px] text-white/40">{inv.userEmail}</p>
                  </td>
                  <td className="px-4 py-3">{inv.planName}</td>
                  <td className="px-4 py-3 text-gold">{formatCurrency(inv.amount)}</td>
                  <td className="px-4 py-3">{formatCurrency(inv.dailyReturn)}</td>
                  <td className="px-4 py-3 text-magenta">
                    {formatCurrency(inv.earnedAmount)}
                  </td>
                  <td className="px-4 py-3">{formatDate(inv.startDate)}</td>
                  <td className="px-4 py-3">{formatDate(inv.endDate)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
