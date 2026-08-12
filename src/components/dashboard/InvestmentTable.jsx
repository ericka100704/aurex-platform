import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function InvestmentTable({ investments = [] }) {
  return (
    <GlassCard hover={false} className="overflow-hidden !rounded-[1.75rem] p-0">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h3 className="font-display text-lg text-white">Investment History</h3>
        <p className="text-xs text-white/40">Your portfolio positions</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-white/35">
            <tr>
              <th className="px-5 py-3 font-medium">Plan</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Daily</th>
              <th className="px-5 py-3 font-medium">Earned</th>
              <th className="px-5 py-3 font-medium">Ends</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {investments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-white/40">
                  No investments yet
                </td>
              </tr>
            ) : (
              investments.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-t border-white/[0.05] text-white/75 transition hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3.5 font-medium text-white">
                    {inv.planName || inv.plan?.name}
                  </td>
                  <td className="px-5 py-3.5">{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-3.5 text-gold">
                    {formatCurrency(inv.dailyReturn)}
                  </td>
                  <td className="px-5 py-3.5 text-magenta">
                    {formatCurrency(inv.earnedAmount)}
                  </td>
                  <td className="px-5 py-3.5">{formatDate(inv.endDate)}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
