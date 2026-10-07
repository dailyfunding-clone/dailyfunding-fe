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

  const loadMore = async () => {
    if (!cursor) return;
    setLoading(true);
    try {
      const data = await api.request<NewsResponse>(
        "get",
        `/api/news?cursor=${cursor}`,
      );
      setItems((prev) => [...prev, ...data.results]);
      setCursor(data.next_cursor);
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
      {cursor && (
        <div className="news-more-wrap">
          <button
            type="button"
            className="btn btn-outline news-more"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "불러오는 중..." : "더보기"}
          </button>
        </div>
      )}
    </>
  );
};

export default NewsMore;
