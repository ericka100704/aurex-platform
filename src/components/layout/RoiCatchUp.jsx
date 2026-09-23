"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ensureRoiCatchUpAction } from "@/actions/roi";

/** How often to re-check while the dashboard stays open (cron backup). */
const RETRY_MS = 5 * 60 * 1000;
const FIRST_DELAY_MS = 600;

/**
 * Runs daily ROI + maturity catch-up after paint.
 * Retries on an interval and when the tab becomes visible again.
 * Refreshes when ROI or principal was credited (not ROI-only).
 */
export default function RoiCatchUp() {
  const router = useRouter();
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
  }, [router]);

  return null;
}
