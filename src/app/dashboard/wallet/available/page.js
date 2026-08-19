import MoneyHistory from "@/components/dashboard/MoneyHistory";
import BackLink from "@/components/ui/BackLink";
import { requireUser } from "@/lib/auth";
import { getUserDeposits } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function methodRank(name) {
  const n = String(name || "").toUpperCase();
  if (n.includes("GCASH")) return 0;
  if (n.includes("GOTYME")) return 1;
  if (n.includes("MAYA")) return 2;
  return 50;
}

export default async function AvailableHistoryPage() {
  const user = await requireUser();
  const deposits = await getUserDeposits(user.id);

  const map = new Map();
  for (const row of deposits) {
    const title = row.method || "Deposit";
    if (!map.has(title)) map.set(title, []);
    map.get(title).push({
      id: row.id,
      amount: row.amount,
      date: row.reviewedAt || row.createdAt,
      status: row.status,
      detail: row.status === "APPROVED" ? "Credited to wallet" : null,
    });
  }

  const groups = [...map.entries()]
    .sort(([a], [b]) => methodRank(a) - methodRank(b) || a.localeCompare(b))
    .map(([title, items]) => {
      const credited = items
        .filter((item) => item.status === "APPROVED")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return {
        title,
        subtitle: `${items.length} ${items.length === 1 ? "deposit" : "deposits"} · ${formatCurrency(credited)} credited`,
        items,
      };
    });

  return (
    <div className="space-y-6">
      <BackLink />
      <div>
        <h2 className="font-display text-2xl text-white">Deposits</h2>
        <p className="text-sm text-white/40">
          Amounts and dates you deposited — this is the cash that entered your available wallet
        </p>
      </div>
      <MoneyHistory
        groups={groups}
        emptyTitle="No deposits yet"
        emptyText="When you deposit, each amount and date will show here."
      />
    </div>
  );
}
