import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { getShellUser } from "@/lib/auth";
import { ensureDailyRoiCredit } from "@/lib/roiCredit";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }) {
  const user = await getShellUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  // Admin shell also catch-ups this account's plans if any (and cron covers all).
  try {
    await ensureDailyRoiCredit(new Date(), { userId: user.id });
  } catch {
    // non-fatal
  }

  return (
    <DashboardShell
      variant="admin"
      baseHref="/admin"
      title="Admin Control Center"
      subtitle="Dynamic plans, payments, and approvals"
      userName={user.fullName}
      userEmail={user.email}
    >
      {children}
    </DashboardShell>
  );
}
