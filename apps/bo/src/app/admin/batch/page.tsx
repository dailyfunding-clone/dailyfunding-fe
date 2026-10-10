"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { api } from "@/shared/api";
import { errMsg, today } from "@/shared/lib";

import type { components } from "@dailyfunding/api-client";

type ReconcileSummary = components["schemas"]["ReconcileSummary"];

const renderReconcile = (r: ReconcileSummary) =>
  r.ok
    ? `대사 일치해요 (리포트 #${r.report_id})`
    : `차이 ${r.diffs.length}건 발견 (리포트 #${r.report_id})\n${JSON.stringify(r.diffs, null, 2)}`;

const BatchPage = () => {
  const [date, setDate] = useState(today());

  const repay = useMutation({
    mutationFn: () => api.post("/api/admin/batch/repay", undefined, { query: { date } }),
  });
  const expire = useMutation({
    mutationFn: () =>
      api.post("/api/admin/batch/expire-points", undefined, {
        query: { date },
      }),
  });
  const reconcile = useMutation({
    mutationFn: () => api.post("/api/admin/batch/reconcile", undefined, { query: { date } }),
  });
  const advance = useMutation({
    mutationFn: (d: string) => api.post("/api/admin/time/advance", { date: d }),
  });

  const pending = repay.isPending || expire.isPending || reconcile.isPending || advance.isPending;

  return (
    <>
      <div className="admin-head">
        <h1>배치 작업</h1>
        <label className="field">
          <span className="field-label">기준일</span>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>
      <div className="admin-grid">
        <div className="card">
          <h2 className="admin-card-title">상환 배치</h2>
          <p className="admin-card-desc">기준일의 상환 스케줄을 실행하고 연체를 전환해요</p>
          <button
            className="btn btn-primary btn-sm"
            disabled={pending}
            onClick={() => repay.mutate()}
          >
            실행
          </button>
          {repay.isError && <p className="form-error">{errMsg(repay.error)}</p>}
          {repay.data && (
            <pre className="admin-result">
              {`실행일 ${repay.data.date}\n상환 처리 ${repay.data.paid}건 · 연체 전환 ${repay.data.overdue}건`}
            </pre>
          )}
        </div>
        <div className="card">
          <h2 className="admin-card-title">포인트 소멸</h2>
          <p className="admin-card-desc">유효기간이 지난 포인트를 소멸해요</p>
          <button
            className="btn btn-primary btn-sm"
            disabled={pending}
            onClick={() => expire.mutate()}
          >
            실행
          </button>
          {expire.isError && <p className="form-error">{errMsg(expire.error)}</p>}
          {expire.data && (
            <pre className="admin-result">{`소멸된 포인트 로트 ${expire.data.expired_lots}건`}</pre>
          )}
        </div>
        <div className="card">
          <h2 className="admin-card-title">원장 대사</h2>
          <p className="admin-card-desc">원장 잔액과 계정 합계를 대사해요</p>
          <button
            className="btn btn-primary btn-sm"
            disabled={pending}
            onClick={() => reconcile.mutate()}
          >
            실행
          </button>
          {reconcile.isError && <p className="form-error">{errMsg(reconcile.error)}</p>}
          {reconcile.data && <pre className="admin-result">{renderReconcile(reconcile.data)}</pre>}
        </div>
        <div className="card">
          <h2 className="admin-card-title">날짜 진행</h2>
          <p className="admin-card-desc">
            기준일 기준으로 상환 배치·포인트 소멸·원장 대사를 순차 실행해요 (데모용)
          </p>
          <div className="admin-actions">
            <button
              className="btn btn-primary btn-sm"
              disabled={pending}
              onClick={() => {
                if (window.confirm(`${date} 기준으로 시간을 진행할까요?`)) {
                  advance.mutate(date);
                }
              }}
            >
              날짜 진행
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={pending}
              onClick={() => {
                const d = new Date(date);
                d.setDate(d.getDate() + 1);
                const next = d.toISOString().slice(0, 10);
                setDate(next);
                advance.mutate(next);
              }}
            >
              +1일 진행
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={pending}
              onClick={() => {
                const d = new Date(date);
                d.setDate(d.getDate() + 7);
                const next = d.toISOString().slice(0, 10);
                setDate(next);
                advance.mutate(next);
              }}
            >
              +7일 진행
            </button>
          </div>
          {advance.isError && <p className="form-error">{errMsg(advance.error)}</p>}
          {advance.data && (
            <pre className="admin-result">
              {`기준일 ${advance.data.date}\n[상환] 처리 ${advance.data.repay.paid}건 · 연체 ${advance.data.repay.overdue}건\n[포인트] 소멸 ${advance.data.expire.expired_lots}건\n[대사] ${renderReconcile(advance.data.reconcile)}`}
            </pre>
          )}
        </div>
      </div>
    </>
  );
};

export default BatchPage;
