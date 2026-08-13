import Link from "next/link";
import { Sparkles } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import GlassCard from "@/components/ui/GlassCard";
import RoiChart from "@/components/dashboard/RoiChart";
import InvestmentTable from "@/components/dashboard/InvestmentTable";
import PlanCard from "@/components/dashboard/PlanCard";
import { requireUser } from "@/lib/auth";
import {
  getActivePlans,
  getRoiTimeline,
  getUserInvestments,
  getUserReferrals,
} from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UserDashboardPage() {
  const user = await requireUser();
  const [plans, investments, referrals, roiTimeline] = await Promise.all([
    getActivePlans(),
    getUserInvestments(user.id),
    getUserReferrals(user.id),
    getRoiTimeline(user.id),
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
          label="Available Balance"
          value={formatCurrency(user.balance)}
          subtext="Ready to invest or withdraw"
          icon="wallet"
          accent="gold"
        />
        <StatCard
          label="Active Investments"
          value={String(active.length)}
          subtext={formatCurrency(locked) + " locked"}
          icon="piggyBank"
          accent="rose"
          delay={0.05}
        />
        <StatCard
          label="Total ROI Earned"
          value={formatCurrency(totalEarned)}
          subtext="Lifetime earnings"
          icon="trendingUp"
          accent="gold"
          delay={0.1}
        />
        <StatCard
          label="Direct Referrals"
          value={String(referrals.length)}
          subtext={`Code: ${user.referralCode}`}
          icon="users"
          accent="rose"
          delay={0.15}
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
          <RoiChart data={roiTimeline} />
        </div>
      </div>

      <InvestmentTable investments={investments} />

      <section className="pt-2">
        <div className="mb-6">
          <h2 className="font-display text-2xl text-white">Featured Plans</h2>
          <p className="mt-1 text-sm text-white/40">Live plans from database</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
          {plans.map((plan, index) => (
            <PlanCard key={plan.id} plan={plan} delay={index * 0.08} />
          ))}
        </div>
      </section>
    </div>
  );
}
