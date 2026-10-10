"use client";

import { useState } from "react";

import { api } from "@/shared/api";

import NewsCard from "./news-card";

import type { NewsItem } from "./news-card";

type NewsResponse = {
  results: NewsItem[];
  next_cursor: string | null;
};

const NewsMore = ({ initialCursor }: { initialCursor: string | null }) => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadMore = async () => {
    if (!cursor) return;
    setLoading(true);
    try {
      const data = await api.request<NewsResponse>(
        "get",
        `/api/news?cursor=${encodeURIComponent(cursor)}`,
      );
      setItems((prev) => [...prev, ...data.results]);
      setCursor(data.next_cursor);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {items.length > 0 && (
        <div className="card-grid news-cards">
          {items.map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>
      )}
      {failed && (
        <p className="form-error" role="alert">
          기사를 더 불러오지 못했어요
        </p>
      )}
      {cursor && (
        <div className="news-more-wrap">
          <button
            type="button"
            className="btn btn-outline news-more"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "불러오는 중..." : failed ? "다시 시도" : "더보기"}
          </button>
        </div>
      )}
    </>
  );
};

export default NewsMore;
