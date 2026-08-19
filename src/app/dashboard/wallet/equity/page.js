import MoneyHistory from "@/components/dashboard/MoneyHistory";
import BackLink from "@/components/ui/BackLink";
import { requireUser } from "@/lib/auth";
import { getUserLedger } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPES = new Set(["ROI", "REFERRAL", "PRINCIPAL"]);

function groupTitle(row) {
  if (row.type === "REFERRAL") return "Referral";
  if (row.type === "PRINCIPAL") return "Principal returned";
  const note = String(row.note || "");
  const plan = note.replace(/\s+daily ROI$/i, "").replace(/\s+ROI.*$/i, "").trim();
  return plan || "Daily ROI";
}

function groupRank(title) {
  const n = title.toUpperCase();
  if (n.includes("START")) return 0;
  if (n.includes("PRO")) return 1;
  if (n.includes("ELITE")) return 2;
  if (n === "REFERRAL") return 20;
  if (n.includes("PRINCIPAL")) return 30;
  return 10;
}

export default async function EquityHistoryPage() {
  const user = await requireUser();
  const ledger = await getUserLedger(user.id, 400);
  const rows = ledger.filter((row) => TYPES.has(row.type) && Number(row.amount) > 0);

  const map = new Map();
  for (const row of rows) {
    const title = groupTitle(row);
    if (!map.has(title)) map.set(title, []);
    map.get(title).push({
      id: row.id,
      amount: row.amount,
      date: row.createdAt,
      detail: row.note || row.type,
    });
  }

  const groups = [...map.entries()]
    .sort(([a], [b]) => groupRank(a) - groupRank(b) || a.localeCompare(b))
    .map(([title, items]) => {
      const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return {
        title,
        subtitle: `${items.length} ${items.length === 1 ? "credit" : "credits"} · ${formatCurrency(total)} earned`,
        items,
      };
    });

  return (
    <div className="space-y-6">
      <BackLink />
      <div>
        <h2 className="font-display text-2xl text-white">Earnings</h2>
        <p className="text-sm text-white/40">
          Amounts and dates you earned — daily ROI, referrals, and returned principal
        </p>
      </div>
      <MoneyHistory
        groups={groups}
        emptyTitle="No earnings yet"
        emptyText="ROI and referral credits will show here with amount and date."
      />
    </div>
  );
}
