export default function PageLoading({ label = "Loading..." }) {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label={label}>
      <div className="h-8 w-48 rounded-xl bg-white/[0.06]" />
      <div className="h-4 w-full max-w-md rounded-lg bg-white/[0.04]" />
      <div className="mt-6 space-y-3">
        <div className="h-24 rounded-[1.75rem] border border-white/[0.06] bg-white/[0.04]" />
        <div className="h-24 rounded-[1.75rem] border border-white/[0.06] bg-white/[0.04]" />
        <div className="h-24 rounded-[1.75rem] border border-white/[0.06] bg-white/[0.04]" />
      </div>
      <p className="sr-only">{label}</p>
    </div>
  );
}
