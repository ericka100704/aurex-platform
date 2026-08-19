import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

function GroupCard({ title, subtitle, items }) {
  return (
    <GlassCard hover={false} className="overflow-hidden !rounded-[1.75rem] p-0">
      <div className="border-b border-white/[0.06] px-4 py-4 md:px-5">
        <h3 className="font-display text-lg uppercase tracking-wide text-white">
          {title}
        </h3>
        {subtitle ? <p className="mt-1 text-xs text-white/40">{subtitle}</p> : null}
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {items.map((row) => (
          <article
            key={row.id}
            className="rounded-2xl border border-white/[0.07] bg-black/25 p-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-xl text-gold">{formatCurrency(row.amount)}</p>
              {row.status ? <StatusBadge status={row.status} /> : null}
            </div>
            <p className="mt-2 text-xs text-white/50">{formatDate(row.date)}</p>
            {row.detail ? (
              <p className="mt-1 text-xs text-white/40">{row.detail}</p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-white/35">
            <tr>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Date</th>
              {items.some((row) => row.detail) ? (
                <th className="px-5 py-3 font-medium">Details</th>
              ) : null}
              {items.some((row) => row.status) ? (
                <th className="px-5 py-3 font-medium">Status</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t border-white/[0.05] text-white/75">
                <td className="px-5 py-3.5 text-gold">{formatCurrency(row.amount)}</td>
                <td className="px-5 py-3.5">{formatDate(row.date)}</td>
                {items.some((item) => item.detail) ? (
                  <td className="px-5 py-3.5 text-white/50">{row.detail || "—"}</td>
                ) : null}
                {items.some((item) => item.status) ? (
                  <td className="px-5 py-3.5">
                    {row.status ? <StatusBadge status={row.status} /> : null}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

export default function MoneyHistory({ groups = [], emptyTitle, emptyText }) {
  if (!groups.length) {
    return (
      <GlassCard hover={false} className="!rounded-[1.75rem]">
        <h3 className="font-display text-lg text-white">{emptyTitle}</h3>
        <p className="mt-2 text-sm text-white/40">{emptyText}</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {groups.map((group) => (
        <GroupCard
          key={group.title}
          title={group.title}
          subtitle={group.subtitle}
          items={group.items}
        />
      ))}
    </div>
  );
}
