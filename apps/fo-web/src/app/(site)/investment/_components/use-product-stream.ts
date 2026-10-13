"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { api } from "@/shared/api";

const POLL_MS = 3_000;
const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;

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

const parseEvents = (text: string, carry: { tail: string; lastId: number | null }) => {
  const frames = (carry.tail + text).split("\n\n");
  carry.tail = frames.pop() ?? "";
  const out: StreamEvent[] = [];
  for (const frame of frames) {
    let data = "";
    for (const line of frame.split("\n")) {
      if (line.startsWith("id:")) {
        const n = Number(line.slice(3).trim());
        if (Number.isFinite(n)) carry.lastId = n;
      } else if (line.startsWith("data:")) {
        data += (data ? "\n" : "") + line.slice(5).trimStart();
      }
    }
    if (!data) continue;
    try {
      out.push(JSON.parse(data) as StreamEvent);
    } catch {
      /* malformed event frame */
    }
  }
  return out;
};

export const useProductStream = (ids: number[]) => {
  const queryClient = useQueryClient();
  const idsKey = ids.join(",");
  useEffect(() => {
    const idCount = idsKey ? idsKey.split(",").length : 0;
    if (idCount === 0) return;
    let abort: AbortController | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let flushFrame: number | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retries = 0;
    let cursor: number | null = null;
    let stopped = false;
    const buffer = new Map<number, Partial<ProductProgressData>>();

    const flush = () => {
      flushFrame = null;
      for (const [id, patch] of buffer) {
        queryClient.setQueryData<ProductProgressData>(productProgressKey(id), (prev) => ({
          ...prev,
          ...patch,
          raised_amount: patch.raised_amount ?? prev?.raised_amount ?? 0,
        }));
      }
      buffer.clear();
    };

    const enqueue = (e: StreamEvent) => {
      const id = e.id ?? e.product_id;
      if (id === undefined) return;
      buffer.set(id, {
        ...buffer.get(id),
        ...(e.raised_amount !== undefined ? { raised_amount: e.raised_amount } : {}),
        ...(e.remaining !== undefined ? { remaining: e.remaining } : {}),
        ...(e.status !== undefined ? { status: e.status } : {}),
      });
      if (flushFrame === null) flushFrame = requestAnimationFrame(flush);
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

    const pump = async () => {
      abort = new AbortController();
      const headers: Record<string, string> = { accept: "text/event-stream" };
      if (cursor !== null) headers["Last-Event-ID"] = String(cursor);
      let res: Response;
      try {
        res = await fetch(`/api/products/stream?ids=${idsKey}`, {
          headers,
          cache: "no-store",
          signal: abort.signal,
        });
      } catch {
        scheduleReconnect();
        return;
      }
      if (!res.ok || !res.body) {
        scheduleReconnect();
        return;
      }
      retries = 0;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const carry = { tail: "", lastId: null as number | null };
      try {
        while (!stopped) {
          const { value, done } = await reader.read();
          if (done) break;
          for (const ev of parseEvents(decoder.decode(value, { stream: true }), carry)) {
            enqueue(ev);
          }
          if (carry.lastId !== null) cursor = carry.lastId;
        }
      } catch {
        /* network reset — reconnect below */
      } finally {
        reader.releaseLock();
      }
      scheduleReconnect();
    };

    const scheduleReconnect = () => {
      if (stopped || retryTimer) return;
      const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** retries);
      retries += 1;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void refetch();
        void pump();
      }, delay);
    };

    const stop = () => {
      abort?.abort();
      abort = null;
      if (poll) {
        clearInterval(poll);
        poll = null;
      }
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      retries = 0;
    };

    const start = () => {
      if (typeof ReadableStream === "undefined" || typeof TextDecoder === "undefined") {
        poll = setInterval(() => void refetch(), POLL_MS);
        return;
      }
      void pump();
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
      stopped = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      if (flushFrame !== null) {
        cancelAnimationFrame(flushFrame);
        flush();
      }
    };
  }, [idsKey, queryClient]);
};
