import ApprovalQueue from "@/components/admin/ApprovalQueue";
import { getPendingDeposits } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminDepositsPage() {
  const items = await getPendingDeposits();
  return (
    <ApprovalQueue title="Deposit Approval Queue" items={items} type="deposit" />
  );
}
