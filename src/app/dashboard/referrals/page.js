import ReferralPanel from "@/components/dashboard/ReferralPanel";
import StatCard from "@/components/ui/StatCard";
import { requireUser } from "@/lib/auth";
import { getAppSettings, getUserReferrals } from "@/lib/queries";
import { settingNumber } from "@/lib/settings";
import { formatCurrency, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const user = await requireUser();
  const [referrals, settings] = await Promise.all([
    getUserReferrals(user.id),
    getAppSettings(),
  ]);
  const earned = referrals.reduce((s, r) => s + Number(r.earned || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Direct Bonus"
          value={formatPercent(settingNumber(settings, "referral_direct_rate", 8))}
          subtext={`Levels 2–${settingNumber(settings, "referral_max_level", 4)}: ${formatPercent(settingNumber(settings, "referral_level_rate", 1))} each`}
          icon="share"
          accent="gold"
        />
        <StatCard
          label="Commission Earned"
          value={formatCurrency(earned)}
          subtext="From direct referrals"
          icon="coins"
          accent="rose"
        />
      </div>
      <div className="mx-auto max-w-2xl">
        <ReferralPanel referralCode={user.referralCode} referrals={referrals} />
      </div>
    </div>
  );
}
