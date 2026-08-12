"use client";

import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import {
  createDepositMethodAction,
  toggleDepositMethodAction,
} from "@/actions/admin";

export default function DepositMethodsEditor({ initialMethods = [] }) {
  const [methods, setMethods] = useState(initialMethods);
  const [form, setForm] = useState({
    name: "",
    type: "GCASH",
    accountName: "",
    accountNumber: "",
  });
  const [message, setMessage] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    const result = await createDepositMethodAction(form);
    if (result.ok) {
      setMethods((prev) => [...prev, result.data]);
      setForm({ name: "", type: "GCASH", accountName: "", accountNumber: "" });
      setMessage("Method added.");
    } else {
      setMessage(result.message || "Failed.");
    }
  }

  async function toggleActive(id) {
    const result = await toggleDepositMethodAction(id);
    if (result.ok) {
      setMethods((prev) => prev.map((m) => (m.id === id ? result.data : m)));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassCard hover={false}>
        <h3 className="font-display text-lg text-white">Add Deposit Method</h3>
        <form onSubmit={handleAdd} className="mt-4 space-y-3">
          <input
            className="input-luxury"
            placeholder="Display name"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <select
            className="input-luxury"
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          >
            <option value="GCASH">GCash</option>
            <option value="GOTYME">GoTyme</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CRYPTO">Crypto</option>
            <option value="CUSTOM">Custom</option>
          </select>
          <input
            className="input-luxury"
            placeholder="Account name"
            value={form.accountName}
            onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value }))}
          />
          <input
            className="input-luxury"
            placeholder="Account number / wallet"
            value={form.accountNumber}
            onChange={(e) =>
              setForm((p) => ({ ...p, accountNumber: e.target.value }))
            }
          />
          <button type="submit" className="btn-gold w-full">
            Add Method
          </button>
          {message ? <p className="text-xs text-gold">{message}</p> : null}
        </form>
      </GlassCard>

      <GlassCard hover={false}>
        <h3 className="font-display text-lg text-white">Payment Methods</h3>
        <ul className="mt-4 space-y-3">
          {methods.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3"
            >
              <div>
                <p className="text-sm text-white">
                  {m.name}{" "}
                  <span className="text-[11px] text-white/40">({m.type})</span>
                </p>
                <p className="text-xs text-gold">
                  {m.accountName} · {m.accountNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleActive(m.id)}
                className={
                  m.isActive
                    ? "btn-ghost !px-3 !py-1.5 text-xs"
                    : "btn-rose !px-3 !py-1.5 text-xs"
                }
              >
                {m.isActive ? "Disable" : "Enable"}
              </button>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
