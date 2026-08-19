"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import DepositQrModal from "@/components/dashboard/DepositQrModal";
import {
  generateGcashAmountQrAction,
  getDepositPaymentStatusAction,
  initiatePaymongoDepositAction,
  submitDepositAction,
} from "@/actions/deposits";

function methodQrUrl(method) {
  return method?.qrImageUrl || "";
}

export default function DepositForm({ methods = [], onlinePayments = false }) {
  const [methodId, setMethodId] = useState(methods[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);
  const [session, setSession] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const selected = useMemo(
    () => methods.find((m) => m.id === methodId) || methods[0],
    [methods, methodId]
  );
  const pesos = Number(amount);
  const hasAmount = Number.isFinite(pesos) && pesos > 0;
  const staticQr = methodQrUrl(selected);
  const autoCredit = Boolean(onlinePayments);
  const paid = session?.status === "APPROVED";
  const awaitingReview = session?.status === "PENDING" && !autoCredit;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const depositId = params.get("depositId");
    if (params.get("canceled") === "1") {
      setMessage("Payment canceled. Enter the amount again and submit.");
    }
    if (params.get("paid") === "1" && depositId) {
      setSession({
        depositId,
        checkoutUrl: "",
        qrDataUrl: "",
        amount: Number.isFinite(pesos) && pesos > 0 ? pesos : 0,
        methodId,
        status: "PENDING",
      });
      setQrOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setQrOpen(false);
    setQrDataUrl("");
    setSession(null);
  }, [methodId]);

  useEffect(() => {
    if (!autoCredit || !session?.depositId || session.status === "APPROVED") return;
    let stopped = false;

    async function poll() {
      const result = await getDepositPaymentStatusAction(session.depositId);
      if (stopped) return;
      if (result.status === "APPROVED") {
        setMessage(result.message);
        setSession((prev) =>
          prev
            ? {
                ...prev,
                status: "APPROVED",
                amount: result.amount || prev.amount,
              }
            : prev
        );
        setAmount("");
        return;
      }
      if (result.status === "CANCELLED" || result.status === "REJECTED") {
        setMessage(result.message);
        setSession(null);
        setQrOpen(false);
      }
    }

    poll();
    const interval = setInterval(poll, 2500);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [autoCredit, session?.depositId, session?.status]);

  async function creditDeposit(form) {
    const formData = new FormData(form);
    const submittedAmount = Number(formData.get("amount")) || pesos;
    const result = await submitDepositAction(formData);
    setMessage(result.message || "");
    if (result.ok) {
      form.reset();
      setSession({
        depositId: result.data?.id || "manual",
        amount: submittedAmount,
        methodId,
        status: "PENDING",
      });
      setAmount("");
      setUploadKey((k) => k + 1);
      setQrOpen(true);
    }
    return result;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!hasAmount) {
      setMessage("Enter a valid deposit amount.");
      return;
    }

    setPending(true);
    setMessage("");
    try {
      if (autoCredit) {
        const result = await initiatePaymongoDepositAction({
          methodId,
          amount: pesos,
        });
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
          setQrDataUrl(result.qrDataUrl);
          setQrOpen(true);
          setMessage(result.message);
        } else if (result.useManual) {
          setMessage(result.message);
        } else {
          setMessage(result.message);
        }
        return;
      }

      const result = await generateGcashAmountQrAction(pesos, methodId);
      if (result.ok) {
        setQrDataUrl(result.qrDataUrl);
      } else {
        setQrDataUrl("");
        setMessage(result.message || "Showing your GCash QR. Enter the amount in the app.");
      }
      setQrOpen(true);
    } catch {
      if (autoCredit) {
        setMessage("Could not start GCash checkout. Try again.");
      } else {
        setQrDataUrl("");
        setQrOpen(true);
        setMessage("Showing your GCash QR. Enter the amount in the app.");
      }
    } finally {
      setPending(false);
    }
  }

  async function handleQrConfirm(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    setMessage("");
    try {
      await creditDeposit(form);
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

  return (
    <GlassCard hover={false}>
      <h3 className="font-display text-lg text-white">Deposit Funds</h3>
      <p className="text-xs text-white/45">
        {autoCredit
          ? "Submit an amount — pay in GCash. Your wallet credits automatically when payment is confirmed."
          : "Enter an amount, pay, then upload your receipt. Admin approves before your wallet credits."}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs text-white/50">Payment Method</label>
          <select
            className="input-luxury"
            name="methodId"
            required
            value={methodId}
            onChange={(e) => {
              setMethodId(e.target.value);
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
        <button type="submit" className="btn-rose w-full" disabled={pending}>
          {pending ? "Opening payment…" : "Submit Deposit"}
        </button>
        {!qrOpen && message ? <p className="text-center text-xs text-gold">{message}</p> : null}
      </form>

      <DepositQrModal
        open={qrOpen}
        method={selected}
        amount={session?.amount || pesos}
        qrUrl={session?.qrDataUrl || qrDataUrl || (!autoCredit ? staticQr : "")}
        checkoutUrl={session?.checkoutUrl}
        autoCredit={autoCredit}
        paid={paid}
        awaitingReview={awaitingReview}
        amountLocked={Boolean(qrDataUrl) || autoCredit}
        uploadKey={uploadKey}
        pending={pending}
        message={message}
        onClose={() => {
          if (!pending) setQrOpen(false);
        }}
        onConfirm={handleQrConfirm}
      />
    </GlassCard>
  );
}
