"use client";

import { Button, Field } from "@dailyfunding/design-system/components";
import ky from "ky";
import { useActionState } from "react";

import { findIdSchema, parseForm, type FormState } from "@/shared/lib";
import { useAppNavigate } from "@/shared/lib";
import { useDocumentTitle } from "@/shared/lib";


type FindIdState = FormState | { email: string };

const FindIdPage = () => {
  useDocumentTitle("아이디 찾기");
  const nav = useAppNavigate();
  const [state, formAction, pending] = useActionState<FindIdState, FormData>(
    async (_prev, formData) => {
      const parsed = parseForm(findIdSchema, formData);
      if ("error" in parsed) return { error: parsed.error };
      try {
        const res = await ky.post("/api/auth/find-id", {
          json: parsed.data,
          throwHttpErrors: false,
        });
        const body = (await res.json().catch(() => null)) as {
          email?: string;
          message?: string;
        } | null;
        if (!res.ok) {
          return { error: body?.message ?? "일치하는 계정을 찾지 못했어요" };
        }
        return { email: body?.email ?? "" };
      } catch {
        return { error: "잠시 후 다시 시도해 주세요" };
      }
    },
    null,
  );

  const found = state && "email" in state ? state.email : "";
  const error = state && "error" in state ? state.error : "";

  if (found) {
    return (
      <div className="auth-page">
        <header className="auth-header">
          <h1>아이디 찾기</h1>
        </header>
        <div className="card">
          <p>
            가입된 이메일이에요
            <br />
            <strong>{found}</strong>
          </p>
        </div>
        <div className="auth-links">
          <button type="button" onClick={() => nav.replace("/auth/signin", "로그인")}>
            로그인하기
          </button>
          <button
            type="button"
            onClick={() => nav.push("/auth/find/password", "비밀번호 재설정")}
          >
            비밀번호 재설정
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <h1>아이디 찾기</h1>
        <p className="auth-desc">가입 때 인증한 정보를 입력해 주세요</p>
      </header>
      <form className="auth-form" action={formAction}>
        <Field label="이름" name="name" placeholder="홍길동" autoComplete="name" required />
        <Field
          label="생년월일"
          name="birth_date"
          inputMode="numeric"
          maxLength={8}
          placeholder="19900101"
          autoComplete="bday"
          required
        />
        <Field
          label="휴대폰 번호"
          name="phone"
          inputMode="tel"
          maxLength={11}
          placeholder="- 없이 숫자만"
          autoComplete="tel-national"
          required
        />
        {error && <p className="form-error">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "찾는 중…" : "아이디 찾기"}
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

export default FindIdPage;
