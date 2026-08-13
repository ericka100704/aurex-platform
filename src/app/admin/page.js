import StatCard from "@/components/ui/StatCard";
import ApprovalQueue from "@/components/admin/ApprovalQueue";
import PlansEditor from "@/components/admin/PlansEditor";
import {
  getAdminDashboardMetrics,
  getAllPlans,
  getPendingDeposits,
  getPendingWithdrawals,
} from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [m, pendingWithdrawals, pendingDeposits, plans] = await Promise.all([
    getAdminDashboardMetrics(),
    getPendingWithdrawals(),
    getPendingDeposits(),
    getAllPlans(),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          href="/admin/users"
          label="Total Users"
          value={m.totalUsers.toLocaleString()}
          icon="users"
          accent="gold"
        />
        <StatCard
          href="/admin/investments"
          label="Active Investments"
          value={m.activeInvestments.toLocaleString()}
          icon="layers"
          accent="rose"
          delay={0.05}
        />
        <StatCard
          href="/admin/deposits"
          label="Deposits Today"
          value={String(m.depositsToday)}
          icon="arrowDown"
          accent="gold"
          delay={0.1}
        />
        <StatCard
          href="/admin/withdrawals"
          label="Pending Withdrawals"
          value={String(m.pendingWithdrawals)}
          icon="arrowUp"
          accent="rose"
          delay={0.15}
        />
        <StatCard
          href="/admin/deposits"
          label="Total Volume"
          value={formatCurrency(m.totalVolume)}
          icon="chart"
          accent="gold"
          delay={0.2}
        />
        <StatCard
          href="/admin/settings"
          label="Site"
          value="AUREX"
          subtext="Live database connected"
          icon="coins"
          accent="rose"
          delay={0.25}
        />
      </div>

      <ApprovalQueue
        title="Deposit Approval Queue"
        subtitle="Verify the receipt, then approve or reject"
        items={pendingDeposits}
        type="deposit"
      />

      <ApprovalQueue
        title="Withdrawal Approval Queue"
        subtitle="Approve or reject withdrawal requests"
        items={pendingWithdrawals}
        type="withdrawal"
      />

      <PlansEditor initialPlans={plans} />
    </div>
  );
}
