import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveProofUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const deposit = await prisma.deposit.findUnique({
    where: { id: String(params.id) },
    select: { proofImageUrl: true },
  });
  const stored = deposit?.proofImageUrl;
  if (!stored) {
    return NextResponse.json({ message: "Proof not found." }, { status: 404 });
  }

  if (stored.startsWith("data:")) {
    const match = stored.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ message: "Invalid proof." }, { status: 400 });
    }
    return new NextResponse(Buffer.from(match[2], "base64"), {
      headers: {
        "Content-Type": match[1] || "image/jpeg",
        "Cache-Control": "private, max-age=300",
      },
    });
  }

  if (stored.startsWith("/")) {
    return NextResponse.redirect(new URL(stored, request.url));
  }

  if (stored.startsWith("http://") || stored.startsWith("https://")) {
    return NextResponse.redirect(stored);
  }

  const signed = await resolveProofUrl(stored);
  if (!signed) {
    return NextResponse.json({ message: "Proof not found." }, { status: 404 });
  }
  return NextResponse.redirect(signed);
}
