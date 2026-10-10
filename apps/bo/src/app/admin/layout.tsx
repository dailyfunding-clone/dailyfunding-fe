"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { ApiRequestError } from "@/shared/api";
import { useMe, useSignOut } from "@/shared/session";
import "./admin.scss";

const NAV = [
  { href: "/admin/products", label: "상품" },
  { href: "/admin/batch", label: "배치" },
  { href: "/admin/grade-requests", label: "등급심사" },
  { href: "/admin/deposit-holds", label: "입금보류" },
  { href: "/admin/loan-applications", label: "대출심사" },
  { href: "/admin/contents", label: "콘텐츠" },
  { href: "/admin/seed", label: "시드" },
];

const SignOutLink = () => {
  const signOut = useSignOut();
  return (
    <button type="button" onClick={() => void signOut()}>
      로그아웃
    </button>
  );
};

const AdminNav = () => {
  const pathname = usePathname();
  return (
    <nav className="admin-nav">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className={pathname.startsWith(n.href) ? "is-active" : ""}>
          {n.label}
        </Link>
      ))}
      <SignOutLink />
    </nav>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: me, isLoading, error, refetch, isFetching } = useMe();

  if (isLoading) {
    return <div className="admin-loading">불러오는 중이에요</div>;
  }
  if (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      return (
        <div className="admin-deny">
          <h1>로그인이 필요해요</h1>
          <p>관리자 계정으로 로그인해 주세요</p>
          <Link href="/auth/signin" className="btn btn-outline">
            로그인하기
          </Link>
        </div>
      );
    }
    if (error instanceof ApiRequestError && error.status === 403) {
      return (
        <div className="admin-deny">
          <h1>관리자 권한이 필요해요</h1>
          <p>이 계정에는 관리자 권한이 없어요</p>
          <SignOutLink />
        </div>
      );
    }
    return (
      <div className="admin-deny">
        <h1>불러오지 못했어요</h1>
        <p>네트워크 상태를 확인하고 다시 시도해 주세요</p>
        <button
          type="button"
          className="btn btn-outline"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          다시 시도
        </button>
      </div>
    );
  }
  if (!me || !me.is_staff) {
    return (
      <div className="admin-deny">
        <h1>관리자 권한이 필요해요</h1>
        <p>이 계정에는 관리자 권한이 없어요</p>
        <SignOutLink />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link href="/admin/products" className="admin-logo">
          데일리펀딩 관리자
        </Link>
        <Suspense fallback={null}>
          <AdminNav />
        </Suspense>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
};

export default AdminLayout;
