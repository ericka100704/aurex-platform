import { cn } from "@/lib/utils";

export default function GlassCard({
  children,
  className = "",
  hover = true,
  glow = false,
  delay: _delay = 0,
  ...props
}) {
  return (
    <div
      className={cn(
        "glass-card p-6 md:p-7",
        hover && "glass-card-hover",
        glow && "glass-card-glow",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
