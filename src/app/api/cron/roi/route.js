import { NextResponse } from "next/server";
import { runDailyRoiCredit } from "@/lib/roiCredit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET?.trim();
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  return Boolean(token) && token === secret;
}

async function handle(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runDailyRoiCredit();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error.message || "ROI cron failed" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return handle(request);
}

export async function POST(request) {
  return handle(request);
}
