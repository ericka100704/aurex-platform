import Link from "next/link";
import { Sparkles } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import GlassCard from "@/components/ui/GlassCard";
import RoiChart from "@/components/dashboard/RoiChart";
import InvestmentTable from "@/components/dashboard/InvestmentTable";
import { requireUser } from "@/lib/auth";
import { getUserBalance, getUserOverview } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UserDashboardPage() {
  const user = await requireUser();
  const [{ investments, referralCount }, available] = await Promise.all([
    getUserOverview(user.id),
    getUserBalance(user.id),
  ]);

  const active = investments.filter((i) => i.status === "ACTIVE");
  const locked = active.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalEarned = investments.reduce(
    (sum, i) => sum + Number(i.earnedAmount || 0),
    0
  );

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
        <StatCard
          href="/dashboard/wallet/available"
          label="Available Balance"
          value={formatCurrency(available)}
          subtext="Ready to invest or withdraw"
          icon="wallet"
          accent="gold"
        />
        <StatCard
          href="/dashboard/investments"
          label="Active Investments"
          value={String(active.length)}
          subtext={formatCurrency(locked) + " locked"}
          icon="piggyBank"
          accent="rose"
        />
        <StatCard
          href="/dashboard/wallet/equity"
          label="Total ROI Earned"
          value={formatCurrency(totalEarned)}
          subtext="Lifetime earnings"
          icon="trendingUp"
          accent="gold"
        />
        <StatCard
          href="/dashboard/referrals"
          label="Direct Referrals"
          value={String(referralCount)}
          subtext={`Code: ${user.referralCode}`}
          icon="users"
          accent="rose"
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-12 xl:gap-6">
        <div className="xl:col-span-4">
          <GlassCard hover={false} className="!rounded-[1.75rem] !p-5" glow>
            <div className="relative z-10">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-glow text-white shadow-glow">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl text-white">Grow with AUREX</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/45">
                Deposit via GCash or GoTyme, pick a live plan, and earn referral
                rewards on every deposit.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <Link href="/dashboard/deposit" className="btn-rose w-full">
                  Deposit Now
                </Link>
                <Link href="/dashboard/plans" className="btn-ghost w-full">
                  View Plans
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="xl:col-span-8">
          <RoiChart investments={investments} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-white">Active positions</h2>
          <p className="mt-1 text-sm text-white/40">
            Quick view — full history on Investments
          </p>
        </div>
        <Link
          href="/dashboard/investments"
          className="text-sm text-gold hover:underline"
        >
          View all
        </Link>
      </div>
      <InvestmentTable investments={active} />
    </div>
  );
}
