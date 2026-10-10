"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { ApiRequestError, api, fmtWon, idempotencyKey } from "@/shared/api";
import { useAppNavigate } from "@/shared/lib";
import { useMe } from "@/shared/session";

import { fmtDate } from "./constants";

import type { EligibleInvestment, Reservation } from "./types";

type ServerReservation = Reservation & {
  investment_id: number;
  product_name: string;
  created_at: string;
};

const RolloverPanel = () => {
  const me = useMe();
  const nav = useAppNavigate();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  const keys = useRef(new Map<number, string>());
  const draftKey = (id: number) => {
    let k = keys.current.get(id);
    if (!k) {
      k = idempotencyKey();
      keys.current.set(id, k);
    }
    return k;
  };
  const resetKey = (id: number) => keys.current.delete(id);

  const eligible = useQuery<{ results: EligibleInvestment[] }>({
    queryKey: ["reservations", "eligible"],
    queryFn: () => api.get("/api/reservations/eligible"),
    enabled: !!me.data,
  });

  const list = useQuery<ServerReservation[]>({
    queryKey: ["reservations", "list"],
    queryFn: () => api.get("/api/reservations").then((rows) => rows as ServerReservation[]),
    enabled: !!me.data,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["reservations"] });

  const setError = (invId: number, e: unknown) => {
    setErrors((prev) => ({
      ...prev,
      [invId]:
        e instanceof ApiRequestError ? e.message || "요청에 실패했어요" : "요청에 실패했어요",
    }));
  };

  const create = useMutation({
    mutationFn: ({ investmentId, amount }: { investmentId: number; amount: number }) =>
      api.post(
        "/api/reservations",
        {
          investment_id: investmentId,
          amount,
        },
        { idempotencyKey: draftKey(investmentId) },
      ),
    onSuccess: (_r, vars) => {
      resetKey(vars.investmentId);
      setErrors((prev) => ({ ...prev, [vars.investmentId]: "" }));
      invalidate();
    },
    onError: (e, vars) => setError(vars.investmentId, e),
  });

  const patch = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number; investmentId: number }) =>
      api.patch(
        "/api/reservations/{id}",
        { amount },
        { path: { id }, idempotencyKey: draftKey(id) },
      ),
    onSuccess: (_r, vars) => {
      resetKey(vars.id);
      invalidate();
    },
    onError: (e, vars) => setError(vars.investmentId, e),
  });

  const cancel = useMutation({
    mutationFn: ({ id }: { id: number; investmentId: number }) =>
      api.delete("/api/reservations/{id}", {
        path: { id },
        idempotencyKey: draftKey(id),
      }),
    onSuccess: (_r, vars) => {
      resetKey(vars.id);
      invalidate();
    },
    onError: (e, vars) => setError(vars.investmentId, e),
  });

  if (me.isLoading || (me.data && (eligible.isLoading || list.isLoading))) {
    return <div className="empty">불러오는 중이에요…</div>;
  }

  if (!me.data) {
    return (
      <div className="gate">
        <p>로그인이 필요해요</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => nav.push("/auth/signin", "로그인")}
        >
          로그인하기
        </button>
      </div>
    );
  }

  const items = eligible.data?.results ?? [];
  const reserved = Object.fromEntries(
    (list.data ?? []).filter((r) => r.status === "reserved").map((r) => [r.investment_id, r]),
  );
  const myReservations = list.data ?? [];

  return (
    <>
      <section>
        <h2 className="inv-section-title">만기 임박 투자</h2>
        {items.length === 0 ? (
          <div className="empty">예약할 수 있는 투자가 없어요</div>
        ) : (
          <div className="stack">
            {items.map((item) => {
              const r = reserved[item.investment_id];
              const draft =
                drafts[item.investment_id] ?? String((r?.amount ?? item.amount) / 10_000);
              const won = Math.round(Number(draft) * 10_000);
              return (
                <div key={item.investment_id} className="card resv-card">
                  <div className="resv-card-head">
                    <h3>{item.product_name}</h3>
                    {item.refinance_open ? (
                      <span className="badge badge-accent">재모집 진행중</span>
                    ) : (
                      <span className="badge">재모집 예정</span>
                    )}
                  </div>
                  <div className="order-line">
                    <span>투자금액</span>
                    <strong>{fmtWon(item.amount)}</strong>
                  </div>
                  <div className="order-line">
                    <span>만기일</span>
                    <strong>{fmtDate(item.maturity_date)}</strong>
                  </div>
                  <div className="resv-actions">
                    <span className="unit-input" style={{ flex: 1 }}>
                      <input
                        className="input"
                        inputMode="numeric"
                        value={draft}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [item.investment_id]: e.target.value.replace(/[^0-9]/g, ""),
                          }))
                        }
                      />
                      <em>만원</em>
                    </span>
                    {r ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={patch.isPending || won <= 0}
                          onClick={() =>
                            patch.mutate({
                              id: r.id,
                              amount: won,
                              investmentId: item.investment_id,
                            })
                          }
                        >
                          금액 변경
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={cancel.isPending}
                          onClick={() =>
                            cancel.mutate({
                              id: r.id,
                              investmentId: item.investment_id,
                            })
                          }
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={create.isPending || won <= 0}
                        onClick={() =>
                          create.mutate({
                            investmentId: item.investment_id,
                            amount: won,
                          })
                        }
                      >
                        예약 신청
                      </button>
                    )}
                  </div>
                  {r && (
                    <p className="field-hint">
                      예약 {fmtWon(r.amount)} · 재모집이 열리면 우선 투자돼요
                    </p>
                  )}
                  {errors[item.investment_id] && (
                    <p className="form-error" role="alert">
                      {errors[item.investment_id]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {myReservations.length > 0 && (
        <section className="inv-section">
          <h2 className="inv-section-title">나의 예약</h2>
          <ul className="list">
            {myReservations.map((r) => (
              <li key={r.id}>
                {r.product_name} · {fmtWon(r.amount)} ·{" "}
                {r.status === "reserved"
                  ? "예약됨"
                  : r.status === "converted"
                    ? "전환됨"
                    : r.status === "cancelled"
                      ? "취소됨"
                      : "환불됨"}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
};

export default RolloverPanel;
