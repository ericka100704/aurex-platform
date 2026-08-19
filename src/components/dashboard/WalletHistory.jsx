import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const TYPE_META = {
  DEPOSIT: { label: "Deposit", href: "/dashboard/deposit" },
  INVEST: { label: "Invest", href: "/dashboard/plans" },
  ROI: { label: "ROI", href: "/dashboard/investments" },
  PRINCIPAL: { label: "Principal returned", href: "/dashboard/investments" },
  WITHDRAW: { label: "Withdraw", href: "/dashboard/withdraw" },
  WITHDRAW_REFUND: { label: "Withdraw refund", href: "/dashboard/withdraw" },
  REFERRAL: { label: "Referral", href: "/dashboard/referrals" },
};

function RowAmount({ amount }) {
  const credit = Number(amount) >= 0;
  return (
    <span className={`font-medium ${credit ? "text-emerald-400" : "text-rose"}`}>
      {credit ? "+" : ""}
      {formatCurrency(amount)}
    </span>
  );
}

export default function WalletHistory({
  entries = [],
  id = "history",
  title = "Transaction history",
  subtitle = "Every wallet change that makes up your available balance",
}) {
  return (
    <GlassCard
      hover={false}
      className="scroll-mt-24 overflow-hidden !rounded-[1.75rem] p-0"
    >
      <div id={id} className="border-b border-white/[0.06] px-4 py-4 md:px-5">
        <h3 className="font-display text-lg text-white">{title}</h3>
        <p className="text-xs text-white/40">{subtitle}</p>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {entries.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-white/40">
            No wallet movements yet
          </p>
        ) : (
          entries.map((row) => {
            const meta = TYPE_META[row.type] || {
              label: row.type,
              href: "/dashboard/wallet",
            };
            return (
              <article
                key={row.id}
                className="rounded-2xl border border-white/[0.07] bg-black/25 p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={meta.href} className="text-sm font-medium text-white">
                      {meta.label}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-white/40">
                      {formatDateTime(row.createdAt)}
                    </p>
                  </div>
                  <RowAmount amount={row.amount} />
                </div>
                {row.note ? (
                  <p className="mt-2 text-xs leading-snug text-white/45">{row.note}</p>
                ) : null}
                <p className="mt-2 text-[11px] text-white/35">
                  Balance after: {formatCurrency(row.balanceAfter)}
                </p>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-white/35">
            <tr>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Details</th>
              <th className="px-5 py-3 font-medium text-right">Amount</th>
              <th className="px-5 py-3 font-medium text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-white/40">
                  No wallet movements yet
                </td>
              </tr>
            ) : (
              entries.map((row) => {
                const meta = TYPE_META[row.type] || {
                  label: row.type,
                  href: "/dashboard/wallet",
                };
                return (
                  <tr
                    key={row.id}
                    className="border-t border-white/[0.05] text-white/75"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-white/55">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={meta.href} className="text-white hover:text-gold">
                        {meta.label}
                      </Link>
                    </td>
                    <td className="max-w-[18rem] truncate px-5 py-3.5 text-white/45">
                      {row.note || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <RowAmount amount={row.amount} />
                    </td>
                    <td className="px-5 py-3.5 text-right text-white">
                      {formatCurrency(row.balanceAfter)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
