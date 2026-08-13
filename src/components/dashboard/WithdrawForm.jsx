"use client";

import { useMemo, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { formatCurrency } from "@/lib/utils";
import { requestWithdrawalAction } from "@/actions/withdrawals";

export default function WithdrawForm({
  balance = 0,
  minWithdrawal = 500,
  windowStart = "06:00",
  windowEnd = "16:00",
  releaseTime = "21:00",
  methods = ["GCash", "GoTyme"],
  defaultName = "",
  defaultPhone = "",
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [method, setMethod] = useState(methods[0] || "GCash");

  const numberLabel = useMemo(() => {
    const key = String(method || "").toLowerCase();
    if (key.includes("gcash")) return "GCash number";
    if (key.includes("maya") || key.includes("paymaya")) return "Maya number";
    if (key.includes("gotyme")) return "GoTyme number";
    return "Wallet / mobile number";
  }, [method]);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    setMessage("");
    try {
      const formData = new FormData(form);
      const result = await requestWithdrawalAction(formData);
      setMessage(result.message);
      if (result.ok) form.reset();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <GlassCard hover={false}>
      <h3 className="font-display text-lg text-white">Withdraw</h3>
      <p className="text-xs text-white/45">
        Available: {formatCurrency(balance)} · Min {formatCurrency(minWithdrawal)}
      </p>
      <p className="mt-1 text-[11px] text-gold/80">
        Requests: {windowStart}–{windowEnd} (Asia/Manila) · Release batch: {releaseTime}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs text-white/50">Amount</label>
          <input type="number" min="1" step="0.01" required name="amount" className="input-luxury" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Send to</label>
          <select
            className="input-luxury"
            name="methodType"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Account name</label>
          <input
            className="input-luxury"
            name="accountName"
            defaultValue={defaultName}
            placeholder="Name registered on the wallet"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">{numberLabel}</label>
          <input
            className="input-luxury"
            name="accountNumber"
            type="tel"
            inputMode="numeric"
            defaultValue={defaultPhone}
            placeholder="09XXXXXXXXX"
            required
          />
          <p className="mt-1 text-[11px] text-white/40">
            Payout is sent to this number. Use the 11-digit mobile on your {method} account.
          </p>
        </div>
        <button type="submit" className="btn-gold w-full" disabled={pending}>
          {pending ? "Submitting..." : "Request Withdrawal"}
        </button>
        {message ? <p className="text-center text-xs text-gold">{message}</p> : null}
      </form>
    </GlassCard>
  );
}
