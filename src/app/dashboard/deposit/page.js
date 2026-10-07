import DepositForm from "@/components/dashboard/DepositForm";
import { isPaymongoConfigured } from "@/lib/paymongo";
import { getActiveDepositMethods } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DepositPage() {
  const methods = await getActiveDepositMethods();
  const onlinePayments = isPaymongoConfigured();

  return (
    <div className="mx-auto w-full max-w-xl">
      <DepositForm methods={methods} onlinePayments={onlinePayments} />
    </div>
  );
}
