import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  fetchJson,
  fmtDate,
} from "@/entities/content";
import { AppLink } from "@/shared/ui";

import type { Metadata } from "next";
import "../terms.css";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> => {
  const { id } = await params;
  const term = await fetchJson<{ title?: string }>(`/terms/${id}`);
  return { title: term?.title ?? "약관" };
};


const TERMS = [
  { id: "investment", label: "투자약관" },
  { id: "loan", label: "대출약관" },
  { id: "electronic_finance", label: "전자금융" },
  { id: "service", label: "서비스 이용" },
  { id: "privacy", label: "개인정보" },
  { id: "credit_info", label: "신용정보" },
];

type Term = {
  key: string;
  title: string;
  body: string;
  updated_at: string;
};

const TermContent = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const term = await fetchJson<Term>(`/terms/${id}`);
  if (!term) notFound();
  return (
    <main className="container">
      <nav className="tabs terms-tabs">
        {TERMS.map((t) => (
          <AppLink
            key={t.id}
            href={`/terms/${t.id}`}
            className={t.id === term.key ? "is-active" : undefined}
          >
            {t.label}
          </AppLink>
        ))}
      </nav>
      <article className="terms-doc">
        <h1>{term.title}</h1>
        <p className="terms-date">최종 수정일 {fmtDate(term.updated_at)}</p>
        <div className="terms-body">{term.body}</div>
      </article>
    </main>
  );
};

const TermPage = (props: { params: Promise<{ id: string }> }) => (
  <Suspense fallback={null}>
    <TermContent {...props} />
  </Suspense>
);

export default TermPage;
