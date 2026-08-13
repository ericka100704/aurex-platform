"use client";

import { useState } from "react";
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
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

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
          <label className="mb-1 block text-xs text-white/50">Method</label>
          <select className="input-luxury" name="methodType" defaultValue={methods[0]}>
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Account Details</label>
          <textarea
            required
            rows={3}
            name="accountDetails"
            className="input-luxury resize-none"
            placeholder="Account name / number"
          />
        </div>
        <button type="submit" className="btn-gold w-full" disabled={pending}>
          {pending ? "Submitting..." : "Request Withdrawal"}
        </button>
        {message ? <p className="text-center text-xs text-gold">{message}</p> : null}
      </form>
    </GlassCard>
  );
}
