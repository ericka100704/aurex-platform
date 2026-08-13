"use client";

import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import FileUpload from "@/components/ui/FileUpload";
import { submitDepositAction } from "@/actions/deposits";

export default function DepositForm({ methods = [] }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    setMessage("");
    const formData = new FormData(e.currentTarget);
    const result = await submitDepositAction(formData);
    setMessage(result.message);
    if (result.ok) {
      e.currentTarget.reset();
      setUploadKey((k) => k + 1);
    }
    setPending(false);
  }

  if (!methods.length) {
    return (
      <GlassCard hover={false}>
        <h3 className="font-display text-lg text-white">Deposit Funds</h3>
        <p className="mt-2 text-sm text-white/45">
          No active payment methods. Ask admin to enable GCash or GoTyme.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard hover={false}>
      <h3 className="font-display text-lg text-white">Deposit Funds</h3>
      <p className="text-xs text-white/45">Upload proof — pending admin approval</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs text-white/50">Payment Method</label>
          <select className="input-luxury" name="methodId" required defaultValue={methods[0].id}>
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.accountNumber}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Amount (₱)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            required
            name="amount"
            className="input-luxury"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Reference Note</label>
          <input
            className="input-luxury"
            name="referenceNote"
            placeholder="Optional transfer reference"
          />
        </div>
        <FileUpload key={uploadKey} name="proof" accept="image/*" label="Receipt / Proof" />
        <button type="submit" className="btn-rose w-full" disabled={pending}>
          {pending ? "Submitting..." : "Submit Deposit"}
        </button>
        {message ? <p className="text-center text-xs text-gold">{message}</p> : null}
      </form>
    </GlassCard>
  );
}
