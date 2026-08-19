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
              <li>2. Click Submit Deposit — a PayMongo GCash checkout QR appears.</li>
              <li>3. Scan or open checkout and pay the locked amount.</li>
              <li>4. When PayMongo confirms payment, your wallet credits itself. No receipt.</li>
              <li>5. Admin approval is only required when you withdraw.</li>
            </>
          ) : (
            <>
              <li>1. Select a method and enter the amount.</li>
              <li>2. Click Submit Deposit — account details appear.</li>
              <li>3. Send to GCash 09242512818 or GoTyme 012774193734 (MABEL HULAR), then upload your receipt.</li>
              <li>4. Status stays pending until an admin verifies the screenshot.</li>
              <li>5. After approval, your wallet credits and you can invest or withdraw.</li>
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
              <p className="mt-1 text-[11px] text-white/35">
                {onlinePayments
                  ? "PayMongo QR after Submit — auto-credits when paid."
                  : "QR popup after Submit. Admin approves the receipt before credit."}
              </p>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
