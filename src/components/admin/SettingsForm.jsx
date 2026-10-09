"use client";

import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Spinner from "@/components/ui/Spinner";
import AmPmTimeField from "@/components/ui/AmPmTimeField";
import { runRoiCreditAction, updateSettingsAction } from "@/actions/admin";

export default function SettingsForm({ initialSettings = {} }) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [roiMessage, setRoiMessage] = useState("");
  const [roiPending, setRoiPending] = useState(false);

  function update(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    setMessage("");
    const result = await updateSettingsAction(settings);
    setMessage(result.message || (result.ok ? "Saved." : "Failed."));
    setPending(false);
  }

  return (
    <div className="space-y-4">
      <GlassCard hover={false}>
        <h3 className="font-display text-lg text-white">System Settings</h3>
        <p className="text-xs text-white/45">
          Referral, withdrawal window, and KYC rules (live DB)
        </p>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-white/50">Direct Referral %</label>
            <input
              type="number"
              step="0.01"
              className="input-luxury"
              value={settings.referral_direct_rate || ""}
              onChange={(e) => update("referral_direct_rate", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Level Commission %</label>
            <input
              type="number"
              step="0.01"
              className="input-luxury"
              value={settings.referral_level_rate || ""}
              onChange={(e) => update("referral_level_rate", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Max Levels</label>
            <input
              type="number"
              className="input-luxury"
              value={settings.referral_max_level || ""}
              onChange={(e) => update("referral_max_level", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Min Withdrawal</label>
            <input
              type="number"
              className="input-luxury"
              value={settings.min_withdrawal || ""}
              onChange={(e) => update("min_withdrawal", e.target.value)}
            />
          </div>
          <AmPmTimeField
            label="Window Start"
            value={settings.withdrawal_window_start || "06:00"}
            fallback="06:00"
            onChange={(v) => update("withdrawal_window_start", v)}
          />
          <AmPmTimeField
            label="Window End"
            value={settings.withdrawal_window_end || "16:00"}
            fallback="16:00"
            onChange={(v) => update("withdrawal_window_end", v)}
          />
          <div>
            <label className="mb-1 block text-xs text-white/50">KYC Required</label>
            <select
              className="input-luxury"
              value={settings.is_kyc_required || "false"}
              onChange={(e) => update("is_kyc_required", e.target.value)}
            >
              <option value="false">FALSE</option>
              <option value="true">TRUE</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Site Name</label>
            <input
              className="input-luxury"
              value={settings.site_name || "SOLANA"}
              onChange={(e) => update("site_name", e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="btn-rose" disabled={pending}>
              {pending ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </button>
            {message ? (
              <span className="ml-3 text-xs text-emerald-400">{message}</span>
            ) : null}
          </div>
        </form>
      </GlassCard>

      <GlassCard hover={false}>
        <h3 className="font-display text-lg text-white">Daily ROI</h3>
        <p className="text-xs text-white/45">
          Credits due daily returns (Asia/Manila), catches up missed days, and
          returns principal when a plan ends. Runs in the background after login
          and via cron at 12:05 AM Manila — navigation stays instant. Use the
          button only for an immediate force-run.
        </p>
        <button
          type="button"
          className="btn-gold mt-5"
          disabled={roiPending}
          onClick={async () => {
            setRoiPending(true);
            setRoiMessage("");
            const result = await runRoiCreditAction();
            setRoiMessage(result.message || (result.ok ? "Done." : "Failed."));
            setRoiPending(false);
          }}
        >
          {roiPending ? "Running..." : "Run daily ROI now"}
        </button>
        {roiMessage ? (
          <p
            className={`mt-3 break-words whitespace-pre-wrap text-xs ${
              /error/i.test(roiMessage) ? "text-rose-300" : "text-emerald-400"
            }`}
          >
            {roiMessage}
          </p>
        ) : null}
      </GlassCard>
    </div>
  );
}
