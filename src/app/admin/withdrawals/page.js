import ApprovalQueue from "@/components/admin/ApprovalQueue";
import { getPendingWithdrawals } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminWithdrawalsPage() {
  const items = await getPendingWithdrawals();
  return (
    <ApprovalQueue
      title="Withdrawal Approval Queue"
      items={items}
      type="withdrawal"
    />
  );
}
