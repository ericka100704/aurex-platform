import ApprovalQueue from "@/components/admin/ApprovalQueue";
import { getPendingWithdrawals, getRecentWithdrawals } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminWithdrawalsPage() {
  const [pending, history] = await Promise.all([
    getPendingWithdrawals(),
    getRecentWithdrawals(),
  ]);

  return (
    <div className="space-y-6">
      <ApprovalQueue
        title="Withdrawal Approval Queue"
        subtitle="Approve or reject pending withdrawal requests"
        items={pending}
        type="withdrawal"
        showStatus={true}
        emptyLabel="No pending withdrawals"
      />
      <ApprovalQueue
        title="Withdrawal History"
        subtitle="Approved and rejected withdrawals"
        items={history}
        type="withdrawal"
        showStatus={true}
        emptyLabel="No approved or rejected withdrawals yet"
        collapsible
        defaultOpen={false}
      />
    </div>
  );
}
