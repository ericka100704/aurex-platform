import HomeLanding from "@/components/home/HomeLanding";
import { getActivePlans } from "@/lib/queries";
import { getSettingsMap, settingNumber } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [plans, settings] = await Promise.all([
    getActivePlans(),
    getSettingsMap(),
  ]);

  return (
    <HomeLanding
      plans={plans}
      rewards={{
        direct: settingNumber(settings, "referral_direct_rate", 8),
        level: settingNumber(settings, "referral_level_rate", 1),
        maxLevel: settingNumber(settings, "referral_max_level", 4),
      }}
    />
  );
}
