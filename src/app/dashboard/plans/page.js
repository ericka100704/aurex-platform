import PlanCard from "@/components/dashboard/PlanCard";
import { getActivePlans } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const plans = await getActivePlans();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-white">Investment Plans</h2>
        <p className="text-sm text-white/40">
          Choose an active plan and invest from your balance
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan, index) => (
          <PlanCard key={plan.id} plan={plan} delay={index * 0.08} />
        ))}
      </div>
    </div>
  );
}
