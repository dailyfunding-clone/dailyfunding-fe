"use client";

import { bridge, isInWebView } from "@dailyfunding/bridge";
import { Button, Field } from "@dailyfunding/design-system/components";
import ky from "ky";
import { useRouter } from "next/navigation";
import { useActionState, useState, useSyncExternalStore } from "react";

import { csrfHeaders, markSession } from "@/shared/api";
import { parseForm, signInSchema, type FormState } from "@/shared/lib";
import { useAppNavigate } from "@/shared/lib";
import { useDocumentTitle } from "@/shared/lib";

const SAVED_EMAIL_KEY = "saved_signin_email";

const subscribeSavedEmail = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
};
const getSavedEmail = () => window.localStorage.getItem(SAVED_EMAIL_KEY) ?? "";
const getServerSavedEmail = () => "";

const SignInPage = () => {
  useDocumentTitle("로그인");
  const router = useRouter();
  const nav = useAppNavigate();
  const savedEmail = useSyncExternalStore(subscribeSavedEmail, getSavedEmail, getServerSavedEmail);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [saveIdDraft, setSaveIdDraft] = useState<boolean | null>(null);
  const [keepLoginDraft, setKeepLoginDraft] = useState<boolean | null>(null);

  const email = emailDraft ?? savedEmail;
  const saveId = saveIdDraft ?? savedEmail !== "";
  const keepLogin = keepLoginDraft ?? true;

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const parsed = parseForm(signInSchema, formData);
      if ("error" in parsed) return { error: parsed.error };
      try {
        const res = await ky.post("/api/auth/login", {
          json: { ...parsed.data, keep_login: keepLogin },
          headers: csrfHeaders(),
          throwHttpErrors: false,
        });
        if (!res.ok) return { error: "이메일 또는 비밀번호가 맞지 않아요" };
        markSession(true);
        if (saveId) {
          window.localStorage.setItem(SAVED_EMAIL_KEY, parsed.data.email);
        } else {
          window.localStorage.removeItem(SAVED_EMAIL_KEY);
        }
        if (isInWebView()) {
          const codeRes = await ky.post("/api/auth/app-code", {
            credentials: "include",
            headers: csrfHeaders(),
            throwHttpErrors: false,
          });
          if (codeRes.ok) {
            const { code } = (await codeRes.json()) as { code: string };
            bridge.exchangeAuthCode(code);
          }
          return null;
        }
        router.push("/");
        return null;
      } catch {
        return { error: "잠시 후 다시 시도해 주세요" };
      }
    },
    null,
  );

  return (
    <div className="auth-page">
      <header className="auth-header">
        <h1>로그인</h1>
      </header>
      <form className="auth-form" action={formAction}>
        <Field
          label="이메일"
          type="email"
          name="email"
          placeholder="email@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmailDraft(e.target.value)}
          required
        />
        <Field
          label="비밀번호"
          type="password"
          name="password"
          placeholder="비밀번호를 입력해 주세요"
          autoComplete="current-password"
          required
        />
        <label className="form-check">
          <input
            type="checkbox"
            checked={saveId}
            onChange={(e) => setSaveIdDraft(e.target.checked)}
          />
          아이디 저장
        </label>
        <label className="form-check">
          <input
            type="checkbox"
            checked={keepLogin}
            onChange={(e) => setKeepLoginDraft(e.target.checked)}
          />
          로그인 유지
        </label>
        {state?.error && (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "로그인 중…" : "로그인"}
        </Button>
      </form>
      <div className="auth-links">
        <button type="button" onClick={() => nav.replace("/auth/signup", "가입하기")}>
          가입하기
        </button>
        <button type="button" onClick={() => nav.push("/auth/find/id", "아이디 찾기")}>
          아이디 찾기
        </button>
        <button type="button" onClick={() => nav.push("/auth/find/password", "비밀번호 재설정")}>
          비밀번호 재설정
        </button>
      </div>
    </div>
  );
};

export default SignInPage;
