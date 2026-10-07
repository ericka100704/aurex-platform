"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import {
  getNotificationsAction,
  getUnreadCountAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications";

const CACHE_KEY = "solana_notif_cache_v1";
const PREFETCH_MS = 45_000;

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

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(items, unread) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ items, unread, at: Date.now() })
    );
  } catch {
    // ignore quota / private mode
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
  const rootRef = useRef(null);
  const loadGen = useRef(0);

  function computePanelStyle() {
    const el = rootRef.current;
    if (!el || typeof window === "undefined") return null;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    const margin = 12;
    const top = rect.bottom + gap;
    if (window.innerWidth < 768) {
      return { top, left: margin, right: margin, width: "auto" };
    }
    return {
      top,
      right: Math.max(margin, window.innerWidth - rect.right),
      left: "auto",
      width: 352,
    };
  }

  function placePanel() {
    const next = computePanelStyle();
    if (next) setPanelStyle(next);
  }

  const applyResult = useCallback((result) => {
    if (!result?.ok && !result?.items) return;
    const nextItems = result.items || [];
    const nextUnread = result.unread ?? 0;
    setItems(nextItems);
    setUnread(nextUnread);
    writeCache(nextItems, nextUnread);
  }, []);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const gen = ++loadGen.current;
      if (!silent) setLoading(true);
      try {
        const result = await getNotificationsAction();
        if (gen !== loadGen.current) return;
        applyResult(result);
      } finally {
        if (gen === loadGen.current) setLoading(false);
      }
    },
    [applyResult]
  );

  const loadUnread = useCallback(async () => {
    const result = await getUnreadCountAction();
    if (result?.ok) {
      setUnread(result.unread || 0);
      const cached = readCache();
      if (cached) writeCache(cached.items, result.unread || 0);
    }
  }, []);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setItems(cached.items);
      setUnread(cached.unread || 0);
    }
    setHydrated(true);
    void load({ silent: true });
  }, [load]);

  useEffect(() => {
    function tick() {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      void loadUnread();
    }
    const interval = setInterval(tick, PREFETCH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [loadUnread]);

  useEffect(() => {
    function onClick(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    placePanel();
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", placePanel, true);
    return () => {
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", placePanel, true);
    };
  }, [open]);

  function openPanel() {
    const next = !open;
    if (!next) {
      setOpen(false);
      return;
    }
    setPanelStyle(computePanelStyle());
    setOpen(true);
    // Show cache instantly; refresh in background
    void load({ silent: items.length > 0 });
  }

  async function readOne(id) {
    setItems((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item
      );
      writeCache(next, Math.max(0, unread - 1));
      return next;
    });
    setUnread((n) => Math.max(0, n - 1));
    void markNotificationReadAction(id);
  }

  async function readAll() {
    setItems((prev) => {
      const next = prev.map((item) => ({
        ...item,
        readAt: item.readAt || new Date().toISOString(),
      }));
      writeCache(next, 0);
      return next;
    });
    setUnread(0);
    void markAllNotificationsReadAction();
  }

  const showSpinner = loading && !items.length && hydrated;

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
        <div
          className="fixed z-[80] max-h-[min(22rem,calc(100dvh-6rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          style={panelStyle || { visibility: "hidden" }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <p className="text-sm font-medium text-white">Notifications</p>
            <div className="flex items-center gap-2">
              {loading && items.length ? (
                <Spinner className="h-3.5 w-3.5 text-gold/70" />
              ) : null}
              {unread > 0 && !showSpinner ? (
                <button
                  type="button"
                  className="text-[11px] text-gold hover:underline"
                  onClick={readAll}
                >
                  Mark all read
                </button>
              ) : null}
            </div>
          </div>
          <div className="max-h-[22rem] overflow-y-auto">
            {showSpinner ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-10">
                <Spinner className="h-6 w-6 text-gold" />
                <p className="text-xs text-white/40">Loading...</p>
              </div>
            ) : items.length ? (
              items.map((item) => {
                const unreadItem = !item.readAt;
                const href = notificationHref(item);
                return (
                  <Link
                    key={item.id}
                    href={href}
                    prefetch
                    className={`block border-b border-white/[0.06] px-4 py-3 text-left transition hover:bg-white/[0.04] ${
                      unreadItem ? "bg-magenta/[0.06]" : ""
                    }`}
                    onClick={() => {
                      if (unreadItem) void readOne(item.id);
                      setOpen(false);
                    }}
                  >
                    <p className={`break-words text-sm ${unreadItem ? "text-white" : "text-white/70"}`}>
                      {item.title}
                    </p>
                    {item.body ? (
                      <p className="mt-0.5 break-words text-[12px] leading-snug text-white/45">
                        {item.body}
                      </p>
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
