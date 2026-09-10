"use server";

import { getSession } from "@/lib/auth";
import { ensureDailyRoiCredit } from "@/lib/roiCredit";

/**
 * Background ROI catch-up for logged-in users. Does not block page navigation.
 */
export async function ensureRoiCatchUpAction() {
  const session = await getSession();
  if (!session?.sub) {
    return { ok: false, ran: false, credited: 0 };
  }

  try {
    const summary = await ensureDailyRoiCredit();
    return {
      ok: true,
      ran: Boolean(summary.ran),
      credited: Number(summary.credited || 0),
    };
  } catch {
    return { ok: false, ran: false, credited: 0 };
  }
}
