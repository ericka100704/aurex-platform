import { NextResponse } from "next/server";
import { reviewDepositAction } from "@/actions/deposits";
import { reviewWithdrawalAction } from "@/actions/withdrawals";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, id, action, adminNote } = body;

    if (!type || !id || !["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid approval payload" },
        { status: 400 }
      );
    }

    const result =
      type === "deposit"
        ? await reviewDepositAction({ id, action, adminNote })
        : await reviewWithdrawalAction({ id, action, adminNote });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
}
