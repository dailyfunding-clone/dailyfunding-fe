"use client";

import { isInWebView, requestReauth } from "@dailyfunding/bridge";
import { Button, Field } from "@dailyfunding/design-system/components";
import { createContext, useActionState, useContext, useEffect, useState } from "react";

import { ApiRequestError, api } from "@/shared/api";
import { parseForm, reauthSchema, type FormState } from "@/shared/lib";

import type { ReactNode } from "react";

type ReauthValue = { token: string; reset: () => void };

const ReauthContext = createContext<ReauthValue | null>(null);

export const useReauth = () => useContext(ReauthContext);

type Props = {
  title?: string;
  description?: string;
  children: ReactNode;
};

const ReauthGate = ({
  title,
  description,
  children,
}: Props) => {
  const inApp = isInWebView();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const requestNativePin = async () => {
    setPending(true);
    setError("");
    const t = await requestReauth();
    if (t) {
      setToken(t);
    } else {
      setError("간편비밀번호 확인이 취소됐어요");
    }
    setPending(false);
  };

  useEffect(() => {
    if (!inApp) return;
    void requestReauth().then((t) => {
      if (t) setToken(t);
    });
  }, [inApp]);

  const [state, formAction, formPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const parsed = parseForm(reauthSchema, formData);
      if ("error" in parsed) return { error: parsed.error };
      try {
        const res = await api.request<{ reauth_token: string }>(
          "post",
          "/api/auth/reauth",
          parsed.data,
        );
        setToken(res.reauth_token);
        return null;
      } catch (err) {
        return {
          error:
            err instanceof ApiRequestError && err.status === 401
              ? "비밀번호가 맞지 않아요"
              : "잠시 후 다시 시도해 주세요",
        };
      }
    },
    null,
  );

  if (!token) {
    return (
      <div className="modal-backdrop">
        <div className="modal reauth-modal">
          <h2 className="reauth-title">{title ?? (inApp ? "간편비밀번호 확인" : "비밀번호 확인")}</h2>
          <p className="muted reauth-desc">
            {description ??
              (inApp
                ? "계속하려면 간편비밀번호 6자리를 입력해 주세요."
                : "계속하려면 비밀번호를 한 번 더 입력해 주세요.")}
          </p>
          {inApp ? (
            <div className="auth-form">
              {error && <p className="form-error">{error}</p>}
              <Button type="button" disabled={pending} onClick={() => void requestNativePin()}>
                {pending ? "확인 중…" : "간편비밀번호 입력"}
              </Button>
            </div>
          ) : (
            <form className="auth-form" action={formAction}>
              <Field
                label="비밀번호"
                type="password"
                name="password"
                placeholder="비밀번호를 입력해 주세요"
                autoComplete="current-password"
                required
              />
              {state?.error && <p className="form-error">{state.error}</p>}
              <Button type="submit" disabled={formPending}>
                {formPending ? "확인 중…" : "확인"}
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <ReauthContext.Provider value={{ token, reset: () => setToken(null) }}>
      {children}
    </ReauthContext.Provider>
  );
};

export default ReauthGate;
