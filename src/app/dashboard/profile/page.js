import ProfileForm from "@/components/dashboard/ProfileForm";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  return <ProfileForm user={user} />;
}
