import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm />
    </div>
  );
}
