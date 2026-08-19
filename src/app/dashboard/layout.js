import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function UserDashboardLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");

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
