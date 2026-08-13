import WithdrawForm from "@/components/dashboard/WithdrawForm";
import { requireUser } from "@/lib/auth";
import { getAppSettings, getActiveDepositMethods } from "@/lib/queries";
import { settingNumber } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function WithdrawPage() {
  const user = await requireUser();
  const [settings, methods] = await Promise.all([
    getAppSettings(),
    getActiveDepositMethods(),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <WithdrawForm
        balance={user.balance}
        minWithdrawal={settingNumber(settings, "min_withdrawal", 500)}
        windowStart={settings.withdrawal_window_start}
        windowEnd={settings.withdrawal_window_end}
        releaseTime={settings.withdrawal_release_time}
        methods={
          methods.length
            ? methods.map((m) => m.name)
            : ["GCash", "GoTyme"]
        }
        defaultName={user.fullName}
        defaultPhone={user.phone || ""}
      />
    </div>
  );
}
