import UsersTable from "@/components/admin/UsersTable";
import { getManagedUsers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getManagedUsers();
  return <UsersTable initialUsers={users} />;
}
