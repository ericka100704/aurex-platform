import PlansEditor from "@/components/admin/PlansEditor";
import { getAllPlans } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  const plans = await getAllPlans();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-white">Dynamic Plans Editor</h2>
        <p className="text-sm text-white/45">
          Create, update, and archive investment plans
        </p>
      </div>
      <PlansEditor initialPlans={plans} />
    </div>
  );
}
