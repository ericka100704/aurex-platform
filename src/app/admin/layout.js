import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { getShellUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }) {
  const user = await getShellUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

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
