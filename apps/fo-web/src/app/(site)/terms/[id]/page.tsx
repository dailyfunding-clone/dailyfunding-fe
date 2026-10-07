import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  fmtDate,
  TERMS,
} from "@/entities/content";
import { fetchJson } from "@/entities/content/index.server";
import { AppLink } from "@/shared/ui";

import type { Metadata } from "next";
import "../terms.scss";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> => {
  const { id } = await params;
  const term = await fetchJson<{ title?: string }>(`/terms/${id}`);
  if (!term) notFound();
  return { title: term.title ?? "약관" };
};


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
            key={t.key}
            href={`/terms/${t.key}`}
            className={t.key === term.key ? "is-active" : undefined}
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
