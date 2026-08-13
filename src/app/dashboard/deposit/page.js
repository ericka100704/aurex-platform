import DepositForm from "@/components/dashboard/DepositForm";
import GlassCard from "@/components/ui/GlassCard";
import { isPaymongoConfigured } from "@/lib/paymongo";
import { getActiveDepositMethods } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DepositPage() {
  const methods = await getActiveDepositMethods();
  const onlinePayments = isPaymongoConfigured();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DepositForm methods={methods} onlinePayments={onlinePayments} />
      <GlassCard hover={false} className="!rounded-[1.75rem]" glow>
        <h3 className="relative z-10 font-display text-lg text-white">
          How deposits work
        </h3>
        <ol className="relative z-10 mt-4 space-y-3 text-sm text-white/65">
          {onlinePayments ? (
            <>
              <li>1. Select GCash or Maya.</li>
              <li>2. Enter the amount — a payment QR appears automatically.</li>
              <li>3. Scan with GCash (or open checkout on your phone).</li>
              <li>4. When PayMongo confirms payment, your wallet credits itself. No Submit click.</li>
              <li>5. GoTyme / bank transfer still use receipt upload. Withdrawals need admin approval.</li>
            </>
          ) : (
            <>
              <li>1. Select GCash or GoTyme (admin-configured).</li>
              <li>2. Transfer the exact amount to the shown account.</li>
              <li>3. Upload your receipt / proof of payment.</li>
              <li>4. Submit — your balance and referral commissions update immediately.</li>
              <li>5. Admin approval is only required when you withdraw.</li>
            </>
          )}
        </ol>
        <div className="metallic-line relative z-10 my-5" />
        <ul className="relative z-10 space-y-2 text-sm">
          {methods.map((m) => (
            <li
              key={m.id}
              className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2"
            >
              <p className="text-gold">{m.name}</p>
              <p className="text-xs text-white/50">
                {m.accountName} · {m.accountNumber}
              </p>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
