"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { ApiRequestError, api } from "@/shared/api";

import { mapError } from "./lib/map-error";
import { claimAttempt, clearAttempt, getAttempt, putAttempt } from "./lib/order-attempt-store";
import { revalidateProducts } from "./revalidate-products";

import type { OrderError } from "./lib/map-error";
import type { OrderAttempt } from "./lib/order-attempt-store";
import type { InvestmentResponse } from "./types";

const CHANNEL = "df-invest-order";
const STALE_MS = 60_000;
const FOLLOW_POLL_MS = 250;

export type OrderInput = { amount: number; use_points: number };

export type OrderState =
  | { status: "idle" }
  | { status: "reauth" }
  | { status: "submitting" }
  | { status: "confirming" }
  | { status: "done"; result: InvestmentResponse }
  | { status: "failed"; error: OrderError; recoverable: boolean };

type Reauth = {
  ensure: (refresh?: boolean) => Promise<string | null>;
  reset: () => void;
};

type Options = {
  accountId: number;
  productId: number;
  reauth: Reauth | null;
};

type ChannelMessage = {
  type?: string;
  key?: string;
  investmentId?: number;
  recoverable?: boolean;
};

const isActivePhase = (a: OrderAttempt) => a.phase === "open" || a.phase === "confirming";

const failed = (error: OrderError, recoverable: boolean): OrderState => ({
  status: "failed",
  error,
  recoverable,
});

export const useInvestOrder = ({ accountId, productId, reauth }: Options) => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<OrderState>({ status: "idle" });
  const busy = useRef(false);
  const [tabId] = useState(() => crypto.randomUUID());
  const storeKey = `${accountId}:${productId}`;
  const channel = useRef<BroadcastChannel | null>(null);
  const followCleanup = useRef<(() => void) | null>(null);

  const broadcast = (msg: ChannelMessage) => {
    try {
      channel.current?.postMessage(msg);
    } catch {
      /* closed channel */
    }
  };

  const confirmOrder = useCallback(async (investmentId: number) => {
    try {
      const result = await api.request<InvestmentResponse>(
        "get",
        `/api/investments/${investmentId}`,
      );
      setState({ status: "done", result });
    } catch (e) {
      const mapped = mapError(e);
      setState(failed(mapped, mapped.kind === "network"));
    }
  }, []);

  const follow = useCallback(
    (attempt: OrderAttempt) => {
      setState({ status: "confirming" });
      if (attempt.investmentId !== undefined) {
        void confirmOrder(attempt.investmentId);
        return;
      }
      let settled = false;
      const ch = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL);
      const cleanup = () => {
        clearInterval(iv);
        ch?.close();
        followCleanup.current = null;
      };
      const finishWith = (investmentId: number) => {
        if (settled) return;
        settled = true;
        cleanup();
        void confirmOrder(investmentId);
      };
      const failWith = (recoverable: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        setState(
          failed(
            {
              kind: recoverable ? "network" : "unknown",
              text: "다른 탭에서 진행 중인 주문이 완료되지 않았어요",
            },
            recoverable,
          ),
        );
      };
      ch?.addEventListener("message", (e: MessageEvent) => {
        const m = e.data as ChannelMessage;
        if (m?.key !== storeKey) return;
        if (m.type === "submitted" && m.investmentId !== undefined) {
          finishWith(m.investmentId);
        } else if (m.type === "failed") {
          failWith(m.recoverable ?? false);
        } else if (m.type === "done" && m.investmentId !== undefined) {
          finishWith(m.investmentId);
        }
      });
      const iv = setInterval(() => {
        void getAttempt(storeKey).then((rec) => {
          if (settled) return;
          if (!rec || rec.phase === "failed") {
            failWith(false);
            return;
          }
          if (rec.investmentId !== undefined) {
            finishWith(rec.investmentId);
          }
        });
      }, FOLLOW_POLL_MS);
      followCleanup.current = cleanup;
    },
    [confirmOrder, storeKey],
  );

  useEffect(() => {
    let alive = true;
    if (typeof BroadcastChannel !== "undefined") {
      channel.current = new BroadcastChannel(CHANNEL);
    }
    void getAttempt(storeKey).then((rec) => {
      if (!alive || !rec) return;
      const stale = Date.now() - rec.updatedAt > STALE_MS;
      if (rec.phase === "ambiguous" || (isActivePhase(rec) && stale)) {
        setState(
          failed(
            {
              kind: "network",
              text: "이전 주문 결과를 확인하지 못했어요. 같은 주문으로 다시 확인해 주세요",
            },
            true,
          ),
        );
      } else if (isActivePhase(rec) && rec.tabId !== tabId) {
        follow(rec);
      }
    });
    return () => {
      alive = false;
      followCleanup.current?.();
      channel.current?.close();
      channel.current = null;
    };
  }, [storeKey, tabId, follow]);

  const submit = async (input: OrderInput) => {
    if (busy.current) return;
    busy.current = true;
    try {
      const claim = await claimAttempt(storeKey, {
        tabId,
        idempotencyKey: crypto.randomUUID(),
        input: {
          product_id: productId,
          amount: input.amount,
          use_points: input.use_points,
          confirm: "네",
        },
        phase: "open",
      });
      if (claim.role === "follower") {
        follow(claim.attempt);
        return;
      }
      let attempt = claim.attempt;
      if (attempt.investmentId === undefined) {
        setState({ status: "reauth" });
        const token = reauth ? await reauth.ensure() : null;
        if (!token) {
          await clearAttempt(storeKey);
          setState(failed({ kind: "rejected", text: "본인 인증이 취소됐어요" }, false));
          return;
        }
        let result: InvestmentResponse | null = null;
        for (let i = 0; i < 2 && !result; i++) {
          setState({ status: "submitting" });
          try {
            result = await api.request<InvestmentResponse>(
              "post",
              "/api/investments",
              attempt.input,
              {
                idempotencyKey: attempt.idempotencyKey,
                reauthToken: token,
              },
            );
          } catch (e) {
            const mapped = mapError(e);
            if (e instanceof ApiRequestError && e.status === 428) {
              reauth?.reset();
              await clearAttempt(storeKey);
              setState(failed(mapped, false));
              return;
            }
            if (mapped.kind === "network") {
              if (i === 0) continue;
              await putAttempt({ ...attempt, phase: "ambiguous" });
              setState(failed(mapped, true));
              return;
            }
            await clearAttempt(storeKey);
            setState(failed(mapped, false));
            return;
          }
        }
        if (!result) return;
        attempt = {
          ...attempt,
          investmentId: result.investment_id,
          phase: "confirming",
        };
        await putAttempt(attempt);
        broadcast({
          type: "submitted",
          key: storeKey,
          investmentId: attempt.investmentId,
        });
        void revalidateProducts().catch(() => undefined);
        for (const key of [
          ["me-investments"],
          ["investments"],
          ["deposit"],
          ["points"],
          ["product", productId],
        ]) {
          void queryClient.invalidateQueries({ queryKey: key });
        }
      }
      setState({ status: "confirming" });
      try {
        const confirmed = await api.request<InvestmentResponse>(
          "get",
          `/api/investments/${attempt.investmentId}`,
        );
        await putAttempt({ ...attempt, phase: "done" });
        broadcast({
          type: "done",
          key: storeKey,
          investmentId: attempt.investmentId,
        });
        setState({ status: "done", result: confirmed });
      } catch (e) {
        const mapped = mapError(e);
        if (mapped.kind === "network") {
          await putAttempt({ ...attempt, phase: "ambiguous" });
          setState(failed(mapped, true));
        } else {
          await putAttempt({ ...attempt, phase: "failed" });
          broadcast({ type: "failed", key: storeKey, recoverable: false });
          setState(failed(mapped, false));
        }
      }
    } finally {
      busy.current = false;
    }
  };

  const pending =
    state.status === "reauth" || state.status === "submitting" || state.status === "confirming";

  return { state, submit, pending };
};
