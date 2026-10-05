import Image from "next/image";
import Link from "next/link";

const iconSizes = {
  sm: 40,
  md: 52,
  lg: 72,
};

export default function Logo({ href = "/", size = "md", showText = false }) {
  const px = iconSizes[size] || iconSizes.md;

  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <Image
        src="/solana-logo.png"
        alt="SOLANA"
        width={px}
        height={px}
        priority
        className="rounded-full object-cover shadow-gold ring-1 ring-gold/30"
      />
      {showText ? (
        <span
          className={`font-display tracking-[0.18em] ${
            size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl"
          }`}
        >
          <span className="shimmer-text">SOLANA</span>
        </span>
      ) : null}
    </Link>
  );
}
