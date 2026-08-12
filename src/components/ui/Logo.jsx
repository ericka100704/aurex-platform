import Image from "next/image";
import Link from "next/link";

const iconSizes = {
  sm: 28,
  md: 36,
  lg: 48,
};

const textSizes = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-3xl",
};

export default function Logo({ href = "/", size = "md", showText = true }) {
  const px = iconSizes[size] || iconSizes.md;

  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <Image
        src="/aurex-logo.png"
        alt="AUREX"
        width={px}
        height={px}
        className="rounded-full object-cover shadow-gold"
        priority
      />
      {showText ? (
        <span className={`font-display tracking-[0.18em] ${textSizes[size]}`}>
          <span className="shimmer-text">AUREX</span>
        </span>
      ) : null}
    </Link>
  );
}
