import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

function planNameOf(inv) {
  return String(inv.planName || inv.plan?.name || "Other").trim() || "Other";
}

function planRank(name) {
  const n = name.toUpperCase();
  if (n.includes("START")) return 0;
  if (n.includes("PRO")) return 1;
  if (n.includes("ELITE")) return 2;
  return 50;
}

function groupByPlan(investments) {
  const map = new Map();
  for (const inv of investments) {
    const name = planNameOf(inv);
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(inv);
  }
  return [...map.entries()].sort(([a], [b]) => {
    const rank = planRank(a) - planRank(b);
    return rank !== 0 ? rank : a.localeCompare(b);
  });
}

function PlanGroup({ name, items }) {
  const locked = items
    .filter((inv) => inv.status === "ACTIVE")
    .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const earned = items.reduce((sum, inv) => sum + Number(inv.earnedAmount || 0), 0);

  return (
    <GlassCard hover={false} className="overflow-hidden !rounded-[1.75rem] p-0">
      <div className="border-b border-white/[0.06] px-4 py-4 md:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg uppercase tracking-wide text-white">
              {name}
            </h3>
            <p className="mt-1 text-xs text-white/40">
              {items.length} {items.length === 1 ? "position" : "positions"}
              {" · "}
              {formatCurrency(locked)} active
              {" · "}
              {formatCurrency(earned)} earned
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {items.map((inv) => (
          <article
            key={inv.id}
            className="rounded-2xl border border-white/[0.07] bg-black/25 p-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-xl text-gold">{formatCurrency(inv.amount)}</p>
              <StatusBadge status={inv.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div>
                <dt className="text-white/35">Daily</dt>
                <dd className="mt-0.5 text-white">{formatCurrency(inv.dailyReturn)}</dd>
              </div>
              <div>
                <dt className="text-white/35">Earned</dt>
                <dd className="mt-0.5 text-magenta">{formatCurrency(inv.earnedAmount)}</dd>
              </div>
              <div>
                <dt className="text-white/35">Started</dt>
                <dd className="mt-0.5 text-white/80">{formatDate(inv.startDate)}</dd>
              </div>
              <div>
                <dt className="text-white/35">Ends</dt>
                <dd className="mt-0.5 text-white/80">{formatDate(inv.endDate)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-white/35">
            <tr>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Daily</th>
              <th className="px-5 py-3 font-medium">Earned</th>
              <th className="px-5 py-3 font-medium">Started</th>
              <th className="px-5 py-3 font-medium">Ends</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((inv) => (
              <tr
                key={inv.id}
                className="border-t border-white/[0.05] text-white/75"
              >
                <td className="px-5 py-3.5 text-gold">{formatCurrency(inv.amount)}</td>
                <td className="px-5 py-3.5">{formatCurrency(inv.dailyReturn)}</td>
                <td className="px-5 py-3.5 text-magenta">
                  {formatCurrency(inv.earnedAmount)}
                </td>
                <td className="px-5 py-3.5">{formatDate(inv.startDate)}</td>
                <td className="px-5 py-3.5">{formatDate(inv.endDate)}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

export default function InvestmentTable({ investments = [] }) {
  const groups = groupByPlan(investments);

  if (!investments.length) {
    return (
      <GlassCard hover={false} className="!rounded-[1.75rem]">
        <h3 className="font-display text-lg text-white">Investment History</h3>
        <p className="mt-2 text-sm text-white/40">No investments yet</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {groups.map(([name, items]) => (
        <PlanGroup key={name} name={name} items={items} />
      ))}
    </div>
  );
}
