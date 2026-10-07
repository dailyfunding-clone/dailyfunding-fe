"use client";

import { SignupFlow } from "@/features/auth";
import { useDocumentTitle } from "@/shared/lib";


const CorporateSignUpPage = () => {
  useDocumentTitle("법인 회원가입");
  return (
  <div className="auth-page">
    <header className="auth-header">
      <h1>가입하기</h1>
    </header>
    <SignupFlow memberType="corporate" />
  </div>
);
};

export default CorporateSignUpPage;
