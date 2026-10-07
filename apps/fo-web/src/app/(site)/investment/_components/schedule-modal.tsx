"use client";

import { useQuery } from "@tanstack/react-query";
import { useActionState, useState } from "react";

import { api, fmtWon } from "@/shared/api";
import { parseForm, schedulePreviewSchema, type FormState } from "@/shared/lib";

import type { SchedulePreview } from "./types";

const QUICK_AMOUNTS = [
  { label: "1,000만원", value: 10_000_000 },
  { label: "100만원", value: 1_000_000 },
  { label: "10만원", value: 100_000 },
];

type Props = {
  productId: number;
  open: boolean;
  onClose: () => void;
};

const ScheduleModal = ({ productId, open, onClose }: Props) => {
  const [man, setMan] = useState("100");
  const [amount, setAmount] = useState(0);

  const [state, formAction] = useActionState<FormState, FormData>(
    (_prev, formData) => {
      const parsed = parseForm(schedulePreviewSchema, {
        man: String(formData.get("man") ?? "").replace(/,/g, ""),
      });
      if ("error" in parsed) return { error: parsed.error };
      setAmount(parsed.data.man * 10_000);
      return null;
    },
    null,
  );

  const preview = useQuery<SchedulePreview>({
    queryKey: ["schedule-preview", productId, amount],
    queryFn: () =>
      api.request<SchedulePreview>(
        "get",
        `/api/products/${productId}/schedule-preview?amount=${amount}`,
      ),
    enabled: open && amount > 0,
  });

  if (!open) return null;

  const quick = (won: number) => {
    setMan(String(won / 10_000));
    setAmount(won);
  };

  const rows = preview.data?.schedule ?? [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>예상 수익 계산</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <form action={formAction}>
          <label className="field">
            <span className="field-label">투자금액</span>
            <span className="unit-input">
              <input
                className="input"
                name="man"
                inputMode="numeric"
                value={man}
                onChange={(e) => setMan(e.target.value)}
                placeholder="금액을 입력해 주세요"
              />
              <em>만원</em>
            </span>
          </label>
          <div className="quick-amounts">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q.value}
                type="button"
                className="chip"
                onClick={() => quick(q.value)}
              >
                {q.label}
              </button>
            ))}
          </div>
          {state?.error && <p className="form-error">{state.error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            계산하기
          </button>
        </form>

        {preview.isFetching && <p className="field-hint">계산 중이에요…</p>}
        {preview.isError && (
          <p className="form-error">예상 수익을 불러오지 못했어요</p>
        )}
        {preview.data && (
          <>
            <div className="preview-summary" style={{ marginTop: 20 }}>
              <div className="kv-cell">
                <span>세전 수익률</span>
                <strong>{preview.data.gross_rate}%</strong>
              </div>
              <div className="kv-cell">
                <span>세후 수익률</span>
                <strong>{preview.data.net_rate}%</strong>
              </div>
              <div className="kv-cell">
                <span>수익금(세전)</span>
                <strong>{fmtWon(preview.data.gross_return)}</strong>
              </div>
              <div className="kv-cell">
                <span>수익금(세후)</span>
                <strong>{fmtWon(preview.data.net_return)}</strong>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>회차</th>
                    <th>이자지급일</th>
                    <th className="num">투자원금</th>
                    <th className="num">상환원금</th>
                    <th className="num">수익금(세전)</th>
                    <th className="num">세금</th>
                    <th className="num">플랫폼이용료</th>
                    <th className="num">수익금(세후)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.seq}>
                      <td>{r.seq}</td>
                      <td>{r.pay_date}</td>
                      <td className="num">{fmtWon(r.principal)}</td>
                      <td className="num">{fmtWon(r.repay_principal)}</td>
                      <td className="num">{fmtWon(r.interest_gross)}</td>
                      <td className="num">{fmtWon(r.tax)}</td>
                      <td className="num">{fmtWon(r.platform_fee)}</td>
                      <td className="num">{fmtWon(r.interest_net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScheduleModal;
