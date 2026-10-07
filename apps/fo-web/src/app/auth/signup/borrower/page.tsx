"use client";

import { SignupFlow } from "@/features/auth";
import { useDocumentTitle } from "@/shared/lib";


const BorrowerSignUpPage = () => {
  useDocumentTitle("대출자 회원가입");
  return (
  <div className="auth-page">
    <header className="auth-header">
      <h1>대출자 가입</h1>
    </header>
    <SignupFlow memberType="personal" role="borrower" />
  </div>
);
};

export default BorrowerSignUpPage;
