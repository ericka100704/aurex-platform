import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { getShellUser } from "@/lib/auth";
import { ensureDailyRoiCredit } from "@/lib/roiCredit";

export const dynamic = "force-dynamic";

export default async function UserDashboardLayout({ children }) {
  const user = await getShellUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");

  // Credit any Manila-day ROI due before the shell renders (cron backup).
  try {
    await ensureDailyRoiCredit(new Date(), { userId: user.id });
  } catch {
    // Never block the dashboard if catch-up fails — client RoiCatchUp retries.
  }

  return (
    <DashboardShell
      variant="user"
      baseHref="/dashboard"
      title="Investor Dashboard"
      subtitle="Here's your investment portfolio overview."
      userName={user.fullName}
      userEmail={user.email}
    >
      {children}
    </DashboardShell>
  );
}
