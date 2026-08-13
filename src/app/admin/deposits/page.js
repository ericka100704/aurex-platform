import ApprovalQueue from "@/components/admin/ApprovalQueue";
import { getRecentDeposits } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminDepositsPage() {
  const items = await getRecentDeposits();
  return (
    <ApprovalQueue
      title="Deposit Records"
      subtitle="GCash/Maya via PayMongo auto-credit when paid. Manual receipts still appear here."
      items={items}
      type="deposit"
      showStatus={true}
    />
  );
}
