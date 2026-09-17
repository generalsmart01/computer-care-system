"use client";
import { useState, type InputHTMLAttributes } from "react";

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="password-input-wrap">
      <input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.6 10.6 0 0 1 12 4c5.5 0 9 5.3 9 5.3a15 15 0 0 1-2.1 2.6M6.2 6.2A16.8 16.8 0 0 0 3 9.3S6.5 14.7 12 14.7c1 0 2-.2 2.8-.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 12s3.5-5.3 9-5.3S21 12 21 12s-3.5 5.3-9 5.3S3 12 3 12Z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        )}
      </button>
    </span>
  );
}
