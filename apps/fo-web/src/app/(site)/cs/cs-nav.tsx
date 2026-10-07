"use client";

import { usePathname } from "next/navigation";

import { AppLink } from "@/shared/ui";

const TABS = [
  { href: "/cs/notice", label: "공지사항" },
  { href: "/cs/faq", label: "자주 묻는 질문" },
];

const CsNav = () => {
  const pathname = usePathname();
  return (
    <nav className="tabs cs-nav">
      {TABS.map((t) => (
        <AppLink
          key={t.href}
          href={t.href}
          className={pathname.startsWith(t.href) ? "is-active" : undefined}
        >
          {t.label}
        </AppLink>
      ))}
    </nav>
  );
};

export default CsNav;
