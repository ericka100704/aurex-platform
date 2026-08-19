import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackLink({ href = "/dashboard/wallet", label = "Back to wallet" }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-white/70"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
