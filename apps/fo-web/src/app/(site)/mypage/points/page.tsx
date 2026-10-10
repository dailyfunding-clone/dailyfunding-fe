"use client";

import { Button, Field } from "@dailyfunding/design-system/components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActionState, useState } from "react";

import { AuthGate } from "@/features/auth";
import { ApiRequestError, api, apiFetch, fmtPoint, idempotencyKey } from "@/shared/api";
import { parseForm, pointConvertSchema, type FormState } from "@/shared/lib";
import { useDocumentTitle } from "@/shared/lib";

import { apiErrorMessage, POINT_KIND_LABELS } from "../_components";
import { daysAgo, fmtDate, monthsAgo, today } from "../_components";

import "../mypage.scss";

type PointBalance = {
  balance: number;
  expiring_this_month: number;
};

type PointEntry = {
  id: number;
  kind: string;
  amount: number;
  memo: string;
  created_at: string;
};

type PointHistory = { results: PointEntry[] };

const KIND_TABS = [
  { key: "", label: "전체" },
  { key: "earn", label: "적립" },
  { key: "spend", label: "사용" },
  { key: "expire", label: "소멸" },
];

const RANGE_CHIPS = [
  { key: "1w", label: "1주일" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "6m", label: "6개월" },
];

const PointsPage = () => {
  useDocumentTitle("포인트");
  return (
    <AuthGate title="포인트">
      <Points />
    </AuthGate>
  );
};

const Points = () => {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState("");
  const [from, setFrom] = useState(monthsAgo(1));
  const [to, setTo] = useState(today());
  const [range, setRange] = useState("1m");
  const [convertDone, setConvertDone] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [convertKey, setConvertKey] = useState(idempotencyKey);

  const balance = useQuery<PointBalance>({
    queryKey: ["points"],
    queryFn: () => api.request<PointBalance>("get", "/api/points"),
  });

  const params = new URLSearchParams();
  if (kind) params.set("kind", kind);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const history = useQuery<PointHistory>({
    queryKey: ["points-history", kind, from, to],
    queryFn: () => api.request<PointHistory>("get", `/api/points/history?${params.toString()}`),
  });

  const applyRange = (key: string) => {
    setRange(key);
    setTo(today());
    setFrom(
      key === "1w"
        ? daysAgo(7)
        : key === "1m"
          ? monthsAgo(1)
          : key === "3m"
            ? monthsAgo(3)
            : monthsAgo(6),
    );
  };

  const [convertState, convertAction, converting] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      setConvertDone(null);
      const parsed = parseForm(pointConvertSchema, formData);
      if ("error" in parsed) return { error: parsed.error };
      try {
        await api.post("/api/points/convert", parsed.data, {
          idempotencyKey: convertKey,
        });
        setConvertDone(parsed.data.amount);
        setConvertKey(idempotencyKey());
        queryClient.invalidateQueries({ queryKey: ["points"] });
        queryClient.invalidateQueries({ queryKey: ["points-history"] });
        queryClient.invalidateQueries({ queryKey: ["me-dashboard"] });
        return null;
      } catch (err) {
        return {
          error:
            err instanceof ApiRequestError && err.code === "VALIDATION_ERROR"
              ? "보유 포인트보다 많이 전환할 수 없어요"
              : apiErrorMessage(err, "전환에 실패했어요"),
        };
      }
    },
    null,
  );

  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const res = await apiFetch(`/api/points/history?${params.toString()}`, {
        headers: { Accept: "text/csv" },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `포인트내역_${today()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">포인트</h1>

      <div className="card point-balance-card mb-16">
        <p className="muted">보유 포인트</p>
        <p className="amount-lg">{fmtPoint(balance.data?.balance ?? 0)}</p>
        {(balance.data?.expiring_this_month ?? 0) > 0 && (
          <p className="muted">
            이번 달 {fmtPoint(balance.data?.expiring_this_month ?? 0)}이 사라져요
          </p>
        )}
      </div>

      <div className="card mb-16">
        {convertDone !== null && (
          <p className="ok-msg">{fmtPoint(convertDone)}을 예치금으로 전환했어요.</p>
        )}
        <form className="auth-form" action={convertAction}>
          <Field
            label="예치금으로 전환할 포인트"
            name="amount"
            type="number"
            min={1}
            step={1}
            max={balance.data?.balance}
            inputMode="numeric"
            placeholder="전환할 포인트를 입력해 주세요"
            required
          />
          {convertState?.error && (
            <p className="form-error" role="alert">
              {convertState.error}
            </p>
          )}
          <Button type="submit" variant="outline" disabled={converting}>
            {converting ? "전환 중…" : "예치금으로 전환"}
          </Button>
        </form>
      </div>

      <div className="mypage-section">
        <div className="row-between mb-12">
          <h2>포인트 내역</h2>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={downloadCsv}
            disabled={downloading}
          >
            {downloading ? "저장 중…" : "엑셀 저장"}
          </button>
        </div>

        <div className="filter-block">
          <div className="chips">
            {KIND_TABS.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`chip${kind === c.key ? " is-active" : ""}`}
                onClick={() => setKind(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="chips">
            {RANGE_CHIPS.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`chip${range === c.key ? " is-active" : ""}`}
                onClick={() => applyRange(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="date-range">
            <input
              type="date"
              className="input"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setRange("");
              }}
            />
            <span className="muted">~</span>
            <input
              type="date"
              className="input"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setRange("");
              }}
            />
          </div>
        </div>

        {history.isPending ? (
          <div className="empty">불러오는 중…</div>
        ) : (history.data?.results.length ?? 0) === 0 ? (
          <div className="empty">내역이 없어요</div>
        ) : (
          <div className="card card-tight">
            <ul className="list">
              {history.data?.results.map((e) => (
                <li key={e.id} className="hist-row">
                  <div className="hist-row-main">
                    <span>{e.memo || POINT_KIND_LABELS[e.kind] || e.kind}</span>
                    <small>
                      {POINT_KIND_LABELS[e.kind] ?? e.kind} · {fmtDate(e.created_at)}
                    </small>
                  </div>
                  <div className={`hist-amount${e.amount > 0 ? " is-plus" : ""}`}>
                    {e.amount > 0 ? "+" : ""}
                    {fmtPoint(e.amount)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default PointsPage;
