"use client";

import { Button, Field } from "@dailyfunding/design-system/components";
import ky from "ky";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, useState } from "react";

import {
  parseForm,
  passwordResetRequestSchema,
  passwordResetSchema,
  type FormState,
} from "@/shared/lib";
import { useAppNavigate } from "@/shared/lib";
import { useDocumentTitle } from "@/shared/lib";


const FindPasswordPage = () => {
  useDocumentTitle("비밀번호 찾기");
  return (
  <Suspense>
    <FindPasswordInner />
  </Suspense>
);
};

const FindPasswordInner = () => {
  const nav = useAppNavigate();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [requested, setRequested] = useState(false);

  const [requestState, requestAction, requestPending] = useActionState<
    FormState,
    FormData
  >(async (_prev, formData) => {
    const parsed = parseForm(passwordResetRequestSchema, formData);
    if ("error" in parsed) return { error: parsed.error };
    try {
      const res = await ky.post("/api/auth/password/reset-request", {
          json: parsed.data,
          throwHttpErrors: false,
        });
      const body = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!res.ok) {
        return { error: body?.message ?? "재설정 요청에 실패했어요" };
      }
      setRequested(true);
      return null;
    } catch {
      return { error: "잠시 후 다시 시도해 주세요" };
    }
  }, null);

  const [resetState, resetAction, resetPending] = useActionState<
    FormState,
    FormData
  >(async (_prev, formData) => {
    const parsed = parseForm(passwordResetSchema, {
      ...Object.fromEntries(formData),
      token,
    });
    if ("error" in parsed) return { error: parsed.error };
    try {
      const res = await ky.post("/api/auth/password/reset", {
        json: parsed.data,
        throwHttpErrors: false,
      });
      const body = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!res.ok) {
        return { error: body?.message ?? "비밀번호 재설정에 실패했어요" };
      }
      setDone(true);
      return null;
    } catch {
      return { error: "잠시 후 다시 시도해 주세요" };
    }
  }, null);

  const error = resetState?.error ?? requestState?.error ?? "";

  if (done) {
    return (
      <div className="auth-page">
        <header className="auth-header">
          <h1>비밀번호 재설정</h1>
        </header>
        <div className="card">
          <p>비밀번호를 재설정했어요. 새 비밀번호로 로그인해 주세요.</p>
        </div>
        <div className="auth-links">
          <button type="button" onClick={() => nav.replace("/auth/signin", "로그인")}>
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  if (requested && !token) {
    return (
      <div className="auth-page">
        <header className="auth-header">
          <h1>비밀번호 재설정</h1>
        </header>
        <div className="card">
          <p>재설정 링크를 이메일로 보냈어요. 메일을 확인해 주세요.</p>
        </div>
        <div className="auth-links">
          <button type="button" onClick={() => nav.replace("/auth/signin", "로그인")}>
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (token) {
    return (
      <div className="auth-page">
        <header className="auth-header">
          <h1>비밀번호 재설정</h1>
          <p className="auth-desc">새 비밀번호를 입력해 주세요</p>
        </header>
        <form className="auth-form" action={resetAction}>
          <Field
            label="새 비밀번호"
            type="password"
            name="password"
            placeholder="8자 이상 입력해 주세요"
            autoComplete="new-password"
            required
          />
          <Field
            label="새 비밀번호 확인"
            type="password"
            name="password_confirm"
            placeholder="한 번 더 입력해 주세요"
            autoComplete="new-password"
            required
          />
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={resetPending}>
            {resetPending ? "변경 중…" : "비밀번호 변경"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <h1>비밀번호 재설정</h1>
        <p className="auth-desc">가입한 이메일을 입력해 주세요</p>
      </header>
      <form className="auth-form" action={requestAction}>
        <Field
          label="이메일"
          type="email"
          name="email"
          placeholder="email@example.com"
          autoComplete="email"
          required
        />
        {error && <p className="form-error">{error}</p>}
        <Button type="submit" disabled={requestPending}>
          {requestPending ? "확인 중…" : "재설정 링크 받기"}
        </Button>
      </form>
      <div className="auth-links">
        <button type="button" onClick={() => nav.replace("/auth/signin", "로그인")}>
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default FindPasswordPage;
