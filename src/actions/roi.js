"use server";

import { getSession } from "@/lib/auth";
import { ensureDailyRoiCredit } from "@/lib/roiCredit";

/**
 * Background ROI / maturity catch-up for the logged-in user only.
 * Does not block page navigation; client refreshes when balance changed.
 */
export async function ensureRoiCatchUpAction() {
  const session = await getSession();
  if (!session?.sub) {
    return {
      ok: false,
      ran: false,
      credited: 0,
      completed: 0,
      principalReturned: 0,
      profitCredited: 0,
      balanceChanged: false,
    };
  }

  try {
    // Scope to this user so catch-up stays fast as the platform grows.
    const summary = await ensureDailyRoiCredit(new Date(), {
      userId: session.sub,
    });
    const credited = Number(summary.credited || 0);
    const completed = Number(summary.completed || 0);
    const principalReturned = Number(summary.principalReturned || 0);
    const profitCredited = Number(summary.profitCredited || 0);
    const balanceChanged =
      Boolean(summary.ran) &&
      (credited > 0 || completed > 0 || principalReturned > 0 || profitCredited > 0);

    return {
      ok: true,
      ran: Boolean(summary.ran),
      reason: summary.reason || null,
      credited,
      completed,
      principalReturned,
      profitCredited,
      balanceChanged,
      errors: Array.isArray(summary.errors) ? summary.errors.length : 0,
    };
  } catch {
    return {
      ok: false,
      ran: false,
      credited: 0,
      completed: 0,
      principalReturned: 0,
      profitCredited: 0,
      balanceChanged: false,
    };
  }
}
