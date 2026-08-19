import InvestmentTable from "@/components/dashboard/InvestmentTable";
import BackLink from "@/components/ui/BackLink";
import { requireUser } from "@/lib/auth";
import { getUserInvestments } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function UserInvestmentsPage() {
  const user = await requireUser();
  const investments = await getUserInvestments(user.id);

  return (
    <div className="space-y-6">
      <BackLink />
      <div>
        <h2 className="font-display text-2xl text-white">My Investments</h2>
        <p className="text-sm text-white/40">
          History of plans you invested in — principal, daily ROI, and earnings
        </p>
      </div>
      <InvestmentTable investments={investments} />
    </div>
  );
}
