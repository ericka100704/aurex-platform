import { NextResponse } from "next/server";
import { submitDepositAction } from "@/actions/deposits";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const result = await submitDepositAction(formData);
    return NextResponse.json(result, { status: result.ok ? 201 : 400 });
  } catch {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const deposits = await prisma.deposit.findMany({
      where: { userId: user.id },
      include: { method: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: serialize(deposits) });
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
}
