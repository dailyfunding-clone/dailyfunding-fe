"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { api } from "@/shared/api";

const FLUSH_MS = 16;
const POLL_MS = 3_000;

export type ProductProgressData = {
  raised_amount: number;
  remaining?: number;
  status?: string;
};

export const productProgressKey = (id: number) => ["product-progress", id] as const;

type StreamEvent = {
  id?: number;
  product_id?: number;
  raised_amount?: number;
  remaining?: number;
  status?: string;
};

type SnapshotItem = {
  id: number;
  raised_amount?: number;
  remaining_amount?: number;
  status?: string;
};

export const useProductStream = (ids: number[]) => {
  const queryClient = useQueryClient();
  const idsKey = ids.join(",");
  useEffect(() => {
    const idCount = idsKey ? idsKey.split(",").length : 0;
    if (idCount === 0) return;
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let flushTimer: ReturnType<typeof setTimeout> | null = null;
    const buffer = new Map<number, Partial<ProductProgressData>>();

    const flush = () => {
      flushTimer = null;
      for (const [id, patch] of buffer) {
        queryClient.setQueryData<ProductProgressData>(productProgressKey(id), (prev) => ({
          raised_amount: patch.raised_amount ?? prev?.raised_amount ?? 0,
          remaining: patch.remaining ?? prev?.remaining,
          status: patch.status ?? prev?.status,
        }));
      }
      buffer.clear();
    };

    const enqueue = (e: StreamEvent) => {
      const id = e.id ?? e.product_id;
      if (id === undefined) return;
      buffer.set(id, {
        ...(e.raised_amount !== undefined ? { raised_amount: e.raised_amount } : {}),
        ...(e.remaining !== undefined ? { remaining: e.remaining } : {}),
        ...(e.status !== undefined ? { status: e.status } : {}),
      });
      if (!flushTimer) flushTimer = setTimeout(flush, FLUSH_MS);
    };

    const refetch = async () => {
      try {
        const data = await api.request<{ results: SnapshotItem[] }>("get", "/api/products", {
          query: { ids: idsKey, page_size: idCount },
        });
        for (const item of data.results ?? []) {
          queryClient.setQueryData<ProductProgressData>(productProgressKey(item.id), (prev) => ({
            raised_amount: item.raised_amount ?? prev?.raised_amount ?? 0,
            remaining: item.remaining_amount ?? prev?.remaining,
            status: item.status ?? prev?.status,
          }));
        }
      } catch {
        /* snapshot refetch retries on next reconnect/poll tick */
      }
    };

    const stop = () => {
      es?.close();
      es = null;
      if (poll) {
        clearInterval(poll);
        poll = null;
      }
    };

    const start = () => {
      if (typeof EventSource === "undefined") {
        poll = setInterval(() => void refetch(), POLL_MS);
        return;
      }
      const source = new EventSource(`/api/products/stream?ids=${idsKey}`);
      source.addEventListener("progress", (e) => {
        try {
          enqueue(JSON.parse(e.data) as StreamEvent);
        } catch {
          /* malformed event frame */
        }
      });
      source.onerror = () => void refetch();
      es = source;
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        void refetch();
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      if (flushTimer) {
        clearTimeout(flushTimer);
        flush();
      }
    };
  }, [idsKey, queryClient]);
};
