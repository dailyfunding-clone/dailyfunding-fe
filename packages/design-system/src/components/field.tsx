"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const EyeIcon = ({ off }: { off?: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
    {off ? <line x1="4" y1="4" x2="20" y2="20" /> : null}
  </svg>
);

export const Field = ({ label, type, error, ...props }: Props) => {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const errorId = `${useId()}-error`;

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-input-wrap">
        <input
          className="input"
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            className="field-eye"
            aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
            onClick={() => setVisible((v) => !v)}
          >
            <EyeIcon off={!visible} />
          </button>
        ) : null}
      </span>
      {error ? (
        <span className="form-error" role="alert" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
};
