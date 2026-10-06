"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Thin top bar on internal link clicks — no full-screen block (loading.js handles content). */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const hideTimer = useRef(null);
  const routeKey = `${pathname}?${searchParams?.toString() || ""}`;

  useEffect(() => {
    if (!pending) return undefined;
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setPending(false), 180);
    return () => clearTimeout(hideTimer.current);
  }, [routeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pending) return undefined;
    const safety = setTimeout(() => setPending(false), 12000);
    return () => clearTimeout(safety);
  }, [pending]);

  useEffect(() => {
    function onClick(e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = e.target?.closest?.("a[href]");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (/^https?:\/\//i.test(href)) return;

      try {
        const next = new URL(href, window.location.origin);
        if (next.origin !== window.location.origin) return;
        const current = `${window.location.pathname}${window.location.search}`;
        const target = `${next.pathname}${next.search}`;
        if (current === target) return;
      } catch {
        return;
      }

      clearTimeout(hideTimer.current);
      setPending(true);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!pending) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[3px] overflow-hidden bg-white/5 lg:left-[260px]"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="nav-progress-bar h-full w-1/2 bg-gold-gradient shadow-[0_0_12px_rgba(138,43,226,0.65)]" />
    </div>
  );
}
