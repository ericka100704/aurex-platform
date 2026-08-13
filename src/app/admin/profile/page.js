import ProfileForm from "@/components/dashboard/ProfileForm";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const user = await requireAdmin();
  return <ProfileForm user={user} />;
}
