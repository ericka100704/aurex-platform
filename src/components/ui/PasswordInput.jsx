"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  name = "password",
  placeholder = "Password",
  required = true,
  minLength,
  defaultValue,
  className = "",
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        className={`input-luxury pr-12 ${className}`}
        type={visible ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        defaultValue={defaultValue}
        autoComplete={name === "password" ? "current-password" : "new-password"}
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
