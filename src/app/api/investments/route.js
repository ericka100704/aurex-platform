import { NextResponse } from "next/server";
import { investAction } from "@/actions/investments";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await investAction({
      planId: body.planId,
      amount: body.amount,
    });
    return NextResponse.json(result, { status: result.ok ? 201 : 400 });
  } catch {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
}
