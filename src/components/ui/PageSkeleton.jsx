export default function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-28 rounded-3xl bg-white/[0.05]" />
        <div className="h-28 rounded-3xl bg-white/[0.05]" />
        <div className="h-28 rounded-3xl bg-white/[0.05]" />
        <div className="h-28 rounded-3xl bg-white/[0.05]" />
      </div>
      <div className="h-64 rounded-[1.75rem] bg-white/[0.05]" />
      <div className="h-48 rounded-[1.75rem] bg-white/[0.05]" />
    </div>
  );
}
