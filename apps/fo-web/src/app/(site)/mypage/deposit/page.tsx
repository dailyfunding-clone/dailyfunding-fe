"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthGate, ReauthProvider } from "@/features/auth";
import { useDocumentTitle } from "@/shared/lib";

import { DepositHistory } from "../_components";
import { DepositCharge } from "../_components";
import { DepositWithdraw } from "../_components";
import { DepositLinked } from "../_components";

import "../mypage.scss";


const TABS = [
  { key: "history", label: "예치금내역" },
  { key: "charge", label: "충전하기" },
  { key: "withdraw", label: "출금하기" },
  { key: "linked", label: "연결계좌" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const tabFrom = (sp: URLSearchParams | ReturnType<typeof useSearchParams>): TabKey => {
  const t = sp.get("tab");
  return TABS.some((tab) => tab.key === t) ? (t as TabKey) : "history";
};

const DepositPage = () => {
  useDocumentTitle("예치금");
  return (
  <AuthGate title="예치금">
    <Suspense fallback={null}>
      <Deposit />
    </Suspense>
  </AuthGate>
);
};

const Deposit = () => {
  const sp = useSearchParams();
  const [tab, setTab] = useState<TabKey>(() => tabFrom(sp));

  const [prevSp, setPrevSp] = useState(sp);
  if (prevSp !== sp) {
    setPrevSp(sp);
    setTab(tabFrom(sp));
  }

  return (
    <div className="container">
      <h1 className="page-title">예치금</h1>
      <div className="tabs mb-16">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "is-active" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "history" && <DepositHistory />}
      {tab === "charge" && <DepositCharge />}
      {tab === "withdraw" && (
        <ReauthProvider
          title="출금 비밀번호 확인"
          description="출금하려면 비밀번호를 한 번 더 입력해 주세요."
        >
          <DepositWithdraw />
        </ReauthProvider>
      )}
      {tab === "linked" && (
        <ReauthProvider
          title="계좌 관리 비밀번호 확인"
          description="연결계좌를 관리하려면 비밀번호를 한 번 더 입력해 주세요."
        >
          <DepositLinked />
        </ReauthProvider>
      )}
    </div>
  );
};

export default DepositPage;
