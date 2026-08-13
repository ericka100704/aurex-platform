import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const TYPE_META = {
  DEPOSIT: { label: "Deposit", href: "/dashboard/deposit" },
  INVEST: { label: "Invest", href: "/dashboard/plans" },
  ROI: { label: "ROI", href: "/dashboard/plans" },
  PRINCIPAL: { label: "Principal returned", href: "/dashboard/plans" },
  WITHDRAW: { label: "Withdraw", href: "/dashboard/withdraw" },
  WITHDRAW_REFUND: { label: "Withdraw refund", href: "/dashboard/withdraw" },
  REFERRAL: { label: "Referral", href: "/dashboard/referrals" },
};

export default function WalletHistory({ entries = [] }) {
  return (
    <GlassCard hover={false} className="overflow-hidden !rounded-[1.75rem] p-0">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h3 className="font-display text-lg text-white">Transaction history</h3>
        <p className="text-xs text-white/40">
          Deposits, investments, ROI, withdrawals, and referral credits
        </p>
      </div>
      <div className="overflow-x-auto">
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
                const credit = Number(row.amount) >= 0;
                return (
                  <tr
                    key={row.id}
                    className="border-t border-white/[0.05] text-white/75 transition hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-white/55">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={meta.href} className="text-white hover:text-gold">
                        {meta.label}
                      </Link>
                    </td>
                    <td className="max-w-[14rem] truncate px-5 py-3.5 text-white/45">
                      {row.note || "—"}
                    </td>
                    <td
                      className={`px-5 py-3.5 text-right font-medium ${
                        credit ? "text-emerald-400" : "text-rose"
                      }`}
                    >
                      {credit ? "+" : ""}
                      {formatCurrency(row.amount)}
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
