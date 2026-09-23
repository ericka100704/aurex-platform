export default function DashboardLoading() {
  return (
    <div className="space-y-8 md:space-y-10" aria-busy="true" aria-label="Loading">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[116px] animate-pulse rounded-[1.75rem] border border-white/[0.06] bg-white/[0.04]"
          />
        ))}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-12 xl:gap-6">
        <div className="h-56 animate-pulse rounded-[1.75rem] border border-white/[0.06] bg-white/[0.04] xl:col-span-4" />
        <div className="h-56 animate-pulse rounded-[1.75rem] border border-white/[0.06] bg-white/[0.04] xl:col-span-8" />
      </div>
      <div className="h-48 animate-pulse rounded-[1.75rem] border border-white/[0.06] bg-white/[0.04]" />
    </div>
  );
}
