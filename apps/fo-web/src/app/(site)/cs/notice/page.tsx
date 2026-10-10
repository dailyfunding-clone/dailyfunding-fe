import { Suspense } from "react";

import ProductListSkeleton from "@/app/(site)/investment/_components/product-list-skeleton";
import {
  Pagination,
} from "@/entities/content";
import {
  firstParam,
  fmtDate,
  qs,
} from "@/entities/content";
import { fetchJson } from "@/entities/content/index.server";
import { AppLink } from "@/shared/ui";

import type { Metadata } from "next";
export const metadata: Metadata = { title: "공지사항" };


const CATEGORY_TABS = [
  { key: "", label: "전체" },
  { key: "important", label: "중요공지" },
  { key: "notice", label: "공지" },
];

const CATEGORY_LABEL: Record<string, string> = {
  important: "중요공지",
  notice: "공지",
};

type Notice = {
  id: number;
  category: string;
  title: string;
  created_at: string;
};

const NoticeListContent = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;
  const category = firstParam(params.category) ?? "";
  const q = firstParam(params.q) ?? "";
  const page = Number(firstParam(params.page)) || 1;
  const data = await fetchJson<{ results: Notice[]; total: number }>(
    `/notices${qs({ category, q, page: String(page) })}`,
  );
  const notices = data?.results ?? [];
  const total = data?.total ?? 0;
  return (
    <>
      <nav className="tabs">
        {CATEGORY_TABS.map((c) => (
          <AppLink
            key={c.key}
            href={`/cs/notice${qs({ category: c.key || undefined, q: q || undefined })}`}
            className={category === c.key ? "is-active" : undefined}
          >
            {c.label}
          </AppLink>
        ))}
      </nav>
      <form className="search-bar" action="/cs/notice" method="get">
        {category && <input type="hidden" name="category" value={category} />}
        <input
          className="input"
          name="q"
          defaultValue={q}
          placeholder="검색어를 입력해 주세요"
        />
        <button type="submit" className="btn btn-primary">
          검색
        </button>
      </form>
      {notices.length === 0 ? (
        <div className="empty">
          {q ? `"${q}" 검색 결과가 없어요` : "등록된 공지사항이 없어요"}
        </div>
      ) : (
        <ul className="list notice-list">
          {notices.map((n) => (
            <li key={n.id}>
              <AppLink href={`/cs/notice/${n.id}`} className="notice-row">
                <span
                  className={`badge${n.category === "important" ? " badge-accent" : ""}`}
                >
                  {CATEGORY_LABEL[n.category] ?? n.category}
                </span>
                <span className="notice-title">{n.title}</span>
                <time className="notice-date">{fmtDate(n.created_at)}</time>
              </AppLink>
            </li>
          ))}
        </ul>
      )}
      <Pagination
        total={total}
        page={page}
        buildHref={(p) =>
          `/cs/notice${qs({ category: category || undefined, q: q || undefined, page: String(p) })}`
        }
      />
    </>
  );
};

const NoticeListPage = (props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => (
  <Suspense fallback={<ProductListSkeleton />}>
    <NoticeListContent {...props} />
  </Suspense>
);

export default NoticeListPage;
