"use client";

import { isInWebView, requestReauth } from "@dailyfunding/bridge";
import { Button, Field } from "@dailyfunding/design-system/components";
import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import { ApiRequestError, api } from "@/shared/api";
import { parseForm, reauthSchema, type FormState } from "@/shared/lib";

import type { ReactNode } from "react";

type ReauthValue = {
  ensure: (refresh?: boolean) => Promise<string | null>;
  reset: () => void;
};

const ReauthContext = createContext<ReauthValue | null>(null);

export const useReauth = () => useContext(ReauthContext);

type Props = {
  title?: string;
  description?: string;
  children: ReactNode;
};

const ReauthProvider = ({ title, description, children }: Props) => {
  const inApp = isInWebView();
  const [token, setToken] = useState<string | null>(null);
  const [webOpen, setWebOpen] = useState(false);
  const resolvers = useRef<Set<(t: string | null) => void>>(new Set());

  const settle = useCallback((t: string | null) => {
    for (const resolve of resolvers.current) resolve(t);
    resolvers.current.clear();
    if (t) setToken(t);
    setWebOpen(false);
  }, []);

  const ensure = useCallback(
    async (refresh = false) => {
      if (!refresh && token) return token;
      if (inApp) {
        const t = await requestReauth();
        if (t) setToken(t);
        return t;
      }
      return new Promise<string | null>((resolve) => {
        resolvers.current.add(resolve);
        setWebOpen(true);
      });
    },
    [token, inApp],
  );

  const reset = useCallback(() => setToken(null), []);

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const parsed = parseForm(reauthSchema, formData);
      if ("error" in parsed) return { error: parsed.error };
      try {
        const res = await api.request<{ reauth_token: string }>(
          "post",
          "/api/auth/reauth",
          parsed.data,
        );
        settle(res.reauth_token);
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

  return (
    <ReauthContext.Provider value={{ ensure, reset }}>
      {children}
      {webOpen && !inApp && (
        <div className="modal-backdrop">
          <div className="modal reauth-modal">
            <h2 className="reauth-title">{title ?? "비밀번호 확인"}</h2>
            <p className="muted reauth-desc">
              {description ?? "계속하려면 비밀번호를 한 번 더 입력해 주세요."}
            </p>
            <form className="auth-form" action={formAction}>
              <Field
                label="비밀번호"
                type="password"
                name="password"
                placeholder="비밀번호를 입력해 주세요"
                autoComplete="current-password"
                required
              />
              {state?.error && <p className="form-error" role="alert">{state.error}</p>}
              <Button type="submit" disabled={pending}>
                {pending ? "확인 중…" : "확인"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => settle(null)}
              >
                취소
              </Button>
            </form>
          </div>
        </div>
      )}
    </ReauthContext.Provider>
  );
};

export default ReauthProvider;
