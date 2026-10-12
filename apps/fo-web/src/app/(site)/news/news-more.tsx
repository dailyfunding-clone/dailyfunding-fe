"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "@/shared/api";

import NewsCard from "./news-card";

import type { NewsItem } from "./news-card";

type NewsResponse = {
  results: NewsItem[];
  next_cursor: string | null;
};

const fetchPage = (cursor: string) =>
  api.request<NewsResponse>("get", `/api/news?cursor=${encodeURIComponent(cursor)}`);

const NewsMore = ({ initialCursor }: { initialCursor: string | null }) => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const prefetched = useRef<{ cursor: string; data: NewsResponse } | null>(null);

  useEffect(() => {
    if (!cursor || prefetched.current?.cursor === cursor) return;
    const hasIdle = typeof requestIdleCallback === "function";
    const id = hasIdle
      ? requestIdleCallback(() => {
          void fetchPage(cursor)
            .then((data) => {
              prefetched.current = { cursor, data };
            })
            .catch(() => {
              prefetched.current = null;
            });
        })
      : window.setTimeout(() => {
          void fetchPage(cursor)
            .then((data) => {
              prefetched.current = { cursor, data };
            })
            .catch(() => {
              prefetched.current = null;
            });
        }, 500);
    return () => {
      if (hasIdle) cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [cursor]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoading(true);
    try {
      const data =
        prefetched.current?.cursor === cursor ? prefetched.current.data : await fetchPage(cursor);
      prefetched.current = null;
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
