"use client";

import { useMemo, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency, formatClockTime } from "@/lib/utils";
import { requestWithdrawalAction } from "@/actions/withdrawals";

const PAYOUT_TYPES = [
  { value: "GCash", label: "GCash" },
  { value: "GoTyme", label: "GoTyme" },
  { value: "Maya", label: "Maya" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Crypto", label: "Crypto" },
  { value: "Other", label: "Other" },
];

export default function WithdrawForm({
  balance = 0,
  windowStart = "06:00",
  windowEnd = "16:00",
  defaultName = "",
  defaultPhone = "",
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [method, setMethod] = useState(PAYOUT_TYPES[0].value);
  const [customMethod, setCustomMethod] = useState("");
  const [amount, setAmount] = useState("");

  const isOther = method === "Other";
  const payoutLabel = isOther ? customMethod.trim() || "Other" : method;

  const numberLabel = useMemo(() => {
    const key = String(payoutLabel || "").toLowerCase();
    if (key.includes("gcash")) return "GCash number";
    if (key.includes("maya")) return "Maya number";
    if (key.includes("gotyme")) return "GoTyme number";
    if (key.includes("bank")) return "Account number";
    if (key.includes("crypto")) return "Wallet address";
    return "Account / mobile number";
  }, [payoutLabel]);

  const pesos = Number(amount);
  const hasAmount = amount !== "" && Number.isFinite(pesos);
  const overBalance = hasAmount && pesos > Number(balance);
  const amountInvalid = overBalance;
  const amountHint = overBalance
    ? `Amount exceeds available balance (${formatCurrency(balance)}).`
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (amountInvalid || !hasAmount || pesos <= 0) {
      setMessage(amountHint || "Enter a valid amount.");
      return;
    }
    if (isOther && !customMethod.trim()) {
      setMessage("Enter the bank or e-wallet name.");
      return;
    }

    const form = e.currentTarget;
    setPending(true);
    setMessage("");
    try {
      const formData = new FormData(form);
      formData.set("methodType", isOther ? customMethod.trim() : method);
      const result = await requestWithdrawalAction(formData);
      setMessage(result.message);
      if (result.ok) {
        form.reset();
        setAmount("");
        setMethod(PAYOUT_TYPES[0].value);
        setCustomMethod("");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <GlassCard hover={false}>
      <h3 className="font-display text-lg text-white">Withdraw</h3>
      <p className="text-xs text-white/45">
        Available: {formatCurrency(balance)}
      </p>
      <p className="mt-1 text-[11px] text-gold/80">
        Requests: {formatClockTime(windowStart)}–{formatClockTime(windowEnd)}{" "}
        (Asia/Manila) · Payout within minutes after admin approval
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs text-white/50">Amount</label>
          <input
            type="number"
            min="1"
            step="0.01"
            required
            name="amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setMessage("");
            }}
            aria-invalid={amountInvalid}
            className={`input-luxury ${
              amountInvalid
                ? "!border-red-400/70 !ring-2 !ring-red-400/35 focus:!border-red-400"
                : ""
            }`}
          />
          {amountHint ? (
            <p className="mt-1.5 text-xs text-rose-300">{amountHint}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">
            Bank / e-wallet type
          </label>
          <select
            className="input-luxury"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              if (e.target.value !== "Other") setCustomMethod("");
            }}
          >
            {PAYOUT_TYPES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {isOther ? (
            <input
              className="input-luxury mt-2"
              value={customMethod}
              onChange={(e) => setCustomMethod(e.target.value)}
              placeholder="Type bank or e-wallet name"
              required
              autoFocus
            />
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Account name</label>
          <input
            className="input-luxury"
            name="accountName"
            defaultValue={defaultName}
            placeholder="Name registered on the wallet"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">{numberLabel}</label>
          <input
            className="input-luxury"
            name="accountNumber"
            type={payoutLabel.toLowerCase().includes("crypto") ? "text" : "tel"}
            inputMode={
              payoutLabel.toLowerCase().includes("crypto") ? "text" : "numeric"
            }
            defaultValue={defaultPhone}
            placeholder={
              payoutLabel.toLowerCase().includes("crypto")
                ? "Wallet address"
                : payoutLabel.toLowerCase().includes("bank")
                  ? "Bank account number"
                  : "Account or mobile number"
            }
            required
          />
          <p className="mt-1 text-[11px] text-white/40">
            Payout is sent to this{" "}
            {payoutLabel.toLowerCase().includes("crypto") ? "wallet" : "account"}.
            Enter your {payoutLabel} details as shown in the app.
          </p>
        </div>
        <button
          type="submit"
          className="btn-gold w-full"
          disabled={pending || amountInvalid}
        >
          {pending ? (
            <>
              <Spinner className="h-4 w-4" />
              Submitting...
            </>
          ) : (
            "Request Withdrawal"
          )}
        </button>
        {message && !amountHint ? (
          <p className="text-center text-xs text-gold">{message}</p>
        ) : null}
      </form>
    </GlassCard>
  );
}
