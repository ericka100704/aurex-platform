import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import GlassCard from "@/components/ui/GlassCard";
import { requireUser } from "@/lib/auth";
import { getUserInvestments } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const user = await requireUser();
  const investments = await getUserInvestments(user.id);
  const locked = investments
    .filter((i) => i.status === "ACTIVE")
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const available = Number(user.balance);
  const equity = available + locked;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          href="/dashboard/wallet/available"
          label="Available"
          value={formatCurrency(available)}
          icon="wallet"
          accent="gold"
        />
        <StatCard
          href="/dashboard/investments"
          label="In Investments"
          value={formatCurrency(locked)}
          icon="arrowDown"
          accent="rose"
        />
        <StatCard
          href="/dashboard/wallet/equity"
          label="Total Equity"
          value={formatCurrency(equity)}
          icon="arrowUp"
          accent="gold"
        />
      </div>
      <GlassCard hover={false} className="flex flex-col gap-3 !rounded-[1.75rem] sm:flex-row sm:flex-wrap" glow>
        <Link href="/dashboard/deposit" className="btn-rose w-full sm:w-auto">
          Deposit
        </Link>
        <Link href="/dashboard/withdraw" className="btn-gold w-full sm:w-auto">
          Withdraw
        </Link>
        <Link href="/dashboard/plans" className="btn-ghost w-full sm:w-auto">
          Invest
        </Link>
      </GlassCard>
    </div>
  );
}
