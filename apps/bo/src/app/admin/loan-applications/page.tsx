"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActionState, useState } from "react";

import { api, fmtWon } from "@/shared/api";
import { adminLoanApproveSchema, parseForm } from "@/shared/lib";
import { errMsg, fmtDateTime } from "@/shared/lib";

import { AdminModal } from "../_components";
import { DECISION_LABEL, REPAY_LABEL, TYPE_LABEL, badgeClass } from "../_components";

import type { components } from "@dailyfunding/api-client";

type LoanApplication = components["schemas"]["AdminLoanApplicationItem"];

const FILTERS = [
  { value: "", label: "전체" },
  { value: "submitted", label: "심사대기" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "거절" },
];

const LoanApplicationsPage = () => {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<LoanApplication | null>(null);
  const [error, setError] = useState("");
  const [productId, setProductId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "loan-applications", status],
    queryFn: () =>
      api.get("/api/admin/loan-applications", {
        query: { status: status || undefined },
      }),
  });
  const decide = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: components["schemas"]["PatchedLoanDecision"];
    }) => api.patch("/api/admin/loan-applications/{id}", body, { path: { id } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin", "loan-applications"] });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      if (res.product_id) {
        setProductId(res.product_id);
      } else {
        setSelected(null);
      }
    },
    onError: (e) => setError(errMsg(e)),
  });

  const [approveState, approveAction] = useActionState<{ error: string } | null, FormData>(
    (_prev, formData) => {
      if (!selected) return { error: "신청을 선택해 주세요" };
      const parsed = parseForm(adminLoanApproveSchema, formData);
      if ("error" in parsed) return { error: parsed.error };
      const body: components["schemas"]["PatchedLoanDecision"] = {
        action: "approve",
      };
      if (parsed.data.name) body.name = parsed.data.name;
      if (parsed.data.type) body.type = parsed.data.type as components["schemas"]["TypeEnum"];
      if (parsed.data.annual_rate) body.annual_rate = parsed.data.annual_rate;
      if (parsed.data.repay_type)
        body.repay_type = parsed.data.repay_type as components["schemas"]["RepayTypeEnum"];
      if (parsed.data.platform_fee_rate) body.platform_fee_rate = parsed.data.platform_fee_rate;
      if (parsed.data.borrower_id) body.borrower_id = parsed.data.borrower_id;
      decide.mutate({ id: selected.id, body });
      return null;
    },
    null,
  );

  const onReject = () => {
    if (!selected) return;
    if (window.confirm("이 대출 신청을 거절할까요?")) {
      decide.mutate({ id: selected.id, body: { action: "reject" } });
    }
  };

  const rows = data?.results ?? [];

  return (
    <>
      <div className="admin-head">
        <h1>대출 신청 심사</h1>
      </div>
      <div className="chips" style={{ marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`chip${status === f.value ? " is-active" : ""}`}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="empty">불러오는 중이에요</div>
      ) : rows.length === 0 ? (
        <div className="empty">신청 내역이 없어요</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>번호</th>
                <th>신청자</th>
                <th>회사</th>
                <th>신청금액</th>
                <th>기간</th>
                <th>상태</th>
                <th>신청일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.name}</td>
                  <td>{a.company || "-"}</td>
                  <td>{fmtWon(a.amount)}</td>
                  <td>{a.term_months}개월</td>
                  <td>
                    <span className={badgeClass(a.status)}>
                      {DECISION_LABEL[a.status] ?? a.status}
                    </span>
                  </td>
                  <td>{fmtDateTime(a.created_at)}</td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setSelected(a);
                        setError("");
                        setProductId(null);
                      }}
                    >
                      상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <AdminModal title={`대출 신청 #${selected.id}`} onClose={() => setSelected(null)}>
          <dl>
            <div className="admin-kv">
              <dt>신청자</dt>
              <dd>{selected.name}</dd>
            </div>
            <div className="admin-kv">
              <dt>회사</dt>
              <dd>{selected.company || "-"}</dd>
            </div>
            <div className="admin-kv">
              <dt>신청금액</dt>
              <dd>{fmtWon(selected.amount)}</dd>
            </div>
            <div className="admin-kv">
              <dt>기간</dt>
              <dd>{selected.term_months}개월</dd>
            </div>
            <div className="admin-kv">
              <dt>상태</dt>
              <dd>{DECISION_LABEL[selected.status] ?? selected.status}</dd>
            </div>
            <div className="admin-kv">
              <dt>신청일</dt>
              <dd>{fmtDateTime(selected.created_at)}</dd>
            </div>
          </dl>
          {productId && (
            <p className="admin-notice">
              승인됐어요. 상품 #{productId}이(가) 임시저장 상태로 생성됐어요
            </p>
          )}
          {selected.status === "submitted" && !productId && (
            <form action={approveAction} style={{ marginTop: 16 }}>
              <div className="form-row">
                <label className="field">
                  <span className="field-label">상품명 (비우면 자동)</span>
                  <input
                    className="input"
                    name="name"
                    placeholder={`${selected.company || selected.name} 대출`}
                  />
                </label>
              </div>
              <div className="form-row">
                <label className="field">
                  <span className="field-label">상품 유형</span>
                  <select className="input" name="type" defaultValue="">
                    <option value="">기본 (개인신용)</option>
                    {Object.entries(TYPE_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label className="field">
                  <span className="field-label">연금리 (%) — 기본 12.00</span>
                  <input className="input" name="annual_rate" type="number" step="0.01" min="0" />
                </label>
              </div>
              <div className="form-row">
                <label className="field">
                  <span className="field-label">상환방식</span>
                  <select className="input" name="repay_type" defaultValue="">
                    <option value="">기본 (원리금균등)</option>
                    {Object.entries(REPAY_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label className="field">
                  <span className="field-label">플랫폼 수수료율 (%) — 기본 1.00</span>
                  <input
                    className="input"
                    name="platform_fee_rate"
                    type="number"
                    step="0.01"
                    min="0"
                  />
                </label>
              </div>
              <div className="form-row">
                <label className="field">
                  <span className="field-label">차주 ID (비우면 자동)</span>
                  <input className="input" name="borrower_id" />
                </label>
              </div>
              {(approveState?.error ?? error) && (
                <p className="form-error">{approveState?.error ?? error}</p>
              )}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={decide.isPending}
                  onClick={onReject}
                >
                  거절
                </button>
                <button type="submit" className="btn btn-primary" disabled={decide.isPending}>
                  승인 후 상품화
                </button>
              </div>
            </form>
          )}
        </AdminModal>
      )}
    </>
  );
};

export default LoanApplicationsPage;
