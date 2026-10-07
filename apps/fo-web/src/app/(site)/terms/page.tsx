import {
  TERMS,
} from "@/entities/content";
import { AppLink } from "@/shared/ui";

import type { Metadata } from "next";
import "./terms.scss";

export const metadata: Metadata = { title: "이용약관" };

const TermsPage = () => (
  <main className="container">
    <h1 className="page-title">이용약관</h1>
    <nav className="terms-list">
      {TERMS.map((t) => (
        <AppLink key={t.key} href={`/terms/${t.key}`}>
          {t.title}
        </AppLink>
      ))}
    </nav>
  </main>
);

export default TermsPage;
