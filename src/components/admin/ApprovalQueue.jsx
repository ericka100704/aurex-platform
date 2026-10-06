"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";

export default function ApprovalQueue({
  title,
  subtitle,
  items: initialItems = [],
  type = "deposit",
  showStatus = true,
  /** When false, show status badges only (history lists — no second Approve). */
  allowActions = true,
  emptyLabel = "Queue empty",
  collapsible = false,
  defaultOpen = true,
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState(null);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  async function review(id, status) {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type, id, action: status }),
      });
      const result = await res.json().catch(() => null);
      if (!result?.ok) {
        const msg = result?.message || "Action failed";
        // Already processed (e.g. approved from another tab / stale UI)
        if (/not pending/i.test(msg)) {
          setItems((prev) => prev.filter((item) => item.id !== id));
          router.refresh();
          return;
        }
        alert(msg);
        return;
      }
      // Leave pending queue after approve/reject
      setItems((prev) => prev.filter((item) => item.id !== id));
      router.refresh();
    } catch (error) {
      alert(error.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  const header = (
    <div className={open || !collapsible ? "border-b border-white/5 px-5 py-4" : "px-5 py-4"}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-white">{title}</h3>
          <p className="text-xs text-white/45">
            {subtitle || `Approve or reject ${type} requests`}
            {collapsible ? ` · ${items.length}` : ""}
          </p>
        </div>
        {collapsible ? (
          <ChevronDown
            className={`mt-1 h-5 w-5 shrink-0 text-white/45 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        ) : null}
      </div>
    </div>
  );

  return (
    <GlassCard hover={false} className="overflow-hidden p-0">
      {collapsible ? (
        <button
          type="button"
          className="w-full text-left transition hover:bg-white/[0.02]"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {header}
        </button>
      ) : (
        header
      )}

      {open || !collapsible ? (
        <ul className="divide-y divide-white/5">
          {items.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-white/40">{emptyLabel}</li>
          ) : (
            items.map((item) => (
              <li
                key={item.id}
                className="list-row-hover flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-white">{item.user}</p>
                  <p className="text-sm text-gold">{formatCurrency(item.amount)}</p>
                  <p className="text-[11px] text-white/40">
                    {item.method}
                    {item.accountDetails ? ` · ${item.accountDetails}` : ""}
                    {" · "}
                    {item.createdAt}
                    {item.hasProof || item.proofImageUrl ? (
                      <>
                        {" · "}
                        <a
                          href={
                            type === "deposit"
                              ? `/api/admin/deposit-proof/${item.id}`
                              : item.proofImageUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-rose underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Proof
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>
                {showStatus ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    {allowActions && item.status === "PENDING" ? (
                      <>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => review(item.id, "APPROVED")}
                          className="btn-gold !px-3 !py-1.5 text-xs"
                        >
                          {busyId === item.id ? "Saving…" : "Approve"}
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
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </GlassCard>
  );
}
