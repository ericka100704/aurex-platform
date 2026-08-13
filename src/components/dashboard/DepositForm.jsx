"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, QrCode } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import FileUpload from "@/components/ui/FileUpload";
import { formatCurrency } from "@/lib/utils";
import {
  getDepositPaymentStatusAction,
  initiatePaymongoDepositAction,
  submitDepositAction,
} from "@/actions/deposits";

const ONLINE_TYPES = new Set(["GCASH", "MAYA"]);

export default function DepositForm({ methods = [], onlinePayments = false }) {
  const [methodId, setMethodId] = useState(methods[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);
  const [useManual, setUseManual] = useState(false);
  const [session, setSession] = useState(null);
  const requestRef = useRef(0);

  const selected = useMemo(
    () => methods.find((m) => m.id === methodId) || methods[0],
    [methods, methodId]
  );
  const isOnline =
    onlinePayments && selected && ONLINE_TYPES.has(selected.type) && !useManual;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const depositId = params.get("depositId");
    if (params.get("canceled") === "1") {
      setMessage("Payment canceled. Enter the amount again to generate a new QR.");
    }
    if (params.get("paid") === "1" && depositId) {
      setSession((prev) => prev || { depositId, checkoutUrl: "", qrDataUrl: "" });
    }
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setSession(null);
    }
  }, [isOnline, methodId]);

  useEffect(() => {
    if (!isOnline) return;
    const pesos = Number(amount);
    if (!Number.isFinite(pesos) || pesos <= 0) return;
    if (session?.status !== "APPROVED" && session?.amount === pesos && session?.methodId === methodId) {
      return;
    }

    const timer = setTimeout(() => {
      void generateQr(pesos);
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, methodId, isOnline]);

  useEffect(() => {
    if (!session?.depositId || session.status === "APPROVED") return;
    let stopped = false;

    async function poll() {
      const result = await getDepositPaymentStatusAction(session.depositId);
      if (stopped) return;
      if (result.status === "APPROVED") {
        setMessage(result.message);
        setSession((prev) => (prev ? { ...prev, status: "APPROVED" } : prev));
        setAmount("");
        return;
      }
      if (result.status === "CANCELLED" || result.status === "REJECTED") {
        setMessage(result.message);
        setSession(null);
      }
    }

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [session?.depositId, session?.status]);

  async function generateQr(pesos) {
    const requestId = ++requestRef.current;
    setPending(true);
    setMessage("");
    try {
      const result = await initiatePaymongoDepositAction({
        methodId,
        amount: pesos,
      });
      if (requestId !== requestRef.current) return;
      if (result.ok) {
        setSession({
          depositId: result.depositId,
          checkoutUrl: result.checkoutUrl,
          qrDataUrl: result.qrDataUrl,
          expiresAt: result.expiresAt,
          amount: pesos,
          methodId,
          methodName: result.methodName,
          status: "PENDING",
        });
        setMessage(result.message);
      } else if (result.useManual) {
        setUseManual(true);
        setMessage(result.message);
      } else {
        setMessage(result.message);
      }
    } catch {
      if (requestId !== requestRef.current) return;
      setMessage("Could not generate the GCash QR. Try again.");
    } finally {
      if (requestId === requestRef.current) setPending(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    setMessage("");
    try {
      const formData = new FormData(form);
      const result = await submitDepositAction(formData);
      setMessage(result.message);
      if (result.ok) {
        form.reset();
        setAmount("");
        setUploadKey((k) => k + 1);
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!methods.length) {
    return (
      <GlassCard hover={false}>
        <h3 className="font-display text-lg text-white">Deposit Funds</h3>
        <p className="mt-2 text-sm text-white/45">
          No active payment methods. Ask admin to enable GCash or GoTyme.
        </p>
      </GlassCard>
    );
  }

  const paid = session?.status === "APPROVED";

  return (
    <GlassCard hover={false}>
      <h3 className="font-display text-lg text-white">Deposit Funds</h3>
      <p className="text-xs text-white/45">
        {isOnline
          ? "Set an amount — a GCash QR appears. Paid deposits credit automatically."
          : "Upload proof — credited to your wallet right away"}
      </p>

      <form onSubmit={isOnline ? (e) => e.preventDefault() : handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs text-white/50">Payment Method</label>
          <select
            className="input-luxury"
            name="methodId"
            required
            value={methodId}
            onChange={(e) => {
              setMethodId(e.target.value);
              setUseManual(false);
              setSession(null);
              setMessage("");
            }}
          >
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.accountNumber}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Amount (₱)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            required
            name="amount"
            className="input-luxury"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {isOnline ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
              {paid ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  <p className="text-sm text-white">Payment received</p>
                  <p className="text-xs text-white/45">
                    {formatCurrency(session.amount)} credited to your wallet.
                  </p>
                </div>
              ) : session?.qrDataUrl ? (
                <>
                  <p className="text-xs text-white/50">
                    Scan with GCash / QR Ph · {formatCurrency(session.amount)}
                  </p>
                  <img
                    src={session.qrDataUrl}
                    alt="GCash payment QR"
                    className="mx-auto mt-3 h-52 w-52 rounded-xl bg-white p-2"
                  />
                  <p className="mt-3 flex items-center justify-center gap-2 text-xs text-gold">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Waiting for payment — no submit needed
                  </p>
                  {session.checkoutUrl ? (
                    <a
                      href={session.checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost mt-3 inline-flex !px-4 !py-2 text-xs"
                    >
                      Open GCash checkout
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-white/45">
                  {pending ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-gold" />
                      <p className="text-sm">Generating {selected?.name} QR…</p>
                    </>
                  ) : (
                    <>
                      <QrCode className="h-8 w-8 text-white/30" />
                      <p className="text-sm">Enter an amount to show the QR code</p>
                    </>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              className="text-xs text-white/40 underline decoration-white/20"
              onClick={() => {
                setUseManual(true);
                setSession(null);
              }}
            >
              Can&apos;t scan? Upload a receipt instead
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-xs text-white/50">Reference Note</label>
              <input
                className="input-luxury"
                name="referenceNote"
                placeholder="Optional transfer reference"
              />
            </div>
            <FileUpload key={uploadKey} name="proof" accept="image/*" label="Receipt / Proof" />
            <button type="submit" className="btn-rose w-full" disabled={pending}>
              {pending ? "Submitting..." : "Submit Deposit"}
            </button>
            {onlinePayments && selected && ONLINE_TYPES.has(selected.type) ? (
              <button
                type="button"
                className="w-full text-xs text-white/40 underline decoration-white/20"
                onClick={() => setUseManual(false)}
              >
                Back to GCash QR
              </button>
            ) : null}
          </>
        )}

        {message ? <p className="text-center text-xs text-gold">{message}</p> : null}
      </form>
    </GlassCard>
  );
}
