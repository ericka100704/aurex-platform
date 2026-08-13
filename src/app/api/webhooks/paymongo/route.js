import { NextResponse } from "next/server";
import { fulfillPendingDeposit } from "@/lib/depositFulfill";
import {
  extractFulfillmentFromEvent,
  parseWebhookEvent,
  verifyWebhookSignature,
} from "@/lib/paymongo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PAID_EVENTS = new Set([
  "checkout_session.payment.paid",
  "payment.paid",
]);

export async function POST(request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("paymongo-signature") ||
    request.headers.get("Paymongo-Signature") ||
    "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, message: "Invalid signature" }, { status: 401 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const { type, resource } = parseWebhookEvent(body);
  if (!PAID_EVENTS.has(type)) {
    return NextResponse.json({ ok: true, ignored: type || "unknown" });
  }

  const fulfillment = extractFulfillmentFromEvent(type, resource);
  if (!fulfillment.depositId && !fulfillment.sessionId) {
    return NextResponse.json({ ok: true, ignored: "no deposit reference" });
  }

  try {
    const result = await fulfillPendingDeposit(fulfillment);
    return NextResponse.json({
      ok: result.ok,
      alreadyCredited: result.alreadyCredited || false,
      message: result.message || "ok",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error.message || "Fulfillment failed" },
      { status: 500 }
    );
  }
}
