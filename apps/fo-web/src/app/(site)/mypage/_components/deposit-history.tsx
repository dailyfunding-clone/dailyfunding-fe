"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";

import { api, fmtWon } from "@/shared/api";

import { DEPOSIT_KIND_LABELS } from "./constants";
import { daysAgo, fmtDateTime, monthsAgo, today } from "./utils";

type HistoryEntry = {
  id: number;
  kind: string;
  amount: number;
  ref_type: string;
  ref_id: string;
  created_at: string;
};

type HistoryPage = {
  results: HistoryEntry[];
  next_cursor: string | null;
};

const VIEWS = [
  { key: "", label: "예치금 내역" },
  { key: "withholding", label: "원천징수" },
  { key: "platform_fee", label: "플랫폼 이용료" },
];

const KIND_CHIPS = [
  { key: "", label: "전체" },
  { key: "deposit", label: "입금" },
  { key: "withdraw", label: "출금" },
  { key: "invest", label: "투자" },
  { key: "repay", label: "상환" },
  { key: "point_spend", label: "포인트 전환" },
  { key: "fee", label: "수수료" },
];

const RANGE_CHIPS = [
  { key: "1w", label: "1주일" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "6m", label: "6개월" },
];

const DepositHistory = () => {
  const [view, setView] = useState("");
  const [kind, setKind] = useState("");
  const [from, setFrom] = useState(monthsAgo(1));
  const [to, setTo] = useState(today());
  const [range, setRange] = useState("1m");

  const params = new URLSearchParams();
  if (view) params.set("view", view);
  if (!view && kind) params.set("kind", kind);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const query = useInfiniteQuery<HistoryPage>({
    queryKey: ["deposit-history", view, kind, from, to],
    queryFn: ({ pageParam }) => {
      const p = new URLSearchParams(params);
      if (pageParam) p.set("cursor", String(pageParam));
      return api.request<HistoryPage>(
        "get",
        `/api/deposit/history?${p.toString()}`,
      );
    },
    initialPageParam: "",
    getNextPageParam: (last) => last.next_cursor ?? undefined,
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

  const entries = query.data?.pages.flatMap((p) => p.results) ?? [];

  return (
    <div>
      <div className="tabs mb-16">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            className={view === v.key ? "is-active" : ""}
            onClick={() => setView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="filter-block">
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
        {!view && (
          <div className="chips">
            {KIND_CHIPS.map((c) => (
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
        )}
      </div>

      {query.isPending ? (
        <div className="empty">불러오는 중…</div>
      ) : entries.length === 0 ? (
        <div className="empty">내역이 없어요</div>
      ) : (
        <>
          <ul className="list">
            {entries.map((e) => (
              <li key={e.id} className="hist-row">
                <div className="hist-row-main">
                  <span>{DEPOSIT_KIND_LABELS[e.kind] ?? e.kind}</span>
                  <small>{fmtDateTime(e.created_at)}</small>
                </div>
                <div className={`hist-amount${e.amount > 0 ? " is-plus" : ""}`}>
                  {e.amount > 0 ? "+" : ""}
                  {fmtWon(e.amount)}
                </div>
              </li>
            ))}
          </ul>
          {query.hasNextPage && (
            <button
              type="button"
              className="btn btn-outline more-btn"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage ? "불러오는 중…" : "더 보기"}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DepositHistory;
