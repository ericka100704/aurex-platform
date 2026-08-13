import AdminInvestmentsTable from "@/components/admin/AdminInvestmentsTable";
import { getAdminInvestments } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminInvestmentsPage() {
  const investments = await getAdminInvestments();
  return <AdminInvestmentsTable investments={investments} />;
}
