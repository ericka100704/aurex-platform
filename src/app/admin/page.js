import StatCard from "@/components/ui/StatCard";
import ApprovalQueue from "@/components/admin/ApprovalQueue";
import RecentRegistrations from "@/components/admin/RecentRegistrations";
import {
  getAdminDashboardMetrics,
  getPendingDeposits,
  getPendingWithdrawals,
  getRecentRegistrations,
} from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [m, pendingWithdrawals, pendingDeposits, registrations] =
    await Promise.all([
      getAdminDashboardMetrics(),
      getPendingWithdrawals(),
      getPendingDeposits(),
      getRecentRegistrations(),
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
        />
        <StatCard
          href="/admin/deposits"
          label="Deposits Today"
          value={String(m.depositsToday)}
          icon="arrowDown"
          accent="gold"
        />
        <StatCard
          href="/admin/withdrawals"
          label="Pending Withdrawals"
          value={String(m.pendingWithdrawals)}
          icon="arrowUp"
          accent="rose"
        />
        <StatCard
          href="/admin/deposits"
          label="Total Volume"
          value={formatCurrency(m.totalVolume)}
          icon="chart"
          accent="gold"
        />
        <StatCard
          href="/admin/plans"
          label="Plans"
          value="Editor"
          subtext="Create and update plans"
          icon="coins"
          accent="rose"
        />
      </div>

      <RecentRegistrations registrations={registrations} />

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
    </div>
  );
}
