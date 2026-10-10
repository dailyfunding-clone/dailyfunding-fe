import { fetchJson } from "@/entities/content/index.server";

import NewsCard from "./news-card";
import NewsMore from "./news-more";

import type { NewsItem } from "./news-card";
import "./news.scss";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "언론보도" };

const NewsPage = async () => {
  const data = await fetchJson<{
    results: NewsItem[];
    next_cursor: string | null;
  }>("/news");
  const items = data?.results ?? [];
  return (
    <main className="container">
      <h1 className="page-title">언론보도</h1>
      {items.length === 0 ? (
        <div className="empty">등록된 기사가 없어요</div>
      ) : (
        <div className="card-grid news-cards">
          {items.map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>
      )}
      <NewsMore initialCursor={data?.next_cursor ?? null} />
    </main>
  );
};

export default NewsPage;
