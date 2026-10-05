import SettingsForm from "@/components/admin/SettingsForm";
import { getAppSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";
/** Manual ROI catch-up can process many matured investments. */
export const maxDuration = 300;

export default async function AdminSettingsPage() {
  const settings = await getAppSettings();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-white">System Settings</h2>
        <p className="text-sm text-white/45">
          Referral commission and withdrawal rules
        </p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
