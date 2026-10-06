"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import { deleteUserAction, updateUserAction } from "@/actions/admin";

const STATUS_STYLES = {
  ACTIVE:
    "border-emerald-400/40 bg-emerald-400/15 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.15)]",
  SUSPENDED:
    "border-amber-400/40 bg-amber-400/15 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.12)]",
  BANNED:
    "border-red-400/40 bg-red-400/15 text-red-300 shadow-[0_0_12px_rgba(248,113,113,0.12)]",
};

const STATUS_DOT = {
  ACTIVE: "bg-emerald-400",
  SUSPENDED: "bg-amber-400",
  BANNED: "bg-red-400",
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
        String(user.referralCode || "").toLowerCase().includes(term) ||
        String(user.referredByName || "").toLowerCase().includes(term) ||
        String(user.referredByCode || "").toLowerCase().includes(term)
      );
    });
  }, [users, q, status]);

  function patchLocal(id, patch) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  async function changeStatus(user, nextStatus) {
    if (nextStatus === user.status) return;
    const previous = user.status;
    patchLocal(user.id, { status: nextStatus });
    setMessage("");
    setBusyId(user.id);
    const result = await updateUserAction({
      id: user.id,
      status: nextStatus,
    });
    if (!result.ok) {
      patchLocal(user.id, { status: previous });
      setMessage(result.message || "Failed to update status.");
    } else {
      setMessage(result.message || "Status updated.");
      if (result.data) {
        patchLocal(user.id, {
          balance: result.data.balance,
          status: result.data.status,
        });
      }
    }
    setBusyId(null);
  }

  async function removeUser(user) {
    const ok = window.confirm(
      `Remove account "${user.fullName}" (${user.email})?\nThis cannot be undone.`
    );
    if (!ok) return;
    setMessage("");
    setBusyId(user.id);
    const result = await deleteUserAction(user.id);
    if (result.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setMessage(result.message || "Account removed.");
    } else {
      setMessage(result.message || "Failed to remove account.");
    }
    setBusyId(null);
  }

  return (
    <GlassCard hover={false} className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-white/5 px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="font-display text-lg text-white">User Management</h3>
          <p className="text-xs text-white/45">
            Status saves automatically. Use Remove to permanently delete a user
            account.
          </p>
          {message ? <p className="mt-1 text-xs text-gold">{message}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input-luxury min-w-[12rem] py-2 text-sm"
            placeholder="Search name, email, ref, or referrer"
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
              <th className="px-4 py-3">Referred by</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/40">
                  No users found
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="list-row-hover border-t border-white/5 text-white/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{user.fullName}</p>
                    <p className="text-[11px] text-white/40">{user.email}</p>
                    <p className="text-[11px] text-gold/70">Own code: {user.referralCode}</p>
                  </td>
                  <td className="px-4 py-3">
                    {user.referredByName ? (
                      <>
                        <p className="text-sm text-white">{user.referredByName}</p>
                        <p className="text-[11px] text-white/40">{user.referredByCode}</p>
                      </>
                    ) : (
                      <p className="text-xs text-white/40">Direct signup</p>
                    )}
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
                        className={`w-full appearance-none rounded-full border py-2 pl-7 pr-8 text-[11px] font-semibold uppercase tracking-wider outline-none transition focus:ring-1 focus:ring-gold/40 disabled:opacity-60 ${STATUS_STYLES[user.status] || STATUS_STYLES.ACTIVE}`}
                        value={user.status}
                        disabled={busyId === user.id || user.role === "ADMIN"}
                        onChange={(e) => changeStatus(user, e.target.value)}
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
                    {user.role === "ADMIN" ? (
                      <span className="text-[11px] text-white/35">Protected</span>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === user.id}
                        onClick={() => removeUser(user)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-400/35 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-400/20 disabled:opacity-60"
                      >
                        {busyId === user.id ? (
                          <Spinner className="h-3.5 w-3.5" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Remove
                      </button>
                    )}
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
