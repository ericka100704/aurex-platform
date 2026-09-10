"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ensureRoiCatchUpAction } from "@/actions/roi";

/**
 * Runs daily ROI catch-up after paint so Overview navigation stays fast.
 * Only refreshes when credits were actually applied.
 */
export default function RoiCatchUp() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const result = await ensureRoiCatchUpAction();
        if (!cancelled && result?.ran && result.credited > 0) {
          router.refresh();
        }
      } catch {
        // Non-blocking — cron / next visit can retry.
      }
    }, 800);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [router]);

  return null;
}
