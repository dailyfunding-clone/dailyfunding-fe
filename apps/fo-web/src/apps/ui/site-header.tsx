"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/shared/api";
import { useAppNavigate, useMounted } from "@/shared/lib";
import { useMe, useSignOut } from "@/shared/session";
import { AppLink } from "@/shared/ui";

const NAV = [
  { href: "/investment", label: "투자하기" },
  { href: "/loan", label: "대출받기" },
  { href: "/cs/notice", label: "고객지원" },
  { href: "/event", label: "이벤트" },
  { href: "/news", label: "언론보도" },
  { href: "/disclosure", label: "공시" },
];

const SiteHeader = () => {
  const me = useMe();
  const mounted = useMounted();
  const nav = useAppNavigate();
  const signOut = useSignOut();
  const cart = useQuery<{ results: unknown[]; count?: number }>({
    queryKey: ["cart"],
    queryFn: () => api.request<{ results: unknown[]; count?: number }>("get", "/api/cart"),
    enabled: !!me.data,
    retry: false,
  });
  const cartCount = cart.data?.count ?? cart.data?.results?.length ?? 0;
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <AppLink href="/" className="site-logo">
          데일리펀딩
        </AppLink>
        <nav className="site-nav">
          {NAV.map((n) => (
            <AppLink key={n.href} href={n.href}>
              {n.label}
            </AppLink>
          ))}
        </nav>
        <div className="site-actions">
          {mounted && me.data ? (
            <>
              <button
                type="button"
                className="site-cart"
                onClick={() => nav.push("/cart", "장바구니")}
                aria-label="장바구니"
              >
                장바구니
                {cartCount > 0 && <em>{cartCount}</em>}
              </button>
              <AppLink href="/mypage" className="site-user">
                {me.data.name || me.data.email}
              </AppLink>
              <button type="button" onClick={signOut} className="site-auth">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="site-auth"
                onClick={() => nav.push("/auth/signin", "로그인")}
              >
                로그인
              </button>
              <button
                type="button"
                className="btn btn-primary site-signup"
                onClick={() => nav.push("/auth/signup", "회원가입")}
              >
                가입하기
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
