import Spinner from "@/components/ui/Spinner";

export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
      aria-busy="true"
      aria-label="Loading"
    >
      <Spinner className="h-10 w-10 text-gold" />
      <p className="text-sm text-white/45">Loading...</p>
    </div>
  );
}
