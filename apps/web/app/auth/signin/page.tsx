"use client";

import { useAppNavigate } from "../../../lib/use-app-navigate";

export default function SignInPage() {
  const navigate = useAppNavigate();
  return (
    <div className="auth-page">
      <header className="auth-header">
        <h1>로그인</h1>
      </header>
      <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
        <label className="field">
          <span className="field-label">이메일</span>
          <input
            className="input"
            type="email"
            name="email"
            placeholder="이메일 주소"
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span className="field-label">비밀번호</span>
          <input
            className="input"
            type="password"
            name="password"
            placeholder="비밀번호"
            autoComplete="current-password"
          />
        </label>
        <button className="btn btn-primary" type="submit">
          로그인
        </button>
      </form>
      <div className="auth-links">
        <button type="button" onClick={() => navigate("/auth/signup", "회원가입")}>
          회원가입
        </button>
      </div>
    </div>
  );
}
