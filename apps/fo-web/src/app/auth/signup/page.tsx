"use client";

import { useAppNavigate } from "@/shared/lib";
import { useDocumentTitle } from "@/shared/lib";


const SignUpPage = () => {
  useDocumentTitle("회원가입");
  const nav = useAppNavigate();
  return (
    <div className="auth-page">
      <header className="auth-header">
        <h1>가입하기</h1>
      </header>
      <h2 className="auth-question">어떤 회원으로 가입할까요?</h2>
      <div className="member-types">
        <button
          type="button"
          className="member-type"
          onClick={() => nav.push("/auth/signup/personal", "가입하기")}
        >
          <span className="member-type-name">개인</span>
          <span className="member-type-desc">이메일로 바로 가입해요</span>
        </button>
        <button
          type="button"
          className="member-type"
          onClick={() => nav.push("/auth/signup/corporate", "가입하기")}
        >
          <span className="member-type-name">법인</span>
          <span className="member-type-desc">사업자등록증이 필요해요</span>
        </button>
      </div>
      <div className="auth-links">
        <button
          type="button"
          onClick={() => nav.replace("/auth/signin", "로그인")}
        >
          이미 계정이 있어요
        </button>
      </div>
    </div>
  );
};

export default SignUpPage;
