"use client";

import { AuthGate } from "@/features/auth";
import { useDocumentTitle } from "@/shared/lib";
import { useMe } from "@/shared/session";

import { GRADE_LABELS } from "../_components";

import "../mypage.scss";

const ProfilePage = () => {
  useDocumentTitle("회원정보");
  return (
    <AuthGate title="회원정보">
      <Profile />
    </AuthGate>
  );
};

const Profile = () => {
  const me = useMe();
  const user = me.data;

  if (!user) {
    return (
      <div className="container">
        <div className="empty">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">회원정보</h1>
      <div className="card">
        <div className="stat-rows">
          <div className="row-between">
            <span>이메일</span>
            <strong>{user.email}</strong>
          </div>
          <div className="row-between">
            <span>이름</span>
            <strong>{user.name || "—"}</strong>
          </div>
          <div className="row-between">
            <span>회원 유형</span>
            <strong>{user.role === "borrower" ? "대출자" : "투자자"}</strong>
          </div>
          <div className="row-between">
            <span>투자자 등급</span>
            <strong>{GRADE_LABELS[user.grade] ?? user.grade}</strong>
          </div>
          <div className="row-between">
            <span>본인인증</span>
            <strong>{user.identity_verified ? "완료" : "미완료"}</strong>
          </div>
          <div className="row-between">
            <span>간편비밀번호</span>
            <strong>{user.pin_registered ? "등록됨" : "미등록"}</strong>
          </div>
        </div>
      </div>
      <p className="muted mt-12">회원정보 변경은 고객센터로 문의해 주세요.</p>
    </div>
  );
};

export default ProfilePage;
