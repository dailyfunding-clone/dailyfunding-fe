"use client";

import { useAppNavigate } from "@/shared/lib";
import { useMe } from "@/shared/session";

import type { ReactNode } from "react";

const AuthGate = ({ children, title }: { children: ReactNode; title?: string }) => {
  const me = useMe();
  const nav = useAppNavigate();

  if (me.isPending) {
    return (
      <div className="container">
        <div className="empty">불러오는 중…</div>
      </div>
    );
  }
  if (!me.data) {
    return (
      <div className="container">
        {title && <h1 className="page-title">{title}</h1>}
        <div className="empty">
          <p>로그인이 필요한 서비스예요</p>
          <button
            type="button"
            className="btn btn-primary auth-gate-btn"
            onClick={() => nav.push("/auth/signin", "로그인")}
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export default AuthGate;
