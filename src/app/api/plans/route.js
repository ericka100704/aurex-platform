import { NextResponse } from "next/server";
import { getActivePlans } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const plans = await getActivePlans();
  return NextResponse.json({ success: true, data: plans });
}
