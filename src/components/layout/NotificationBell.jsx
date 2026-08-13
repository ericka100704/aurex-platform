"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications";

const HREF_BY_TYPE = {
  investment: "/dashboard/plans",
  deposit: "/dashboard/deposit",
  withdrawal: "/dashboard/withdraw",
  referral: "/dashboard/referrals",
  referral_join: "/dashboard/referrals",
  referral_commission: "/dashboard/referrals",
  roi: "/dashboard/wallet",
  account: "/dashboard/profile",
  admin_deposit: "/admin/deposits",
  admin_withdrawal: "/admin/withdrawals",
  update: "/dashboard",
};

function notificationHref(item) {
  if (item.href) return item.href;
  return HREF_BY_TYPE[item.type] || "/dashboard";
}

function timeAgo(value) {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const rootRef = useRef(null);

  async function load() {
    const result = await getNotificationsAction();
    if (!result?.ok && !result?.items) return;
    setItems(result.items || []);
    setUnread(result.unread || 0);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  async function openPanel() {
    const next = !open;
    setOpen(next);
    if (next) await load();
  }

  async function readOne(id) {
    await markNotificationReadAction(id);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item
      )
    );
    setUnread((n) => Math.max(0, n - 1));
  }

  async function readAll() {
    await markAllNotificationsReadAction();
    setItems((prev) =>
      prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }))
    );
    setUnread(0);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="relative rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/65 transition hover:border-magenta/40 hover:text-white md:p-2.5"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={openPanel}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-glow px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-[60] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-medium text-white">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                className="text-[11px] text-gold hover:underline"
                onClick={readAll}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-[22rem] overflow-y-auto">
            {items.length ? (
              items.map((item) => {
                const unreadItem = !item.readAt;
                const href = notificationHref(item);
                return (
                  <Link
                    key={item.id}
                    href={href}
                    className={`block border-b border-white/[0.06] px-4 py-3 text-left transition hover:bg-white/[0.04] ${
                      unreadItem ? "bg-magenta/[0.06]" : ""
                    }`}
                    onClick={() => {
                      if (unreadItem) void readOne(item.id);
                      setOpen(false);
                    }}
                  >
                    <p className={`text-sm ${unreadItem ? "text-white" : "text-white/70"}`}>
                      {item.title}
                    </p>
                    {item.body ? (
                      <p className="mt-0.5 text-[12px] leading-snug text-white/45">{item.body}</p>
                    ) : null}
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-white/30">
                      {timeAgo(item.createdAt)}
                    </p>
                  </Link>
                );
              })
            ) : (
              <p className="px-4 py-8 text-center text-sm text-white/40">
                No transactions or updates yet.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
