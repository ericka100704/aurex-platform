"use client";

import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Spinner from "@/components/ui/Spinner";
import AmPmTimeField from "@/components/ui/AmPmTimeField";
import { runRoiCreditAction, updateSettingsAction } from "@/actions/admin";

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-xs text-white/50">{label}</label>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/35">
        {title}
      </p>
      {children}
    </div>
  );
}

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
    try {
      const result = await updateSettingsAction(settings);
      setMessage(result.message || (result.ok ? "Saved." : "Failed."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard hover={false}>
        <h3 className="font-display text-lg text-white">System Settings</h3>
        <p className="text-xs text-white/45">
          Referral, withdrawal window, and KYC rules (live DB)
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-7">
          <Section title="Referral">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Direct Referral %">
                <input
                  type="number"
                  step="0.01"
                  className="input-luxury"
                  value={settings.referral_direct_rate || ""}
                  onChange={(e) => update("referral_direct_rate", e.target.value)}
                />
              </Field>
              <Field label="Level Commission %">
                <input
                  type="number"
                  step="0.01"
                  className="input-luxury"
                  value={settings.referral_level_rate || ""}
                  onChange={(e) => update("referral_level_rate", e.target.value)}
                />
              </Field>
              <Field label="Max Levels">
                <input
                  type="number"
                  className="input-luxury"
                  value={settings.referral_max_level || ""}
                  onChange={(e) => update("referral_max_level", e.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Withdrawals">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Min Withdrawal">
                <input
                  type="number"
                  className="input-luxury"
                  value={settings.min_withdrawal || ""}
                  onChange={(e) => update("min_withdrawal", e.target.value)}
                />
              </Field>
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
            </div>
          </Section>

          <Section title="Site">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="KYC Required">
                <select
                  className="input-luxury"
                  value={settings.is_kyc_required || "false"}
                  onChange={(e) => update("is_kyc_required", e.target.value)}
                >
                  <option value="false">FALSE</option>
                  <option value="true">TRUE</option>
                </select>
              </Field>
              <Field label="Site Name">
                <input
                  className="input-luxury"
                  value={settings.site_name || "SOLANA"}
                  onChange={(e) => update("site_name", e.target.value)}
                />
              </Field>
            </div>
          </Section>

          <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-5">
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
              <span className="text-xs text-emerald-400">{message}</span>
            ) : null}
          </div>
        </form>
      </GlassCard>

      <GlassCard hover={false}>
        <h3 className="font-display text-lg text-white">Daily ROI</h3>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/45">
          Credits due daily returns (Asia/Manila), catches up missed days, and
          returns principal when a plan ends. Runs after login and via cron at
          12:05 AM Manila. Use the button only for an immediate force-run.
        </p>
        <button
          type="button"
          className="btn-gold mt-5"
          disabled={roiPending}
          onClick={async () => {
            setRoiPending(true);
            setRoiMessage("");
            try {
              const result = await runRoiCreditAction();
              setRoiMessage(result.message || (result.ok ? "Done." : "Failed."));
            } finally {
              setRoiPending(false);
            }
          }}
        >
          {roiPending ? (
            <>
              <Spinner className="h-4 w-4" />
              Running...
            </>
          ) : (
            "Run daily ROI now"
          )}
        </button>
        {roiMessage ? (
          <p
            className={`mt-3 max-w-2xl break-words whitespace-pre-wrap text-xs ${
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
