import { Suspense } from "react";

import { Pagination } from "@/entities/content";
import { firstParam, qs } from "@/entities/content";
import { fetchJson } from "@/entities/content/index.server";
import { AppLink, FilterRow } from "@/shared/ui";

import "@/entities/content/content.scss";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "자주 묻는 질문" };

const FAQ_CATEGORIES = [
  "투자",
  "대출",
  "예치금",
  "회원",
  "포인트",
  "세금",
  "상환",
  "계좌",
  "앱",
  "기타",
];

type Faq = {
  id: number;
  category: string;
  question: string;
  answer: string;
};

const FaqContent = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;
  const category = firstParam(params.category) ?? "";
  const q = firstParam(params.q) ?? "";
  const page = Number(firstParam(params.page)) || 1;
  const [data, keywords] = await Promise.all([
    fetchJson<{ results: Faq[]; total: number }>(`/faqs${qs({ category, q, page: String(page) })}`),
    fetchJson<{ keywords: string[] }>("/faqs/keywords"),
  ]);
  const faqs = data?.results ?? [];
  const total = data?.total ?? 0;
  const popular = keywords?.keywords ?? [];
  return (
    <>
      <nav className="tabs">
        <AppLink
          href={`/cs/faq${qs({ q: q || undefined })}`}
          className={!category ? "is-active" : undefined}
        >
          전체
        </AppLink>
        {FAQ_CATEGORIES.map((c) => (
          <AppLink
            key={c}
            href={`/cs/faq${qs({ category: c, q: q || undefined })}`}
            className={category === c ? "is-active" : undefined}
          >
            {c}
          </AppLink>
        ))}
      </nav>
      <form className="search-bar" action="/cs/faq" method="get">
        {category && <input type="hidden" name="category" value={category} />}
        <input
          className="input"
          name="q"
          defaultValue={q}
          placeholder="궁금한 내용을 검색해 보세요"
        />
        <button type="submit" className="btn btn-primary">
          검색
        </button>
      </form>
      {popular.length > 0 && (
        <FilterRow label="인기">
          <div className="chips faq-keywords">
            {popular.map((k) => (
              <AppLink key={k} href={`/cs/faq?q=${encodeURIComponent(k)}`} className="chip">
                {k}
              </AppLink>
            ))}
          </div>
        </FilterRow>
      )}
      {faqs.length === 0 ? (
        <div className="empty">{q ? `"${q}" 검색 결과가 없어요` : "등록된 질문이 없어요"}</div>
      ) : (
        <div className="accordion">
          {faqs.map((f) => (
            <details className="accordion-item" key={f.id}>
              <summary>
                <span className="badge">{f.category}</span>
                {f.question}
              </summary>
              <div className="accordion-body">{f.answer}</div>
            </details>
          ))}
        </div>
      )}
      <Pagination
        total={total}
        page={page}
        buildHref={(p) =>
          `/cs/faq${qs({ category: category || undefined, q: q || undefined, page: String(p) })}`
        }
      />
    </>
  );
};

const FaqPage = (props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => (
  <Suspense fallback={null}>
    <FaqContent {...props} />
  </Suspense>
);

export default FaqPage;
