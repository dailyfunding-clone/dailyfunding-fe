"use client";

import { isInWebView } from "@dailyfunding/bridge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AuthGate } from "@/features/auth";
import { ReauthGate } from "@/features/auth";
import { api, fmtMan, fmtWon } from "@/shared/api";
import { useDocumentTitle } from "@/shared/lib";
import { AppLink } from "@/shared/ui";

import { GRADE_LABELS } from "./_components";

import "./mypage.css";


type Dashboard = {
  profile: {
    name: string;
    email: string;
    grade: string;
    identity_verified: boolean;
  };
  virtual_account: {
    bank: string;
    account_no: string;
    holder: string;
  } | null;
  deposit: number;
  points: number;
  limits: {
    total_remaining: number | null;
    mortgage_remaining: number | null;
  };
  active: {
    invested: number;
    principal_remaining: number;
    interest_received_net: number;
    interest_expected_net: number;
  };
  past: {
    count: number;
    interest_received_net: number;
  };
};

const MENU = [
  { href: "/mypage/investments", label: "투자내역" },
  { href: "/mypage/deposit", label: "예치금내역" },
  { href: "/mypage/points", label: "포인트내역" },
  { href: "/mypage/calendar", label: "상환달력" },
  { href: "/mypage/grade", label: "등급정보" },
  { href: "/mypage/deposit?tab=linked", label: "연결계좌" },
  { href: "/mypage/profile", label: "회원정보" },
];

const MyPage = () => {
  useDocumentTitle("마이페이지");
  return (
  <AuthGate>
    {isInWebView() ? (
      <ReauthGate>
        <Dashboard />
      </ReauthGate>
    ) : (
      <Dashboard />
    )}
  </AuthGate>
);
};

const Dashboard = () => {
  const { data } = useQuery<Dashboard>({
    queryKey: ["me-dashboard"],
    queryFn: () => api.request<Dashboard>("get", "/api/me/dashboard"),
  });
  const [copied, setCopied] = useState(false);

  if (!data) {
    return (
      <div className="container">
        <div className="empty">불러오는 중…</div>
      </div>
    );
  }

  const copyAccount = async () => {
    if (!data.virtual_account) return;
    try {
      await navigator.clipboard.writeText(data.virtual_account.account_no);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">마이페이지</h1>

      <div className="mypage-grid">
        <div className="card">
          <div className="profile-head">
            <strong>{data.profile.name || "회원"}님</strong>
            <span className="badge badge-accent">
              {GRADE_LABELS[data.profile.grade] ?? data.profile.grade}
            </span>
          </div>
          <p className="muted">{data.profile.email}</p>
          <p className="muted profile-sub">
            본인인증 {data.profile.identity_verified ? "완료" : "미완료"}
          </p>
          <div className="card-links">
            <AppLink href="/mypage/profile" className="btn btn-outline">
              회원정보
            </AppLink>
            <AppLink href="/mypage/grade" className="btn btn-outline">
              등급 변경 신청
            </AppLink>
          </div>
        </div>

        {data.virtual_account && (
          <div className="card">
            <p className="muted">내 전용 가상계좌</p>
            <p className="acct-no">
              {data.virtual_account.bank} {data.virtual_account.account_no}
            </p>
            <p className="muted acct-holder">예금주 {data.virtual_account.holder}</p>
            <div className="card-links">
              <button
                type="button"
                className="btn btn-outline"
                onClick={copyAccount}
              >
                {copied ? "복사했어요" : "계좌번호 복사"}
              </button>
            </div>
          </div>
        )}

        <div className="card">
          <p className="muted">예치금</p>
          <p className="amount-lg">{fmtWon(data.deposit)}</p>
          <div className="card-links">
            <AppLink href="/mypage/deposit?tab=charge" className="btn btn-primary">
              충전하기
            </AppLink>
            <AppLink href="/mypage/deposit?tab=withdraw" className="btn btn-outline">
              출금하기
            </AppLink>
          </div>
        </div>

        <div className="card">
          <p className="muted">포인트</p>
          <p className="amount-lg">{fmtWon(data.points)}</p>
          <div className="card-links">
            <AppLink href="/mypage/points" className="btn btn-outline">
              포인트 내역
            </AppLink>
          </div>
        </div>
      </div>

      <div className="mypage-section">
        <div className="card">
          <div className="stat-rows">
            <div className="row-between">
              <span>남은 총 투자한도</span>
              <strong>
                {data.limits.total_remaining === null
                  ? "무제한"
                  : fmtMan(data.limits.total_remaining)}
              </strong>
            </div>
            <div className="row-between">
              <span>남은 부동산 투자한도</span>
              <strong>
                {data.limits.mortgage_remaining === null
                  ? "무제한"
                  : fmtMan(data.limits.mortgage_remaining)}
              </strong>
            </div>
            <div className="row-between">
              <span>투자 중인 금액</span>
              <strong>{fmtWon(data.active.invested)}</strong>
            </div>
            <div className="row-between">
              <span>투자 잔액</span>
              <strong>{fmtWon(data.active.principal_remaining)}</strong>
            </div>
            <div className="row-between">
              <span>누적 수익 (세후)</span>
              <strong>{fmtWon(data.active.interest_received_net)}</strong>
            </div>
            <div className="row-between">
              <span>잔여 예상 수익 (세후)</span>
              <strong>{fmtWon(data.active.interest_expected_net)}</strong>
            </div>
            <div className="row-between">
              <span>지난 투자</span>
              <strong>
                {data.past.count}건 · 수익 {fmtWon(data.past.interest_received_net)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="mypage-section">
        <div className="card card-tight mypage-menu">
          <ul className="list">
            {MENU.map((m) => (
              <li key={m.href}>
                <AppLink href={m.href}>{m.label}</AppLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
