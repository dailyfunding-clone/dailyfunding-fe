"use client";

import { Button, Field } from "@dailyfunding/design-system/components";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { api, ApiRequestError } from "@/shared/api";
import { signInSchema, parseForm, type FormState } from "@/shared/lib";

const SigninPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const parsed = parseForm(signInSchema, formData);
      if ("error" in parsed) return { error: parsed.error };
      try {
        await api.post("/api/auth/login", {
          ...parsed.data,
          keep_login: false,
        });
        queryClient.clear();
        router.push("/admin/products");
        return null;
      } catch (e) {
        if (e instanceof ApiRequestError && (e.status === 400 || e.status === 401)) {
          return { error: "이메일 또는 비밀번호가 맞지 않아요" };
        }
        return { error: "잠시 후 다시 시도해 주세요" };
      }
    },
    null,
  );

  return (
    <div className="auth-page">
      <header className="auth-header">
        <h1>관리자 로그인</h1>
      </header>
      <form className="auth-form" action={formAction}>
        <Field
          label="이메일"
          type="email"
          name="email"
          placeholder="email@example.com"
          autoComplete="email"
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
        {state?.error && <p className="form-error">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "로그인 중…" : "로그인"}
        </Button>
      </form>
    </div>
  );
};

export default SigninPage;
