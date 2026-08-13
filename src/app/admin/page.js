import StatCard from "@/components/ui/StatCard";
import ApprovalQueue from "@/components/admin/ApprovalQueue";
import PlansEditor from "@/components/admin/PlansEditor";
import {
  getAdminDashboardMetrics,
  getAllPlans,
  getPendingWithdrawals,
} from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [m, pendingWithdrawals, plans] = await Promise.all([
    getAdminDashboardMetrics(),
    getPendingWithdrawals(),
    getAllPlans(),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Users"
          value={m.totalUsers.toLocaleString()}
          icon="users"
          accent="gold"
        />
        <StatCard
          label="Active Investments"
          value={m.activeInvestments.toLocaleString()}
          icon="layers"
          accent="rose"
          delay={0.05}
        />
        <StatCard
          label="Deposits Today"
          value={String(m.depositsToday)}
          icon="arrowDown"
          accent="gold"
          delay={0.1}
        />
        <StatCard
          label="Pending Withdrawals"
          value={String(m.pendingWithdrawals)}
          icon="arrowUp"
          accent="rose"
          delay={0.15}
        />
        <StatCard
          label="Total Volume"
          value={formatCurrency(m.totalVolume)}
          icon="chart"
          accent="gold"
          delay={0.2}
        />
        <StatCard
          label="Site"
          value="AUREX"
          subtext="Live database connected"
          icon="coins"
          accent="rose"
          delay={0.25}
        />
      </div>

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
