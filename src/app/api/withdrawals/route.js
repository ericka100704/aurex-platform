import { NextResponse } from "next/server";
import { requestWithdrawalAction } from "@/actions/withdrawals";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const formData = new FormData();
    formData.set("amount", String(body.amount || ""));
    formData.set("methodType", String(body.methodType || body.method || ""));
    formData.set("accountDetails", String(body.accountDetails || ""));
    const result = await requestWithdrawalAction(formData);
    return NextResponse.json(result, { status: result.ok ? 201 : 400 });
  } catch {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
}
