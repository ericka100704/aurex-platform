import ApprovalQueue from "@/components/admin/ApprovalQueue";
import { getPendingDeposits, getRecentDeposits } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminDepositsPage() {
  const [pending, items] = await Promise.all([
    getPendingDeposits(),
    getRecentDeposits(),
  ]);
  return (
    <div className="space-y-6">
      <ApprovalQueue
        title="Pending Receipts"
        subtitle="Approve only after you verify the GCash/GoTyme screenshot."
        items={pending}
        type="deposit"
        showStatus
        allowActions
      />
      <ApprovalQueue
        title="Deposit Records"
        subtitle="Recent deposits and their status after admin review."
        items={items}
        type="deposit"
        showStatus
        allowActions={false}
      />
    </div>
  );
}
