"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Clock3, Copy, ExternalLink, Loader2, X } from "lucide-react";
import FileUpload from "@/components/ui/FileUpload";
import { formatCurrency } from "@/lib/utils";

function openGcashApp() {
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) {
    window.location.href =
      "intent://pay#Intent;scheme=gcash;package=com.globe.gcash.android;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.globe.gcash.android;end";
    return;
  }
  if (/iphone|ipad|ipod/i.test(ua)) {
    window.location.href = "gcash://";
    return;
  }
  window.open("https://www.gcash.com", "_blank", "noopener,noreferrer");
}

export default function DepositQrModal({
  open,
  method,
  amount,
  checkoutUrl,
  autoCredit = false,
  paid = false,
  awaitingReview = false,
  uploadKey,
  pending,
  message,
  onClose,
  onConfirm,
}) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, pending, onClose]);

  async function copyNumber() {
    const number = method?.accountNumber || "";
    if (!number) return;
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/80"
        aria-label="Close"
        disabled={pending}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deposit-qr-title"
        className="relative z-10 max-h-[min(92dvh,92vh)] w-full max-w-md overflow-y-auto rounded-[1.75rem] border border-white/10 bg-[#121212] p-5 shadow-[0_0_60px_rgba(255,105,180,0.18)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          {paid || awaitingReview ? (
            <div className="min-w-0 flex-1" />
          ) : (
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-gold">
                Pay with {method?.name || "GCash"}
              </p>
              <h3 id="deposit-qr-title" className="font-display mt-1 text-xl text-white">
                {formatCurrency(amount)}
              </h3>
              <p className="mt-1 text-xs text-white/45">
                {autoCredit
                  ? "Open checkout and pay the locked amount. Your wallet credits itself when paid."
                  : "Send the exact amount to the account below, then upload your receipt."}
              </p>
            </div>
          )}
          <button
            type="button"
            className="rounded-full border border-white/10 p-2 text-white/50 transition hover:border-magenta/40 hover:text-white"
            aria-label="Close"
            disabled={pending}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {paid ? (
          <div className="flex flex-col items-center px-2 py-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/30">
              <CheckCircle2 className="h-9 w-9 text-emerald-400" />
            </span>
            <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-gold">Confirmed</p>
            <h3 id="deposit-qr-title" className="font-display mt-2 text-2xl text-white">
              We received your deposit.
            </h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/55">
              {formatCurrency(amount)} is now in your wallet. You can start investing.
            </p>
            <button type="button" className="btn-rose mt-6 w-full" onClick={onClose}>
              Continue
            </button>
          </div>
        ) : awaitingReview ? (
          <div className="flex flex-col items-center px-2 py-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 ring-1 ring-gold/30">
              <Clock3 className="h-9 w-9 text-gold" />
            </span>
            <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-gold">Pending review</p>
            <h3 id="deposit-qr-title" className="font-display mt-2 text-2xl text-white">
              Receipt submitted.
            </h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/55">
              {formatCurrency(amount)} will appear in your wallet after an admin verifies your receipt.
            </p>
            <button type="button" className="btn-rose mt-6 w-full" onClick={onClose}>
              Continue
            </button>
          </div>
        ) : (
          <>
            {autoCredit ? (
              <>
                <p className="mt-6 text-sm text-white/55">
                  Open checkout and pay the exact amount. Your wallet credits when payment is confirmed.
                </p>
                <p className="mt-3 flex items-center justify-center gap-2 text-xs text-gold">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Waiting for payment — no receipt needed
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {checkoutUrl ? (
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-rose !px-3 !py-2.5 text-xs"
                    >
                      Open GCash checkout
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <button type="button" className="btn-rose !px-3 !py-2.5 text-xs" onClick={openGcashApp}>
                      Open GCash
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-3.5 py-3">
                  <p className="text-[11px] text-white/40">Send to</p>
                  <p className="text-sm text-white">{method?.accountName || "AUREX"}</p>
                  <p className="font-medium tracking-wide text-gold">{method?.accountNumber}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {method?.type === "GCASH" ? (
                    <button type="button" className="btn-rose !px-3 !py-2.5 text-xs" onClick={openGcashApp}>
                      Open GCash
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button type="button" className="btn-rose !px-3 !py-2.5 text-xs" onClick={copyNumber}>
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? "Copied" : "Copy account"}
                    </button>
                  )}
                  <button type="button" className="btn-ghost !px-3 !py-2.5 text-xs" onClick={copyNumber}>
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Copied" : "Copy number"}
                  </button>
                </div>
                <form onSubmit={onConfirm} className="mt-4 space-y-3">
                  <input type="hidden" name="methodId" value={method?.id || ""} />
                  <input type="hidden" name="amount" value={String(amount)} />
                  <input
                    className="input-luxury"
                    name="referenceNote"
                    placeholder="Optional transfer reference"
                  />
                  <FileUpload
                    key={uploadKey}
                    name="proof"
                    accept="image/*"
                    required
                    label="Receipt / Proof"
                  />
                  <button type="submit" className="btn-rose w-full" disabled={pending}>
                    {pending ? "Submitting..." : "I've paid — submit for review"}
                  </button>
                </form>
              </>
            )}
          </>
        )}

        {message && !paid && !awaitingReview ? (
          <p className="mt-3 text-center text-xs text-gold">{message}</p>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
