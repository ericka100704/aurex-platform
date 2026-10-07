"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ensureRoiCatchUpAction } from "@/actions/roi";

/** Re-check while the dashboard stays open (backup if cron was missed). */
const RETRY_MS = 60_000;
/** Run soon after paint so midnight-due ROI lands without waiting. */
const FIRST_DELAY_MS = 400;

/**
 * Automatic daily ROI + maturity catch-up.
 * Runs on mount, every route change, on an interval, and when the tab focuses.
 * Refreshes the UI when wallet / earned amounts change.
 */
export default function RoiCatchUp() {
  const router = useRouter();
  const pathname = usePathname();
  const inFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    async function run() {
      if (cancelled || inFlight.current) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      inFlight.current = true;
      try {
        const result = await ensureRoiCatchUpAction();
        if (!cancelled && result?.balanceChanged) {
          router.refresh();
        }
      } catch {
        // Non-blocking — cron / next interval can retry.
      } finally {
        inFlight.current = false;
      }
    }

    timer = window.setTimeout(run, FIRST_DELAY_MS);
    const interval = window.setInterval(run, RETRY_MS);

    function onVisible() {
      if (document.visibilityState === "visible") run();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [router, pathname]);

  return null;
}
