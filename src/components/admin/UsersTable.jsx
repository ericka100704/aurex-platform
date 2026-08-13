"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { formatCurrency } from "@/lib/utils";
import { updateUserAction } from "@/actions/admin";

const STATUS_STYLES = {
  ACTIVE:
    "border-emerald-400/40 bg-emerald-400/15 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.15)]",
  SUSPENDED:
    "border-amber-400/40 bg-amber-400/15 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.12)]",
  BANNED:
    "border-rose-400/40 bg-rose-400/15 text-rose-300 shadow-[0_0_12px_rgba(251,113,133,0.12)]",
};

const STATUS_DOT = {
  ACTIVE: "bg-emerald-400",
  SUSPENDED: "bg-amber-400",
  BANNED: "bg-rose-400",
};

const FILTERS = ["ALL", "ACTIVE", "SUSPENDED", "BANNED"];

export default function UsersTable({ initialUsers = [] }) {
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((user) => {
      if (status !== "ALL" && user.status !== status) return false;
      if (!term) return true;
      return (
        String(user.fullName || "").toLowerCase().includes(term) ||
        String(user.email || "").toLowerCase().includes(term) ||
        String(user.referralCode || "").toLowerCase().includes(term)
      );
    });
  }, [users, q, status]);

  function patchLocal(id, patch) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  async function saveStatus(user) {
    setMessage("");
    setBusyId(user.id);
    const result = await updateUserAction({
      id: user.id,
      status: user.status,
    });
    setMessage(result.message || (result.ok ? "Status updated." : "Failed"));
    if (result.ok && result.data) {
      patchLocal(user.id, {
        balance: result.data.balance,
        status: result.data.status,
      });
    }
    setBusyId(null);
  }

  return (
    <GlassCard hover={false} className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-white/5 px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="font-display text-lg text-white">User Management</h3>
          <p className="text-xs text-white/45">
            Balance is read-only (deposits, invest, withdraw only). Admin can update status.
          </p>
          {message ? <p className="mt-1 text-xs text-gold">{message}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input-luxury min-w-[12rem] py-2 text-sm"
            placeholder="Search name, email, or ref code"
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
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Save</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/40">
                  No users found
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="border-t border-white/5 text-white/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{user.fullName}</p>
                    <p className="text-[11px] text-white/40">{user.email}</p>
                    <p className="text-[11px] text-gold/70">Ref: {user.referralCode}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gold">{formatCurrency(user.balance)}</p>
                    <p className="mt-1 text-[10px] text-white/35">Via transactions only</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative w-[150px]">
                      <span
                        className={`pointer-events-none absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${STATUS_DOT[user.status] || "bg-white/40"}`}
                      />
                      <select
                        className={`w-full appearance-none rounded-full border py-2 pl-7 pr-8 text-[11px] font-semibold uppercase tracking-wider outline-none transition focus:ring-1 focus:ring-gold/40 ${STATUS_STYLES[user.status] || STATUS_STYLES.ACTIVE}`}
                        value={user.status}
                        onChange={(e) => patchLocal(user.id, { status: e.target.value })}
                      >
                        <option value="ACTIVE" className="bg-dark text-emerald-300">
                          Active
                        </option>
                        <option value="SUSPENDED" className="bg-dark text-amber-300">
                          Suspended
                        </option>
                        <option value="BANNED" className="bg-dark text-rose-300">
                          Banned
                        </option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-70" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs uppercase tracking-wide text-gold">
                    {user.role}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busyId === user.id}
                      onClick={() => saveStatus(user)}
                      className="btn-gold !px-3 !py-1.5 text-xs"
                    >
                      {busyId === user.id ? "Saving..." : "Save status"}
                    </button>
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
