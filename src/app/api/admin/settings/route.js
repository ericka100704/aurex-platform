import { NextResponse } from "next/server";
import { updateSettingsAction } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getAppSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const data = await getAppSettings();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const result = await updateSettingsAction(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
}
