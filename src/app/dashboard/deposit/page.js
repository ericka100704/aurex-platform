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
              <li>1. Select a method and enter the amount.</li>
              <li>2. Click Submit Deposit — checkout opens.</li>
              <li>3. Complete payment in your e-wallet app.</li>
              <li>4. When payment is confirmed, your wallet credits automatically.</li>
              <li>5. Admin approval is only required when you withdraw.</li>
            </>
          ) : (
            <>
              <li>1. Select a payment method and enter the amount.</li>
              <li>2. Click Submit Deposit — account details appear for that method.</li>
              <li>3. Send the exact amount using the account shown, then upload your receipt.</li>
              <li>4. Status stays pending until an admin verifies the screenshot.</li>
              <li>5. After approval, your wallet credits and you can invest or withdraw.</li>
            </>
          )}
        </ol>
        <div className="metallic-line relative z-10 my-5" />
        <ul className="relative z-10 space-y-2 text-sm">
          {methods.length === 0 ? (
            <li className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-3 text-xs text-white/45">
              No payment methods yet. Ask an admin to add one under Payment Methods.
            </li>
          ) : (
            methods.map((m) => (
              <li
                key={m.id}
                className="list-row-hover rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2"
              >
                <p className="text-gold">{m.name}</p>
                {(m.accountName || m.accountNumber) && (
                  <p className="text-xs text-white/50">
                    {[m.accountName, m.accountNumber].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-white/35">
                  {onlinePayments
                    ? "Open checkout after Submit — credits when paid."
                    : "Use the account details shown after Submit. Admin approves your receipt before credit."}
                </p>
              </li>
            ))
          )}
        </ul>
      </GlassCard>
    </div>
  );
}
