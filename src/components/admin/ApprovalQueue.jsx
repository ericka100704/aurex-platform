"use client";

import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { reviewDepositAction } from "@/actions/deposits";
import { reviewWithdrawalAction } from "@/actions/withdrawals";

export default function ApprovalQueue({
  title,
  subtitle,
  items: initialItems = [],
  type = "deposit",
}) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState(null);

  async function review(id, status) {
    setBusyId(id);
    const result =
      type === "deposit"
        ? await reviewDepositAction({ id, action: status })
        : await reviewWithdrawalAction({ id, action: status });

    if (result.ok) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } else {
      alert(result.message || "Action failed");
    }
    setBusyId(null);
  }

  return (
    <GlassCard hover={false} className="overflow-hidden p-0">
      <div className="border-b border-white/5 px-5 py-4">
        <h3 className="font-display text-lg text-white">{title}</h3>
        <p className="text-xs text-white/45">
          {subtitle || `Approve or reject ${type} requests`}
        </p>
      </div>
      <ul className="divide-y divide-white/5">
        {items.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-white/40">Queue empty</li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-white">{item.user}</p>
                <p className="text-sm text-gold">{formatCurrency(item.amount)}</p>
                <p className="text-[11px] text-white/40">
                  {item.method} · {item.createdAt}
                  {item.proofImageUrl ? (
                    <>
                      {" · "}
                      <a
                        href={item.proofImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-rose underline"
                      >
                        Proof
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={item.status} />
                {item.status === "PENDING" ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => review(item.id, "APPROVED")}
                      className="btn-gold !px-3 !py-1.5 text-xs"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => review(item.id, "REJECTED")}
                      className="btn-ghost !px-3 !py-1.5 text-xs"
                    >
                      Reject
                    </button>
                  </>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </GlassCard>
  );
}
