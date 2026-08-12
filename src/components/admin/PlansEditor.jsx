"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  createPlanAction,
  deletePlanAction,
  updatePlanAction,
} from "@/actions/plans";

const emptyPlan = {
  name: "",
  description: "",
  minAmount: "",
  maxAmount: "",
  dailyReturnPct: "",
  durationDays: "",
  totalReturnPct: "",
  status: "ACTIVE",
};

export default function PlansEditor({ initialPlans = [] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [form, setForm] = useState(emptyPlan);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyPlan);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    setMessage("");
    const payload = {
      ...form,
      id: editingId,
      minAmount: Number(form.minAmount),
      maxAmount: form.maxAmount ? Number(form.maxAmount) : null,
      dailyReturnPct: Number(form.dailyReturnPct),
      durationDays: Number(form.durationDays),
      totalReturnPct: Number(form.totalReturnPct),
    };

    const result = editingId
      ? await updatePlanAction(payload)
      : await createPlanAction(payload);

    if (result.ok) {
      if (editingId) {
        setPlans((prev) => prev.map((p) => (p.id === editingId ? result.data : p)));
      } else {
        setPlans((prev) => [...prev, result.data]);
      }
      resetForm();
      setMessage(editingId ? "Plan updated." : "Plan created.");
    } else {
      setMessage(result.message || "Failed to save plan.");
    }
    setPending(false);
  }

  function editPlan(plan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description || "",
      minAmount: String(plan.minAmount),
      maxAmount: plan.maxAmount != null ? String(plan.maxAmount) : "",
      dailyReturnPct: String(plan.dailyReturnPct),
      durationDays: String(plan.durationDays),
      totalReturnPct: String(plan.totalReturnPct),
      status: plan.status,
    });
  }

  async function removePlan(id) {
    if (!confirm("Delete or archive this plan?")) return;
    const result = await deletePlanAction(id);
    if (result.ok) {
      setPlans((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) resetForm();
      setMessage("Plan removed/archived.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <GlassCard hover={false} className="xl:col-span-2">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-gold" />
          <h3 className="font-display text-lg text-white">
            {editingId ? "Edit Plan" : "Create Plan"}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="input-luxury"
            placeholder="Plan name"
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
          <textarea
            className="input-luxury resize-none"
            rows={2}
            placeholder="Description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input-luxury"
              type="number"
              placeholder="Min amount"
              required
              value={form.minAmount}
              onChange={(e) => updateField("minAmount", e.target.value)}
            />
            <input
              className="input-luxury"
              type="number"
              placeholder="Max amount"
              value={form.maxAmount}
              onChange={(e) => updateField("maxAmount", e.target.value)}
            />
            <input
              className="input-luxury"
              type="number"
              step="0.0001"
              placeholder="Daily %"
              required
              value={form.dailyReturnPct}
              onChange={(e) => updateField("dailyReturnPct", e.target.value)}
            />
            <input
              className="input-luxury"
              type="number"
              step="0.01"
              placeholder="Total %"
              required
              value={form.totalReturnPct}
              onChange={(e) => updateField("totalReturnPct", e.target.value)}
            />
            <input
              className="input-luxury"
              type="number"
              placeholder="Duration days"
              required
              value={form.durationDays}
              onChange={(e) => updateField("durationDays", e.target.value)}
            />
            <select
              className="input-luxury"
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-gold flex-1" disabled={pending}>
              {pending ? "Saving..." : editingId ? "Update Plan" : "Create Plan"}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} className="btn-ghost">
                Cancel
              </button>
            ) : null}
          </div>
          {message ? <p className="text-xs text-gold">{message}</p> : null}
        </form>
      </GlassCard>

      <GlassCard hover={false} className="overflow-hidden p-0 xl:col-span-3">
        <div className="border-b border-white/5 px-5 py-4">
          <h3 className="font-display text-lg text-white">Plans Catalog</h3>
          <p className="text-xs text-white/45">Live database CRUD</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Daily</th>
                <th className="px-4 py-3">Range</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-t border-white/5 text-white/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{plan.name}</p>
                    <p className="text-[11px] text-white/40">{plan.durationDays} days</p>
                  </td>
                  <td className="px-4 py-3 text-gold">
                    {formatPercent(plan.dailyReturnPct)}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(plan.minAmount)}
                    {plan.maxAmount ? ` – ${formatCurrency(plan.maxAmount)}` : "+"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={plan.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editPlan(plan)}
                        className="rounded-lg border border-white/10 p-1.5 text-white/70 hover:border-gold/40 hover:text-gold"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePlan(plan.id)}
                        className="rounded-lg border border-white/10 p-1.5 text-white/70 hover:border-rose/40 hover:text-rose"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
