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
        showStatus={true}
      />
      <ApprovalQueue
        title="Deposit Records"
        subtitle="PayMongo auto-credits when paid. Manual receipts need Approve."
        items={items}
        type="deposit"
        showStatus={true}
      />
    </div>
  );
}
