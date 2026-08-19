"use client";

import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import {
  createDepositMethodAction,
  deleteDepositMethodAction,
  toggleDepositMethodAction,
  updateDepositMethodAction,
} from "@/actions/admin";

const EMPTY_FORM = {
  name: "",
  type: "GCASH",
  accountName: "",
  accountNumber: "",
};

export default function DepositMethodsEditor({ initialMethods = [] }) {
  const [methods, setMethods] = useState(initialMethods);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    if (editingId) {
      const result = await updateDepositMethodAction({ id: editingId, ...form });
      if (result.ok) {
        setMethods((prev) => prev.map((m) => (m.id === editingId ? result.data : m)));
        setEditingId(null);
        setForm(EMPTY_FORM);
        setMessage("Method updated.");
      } else {
        setMessage(result.message || "Failed to update.");
      }
      return;
    }

    const result = await createDepositMethodAction(form);
    if (result.ok) {
      setMethods((prev) => [...prev, result.data]);
      setForm(EMPTY_FORM);
      setMessage("Method added.");
    } else {
      setMessage(result.message || "Failed.");
    }
  }

  function startEdit(method) {
    setEditingId(method.id);
    setForm({
      name: method.name || "",
      type: method.type || "GCASH",
      accountName: method.accountName || "",
      accountNumber: method.accountNumber || "",
    });
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMessage("");
  }

  async function toggleActive(id) {
    setBusyId(id);
    const result = await toggleDepositMethodAction(id);
    if (result.ok) {
      setMethods((prev) => prev.map((m) => (m.id === id ? result.data : m)));
    }
    setBusyId(null);
  }

  async function removeMethod(id) {
    const confirmed = window.confirm("Delete this payment method? Existing deposits stay, but this account is removed.");
    if (!confirmed) return;
    setBusyId(id);
    const result = await deleteDepositMethodAction(id);
    if (result.ok) {
      setMethods((prev) => prev.filter((m) => m.id !== id));
      if (editingId === id) cancelEdit();
      setMessage("Method deleted.");
    } else {
      setMessage(result.message || "Failed to delete.");
    }
    setBusyId(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassCard hover={false}>
        <h3 className="font-display text-lg text-white">
          {editingId ? "Edit Deposit Method" : "Add Deposit Method"}
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
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
            <option value="MAYA">Maya</option>
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
            {editingId ? "Save Changes" : "Add Method"}
          </button>
          {editingId ? (
            <button type="button" className="btn-ghost w-full" onClick={cancelEdit}>
              Cancel edit
            </button>
          ) : null}
          {message ? <p className="text-xs text-gold">{message}</p> : null}
        </form>
      </GlassCard>

      <GlassCard hover={false}>
        <h3 className="font-display text-lg text-white">Payment Methods</h3>
        <ul className="mt-4 space-y-3">
          {methods.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(m)}
                  className="btn-ghost !px-3 !py-1.5 text-xs"
                  disabled={busyId === m.id}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeMethod(m.id)}
                  className="btn-ghost !px-3 !py-1.5 text-xs !text-rose-300"
                  disabled={busyId === m.id}
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(m.id)}
                  disabled={busyId === m.id}
                  className={
                    m.isActive
                      ? "btn-ghost !px-3 !py-1.5 text-xs"
                      : "btn-rose !px-3 !py-1.5 text-xs"
                  }
                >
                  {m.isActive ? "Disable" : "Enable"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
