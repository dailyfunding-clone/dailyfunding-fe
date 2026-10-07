"use client";

import { SignupFlow } from "@/features/auth";
import { useDocumentTitle } from "@/shared/lib";


const PersonalSignUpPage = () => {
  useDocumentTitle("개인 회원가입");
  return (
  <div className="auth-page">
    <header className="auth-header">
      <h1>가입하기</h1>
    </header>
    <SignupFlow memberType="personal" />
  </div>
);
};

export default PersonalSignUpPage;
