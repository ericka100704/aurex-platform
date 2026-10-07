import WithdrawForm from "@/components/dashboard/WithdrawForm";
import { requireUser } from "@/lib/auth";
import { getAppSettings, getUserBalance } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function WithdrawPage() {
  const user = await requireUser();
  const [settings, balance] = await Promise.all([
    getAppSettings(),
    getUserBalance(user.id),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <WithdrawForm
        balance={balance}
        windowStart={settings.withdrawal_window_start}
        windowEnd={settings.withdrawal_window_end}
        releaseTime={settings.withdrawal_release_time}
        defaultName={user.fullName}
        defaultPhone={user.phone || ""}
      />
    </div>
  );
}
