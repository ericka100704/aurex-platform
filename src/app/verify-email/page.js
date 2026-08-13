import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { verifyEmailByToken } from "@/lib/emailAuth";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({ searchParams }) {
  const result = await verifyEmailByToken(searchParams?.token || "");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass-card w-full max-w-md p-8 text-center">
        <Logo />
        <h1 className="mt-6 font-display text-3xl text-white">
          {result.ok ? "Email verified" : "Verification failed"}
        </h1>
        <p className="mt-2 text-sm text-white/55">{result.message}</p>
        <Link href="/login" className="btn-gold mt-6 w-full">
          Continue
        </Link>
      </div>
    </div>
  );
}
