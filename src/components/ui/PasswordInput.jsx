"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const STATUS_CLASS = {
  ok: "!border-emerald-400/70 !ring-2 !ring-emerald-400/30 focus:!border-emerald-400",
  error: "!border-red-400/70 !ring-2 !ring-red-400/35 focus:!border-red-400",
};

export default function PasswordInput({
  name = "password",
  placeholder = "Password",
  required = true,
  minLength,
  defaultValue,
  value,
  onChange,
  status,
  className = "",
  autoComplete,
}) {
  const [visible, setVisible] = useState(false);
  const statusClass = status ? STATUS_CLASS[status] || "" : "";
  const controlled = value !== undefined;

  return (
    <div className="relative">
      <input
        className={`input-luxury pr-12 ${statusClass} ${className}`}
        type={visible ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        {...(controlled
          ? { value, onChange }
          : { defaultValue })}
        autoComplete={
          autoComplete ||
          (name === "password" || name === "current" ? "current-password" : "new-password")
        }
        aria-invalid={status === "error"}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gold transition hover:bg-gold/10 hover:text-gold-200"
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={0}
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
