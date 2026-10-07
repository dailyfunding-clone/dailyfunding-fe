import { AppLink } from "@/shared/ui";

import type { Metadata } from "next";
import "./support.scss";

export const metadata: Metadata = { title: "고객지원" };

const LINKS = [
  { href: "/cs/notice", label: "공지사항" },
  { href: "/cs/faq", label: "자주 묻는 질문" },
  { href: "/disclosure", label: "공시" },
  { href: "/terms", label: "이용약관" },
];

const SupportPage = () => (
  <main className="container">
    <h1 className="page-title">고객지원</h1>
    <p className="support-phone">고객센터 02-562-9666 (평일 09:30~17:00)</p>
    <nav className="support-links">
      {LINKS.map((l) => (
        <AppLink key={l.href} href={l.href}>
          {l.label}
        </AppLink>
      ))}
    </nav>
  </main>
);

export default SupportPage;
