"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";

export const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/risk", label: "Risk disclosure" },
];

export function LegalFooter() {
  return (
    <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-white/35">
      {LEGAL_LINKS.map((item) => (
        <Link key={item.href} href={item.href} className="hover:text-gold">
          {item.label}
        </Link>
      ))}
    </p>
  );
}

export default function LegalLayout({ title, updated, children }) {
  return (
    <div className="relative min-h-screen bg-dark px-5 py-10 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex">
            <Logo size="sm" />
          </Link>
          <Link href="/" className="text-xs text-gold hover:underline">
            Back to home
          </Link>
        </div>
        <h1 className="font-display text-4xl text-white">{title}</h1>
        {updated ? (
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">
            Last updated {updated}
          </p>
        ) : null}
        <div className="prose-legal mt-8 space-y-4 text-sm leading-relaxed text-white/65">
          {children}
        </div>
        <footer className="mt-12 border-t border-white/10 pt-6 text-center text-[11px] text-white/35">
          <p>© {new Date().getFullYear()} AUREX</p>
          <LegalFooter />
        </footer>
      </div>
    </div>
  );
}
