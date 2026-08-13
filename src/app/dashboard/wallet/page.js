import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import GlassCard from "@/components/ui/GlassCard";
import WalletHistory from "@/components/dashboard/WalletHistory";
import { requireUser } from "@/lib/auth";
import { getUserInvestments, getUserLedger } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const user = await requireUser();
  const [investments, ledger] = await Promise.all([
    getUserInvestments(user.id),
    getUserLedger(user.id),
  ]);
  const locked = investments
    .filter((i) => i.status === "ACTIVE")
    .reduce((s, i) => s + Number(i.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          href="/dashboard/withdraw"
          label="Available"
          value={formatCurrency(user.balance)}
          icon="wallet"
          accent="gold"
        />
        <StatCard
          href="/dashboard/plans"
          label="In Investments"
          value={formatCurrency(locked)}
          icon="arrowDown"
          accent="rose"
        />
        <StatCard
          href="/dashboard"
          label="Total Equity"
          value={formatCurrency(Number(user.balance) + locked)}
          icon="arrowUp"
          accent="gold"
        />
      </div>
      <GlassCard hover={false} className="flex flex-wrap gap-3 !rounded-[1.75rem]" glow>
        <Link href="/dashboard/deposit" className="btn-rose">
          Deposit
        </Link>
        <Link href="/dashboard/withdraw" className="btn-gold">
          Withdraw
        </Link>
        <Link href="/dashboard/plans" className="btn-ghost">
          Invest
        </Link>
      </GlassCard>
      <WalletHistory entries={ledger} />
    </div>
  );
}
