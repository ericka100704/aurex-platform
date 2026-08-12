import { NextResponse } from "next/server";
import {
  createPlanAction,
  deletePlanAction,
  updatePlanAction,
} from "@/actions/plans";
import { getAllPlans } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const plans = await getAllPlans();
    return NextResponse.json({ success: true, data: plans });
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await createPlanAction(body);
    return NextResponse.json(result, { status: result.ok ? 201 : 400 });
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const result = await updatePlanAction(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const result = await deletePlanAction(id);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
}
