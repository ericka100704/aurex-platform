import DepositMethodsEditor from "@/components/admin/DepositMethodsEditor";
import { getAllDepositMethods } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminMethodsPage() {
  const methods = await getAllDepositMethods();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-white">Payment Methods</h2>
        <p className="text-sm text-white/45">
          GCash & GoTyme — managed by admin
        </p>
      </div>
      <DepositMethodsEditor initialMethods={methods} />
    </div>
  );
}
