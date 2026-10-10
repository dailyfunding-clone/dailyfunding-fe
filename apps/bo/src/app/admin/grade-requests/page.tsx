"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { api } from "@/shared/api";
import { errMsg, fmtDateTime } from "@/shared/lib";

import { AdminModal } from "../_components";
import { DECISION_LABEL, GRADE_LABEL, badgeClass } from "../_components";

import type { components } from "@dailyfunding/api-client";

type GradeRequest = components["schemas"]["AdminGradeRequestItem"];

const FILTERS = [
  { value: "", label: "전체" },
  { value: "submitted", label: "심사대기" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "거절" },
];

const GradeRequestsPage = () => {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<GradeRequest | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const {
    data,
    isLoading,
    error: listError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin", "grade-requests", status],
    queryFn: () =>
      api.get("/api/admin/grade-requests", {
        query: { status: status || undefined },
      }),
  });
  const decide = useMutation({
    mutationFn: ({
      id,
      action,
      rejectReason,
    }: {
      id: number;
      action: "approve" | "reject";
      rejectReason?: string;
    }) =>
      api.patch(
        "/api/admin/grade-requests/{id}",
        {
          action,
          ...(rejectReason ? { reason: rejectReason } : {}),
        },
        { path: { id } },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "grade-requests"] });
      setSelected(null);
    },
    onError: (e) => setError(errMsg(e)),
  });

  const rows = data?.results ?? [];

  return (
    <>
      <div className="admin-head">
        <h1>등급 변경 심사</h1>
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
      ) : listError ? (
        <div className="empty">
          <p>{errMsg(listError)}</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ margin: "8px auto 0" }}
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            다시 시도
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="empty">신청 내역이 없어요</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>번호</th>
                <th>이메일</th>
                <th>신청 등급</th>
                <th>상태</th>
                <th>제출일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id}>
                  <td>{g.id}</td>
                  <td>{g.email}</td>
                  <td>{GRADE_LABEL[g.to_grade] ?? g.to_grade}</td>
                  <td>
                    <span className={badgeClass(g.status)}>
                      {DECISION_LABEL[g.status] ?? g.status}
                    </span>
                  </td>
                  <td>{fmtDateTime(g.created_at)}</td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setSelected(g);
                        setReason("");
                        setError("");
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
        <AdminModal title={`등급 변경 신청 #${selected.id}`} onClose={() => setSelected(null)}>
          <dl>
            <div className="admin-kv">
              <dt>이메일</dt>
              <dd>{selected.email}</dd>
            </div>
            <div className="admin-kv">
              <dt>신청 등급</dt>
              <dd>{GRADE_LABEL[selected.to_grade] ?? selected.to_grade}</dd>
            </div>
            <div className="admin-kv">
              <dt>상태</dt>
              <dd>{DECISION_LABEL[selected.status] ?? selected.status}</dd>
            </div>
            <div className="admin-kv">
              <dt>제출일</dt>
              <dd>{fmtDateTime(selected.created_at)}</dd>
            </div>
          </dl>
          {selected.status === "submitted" && (
            <>
              <div className="form-row" style={{ marginTop: 16 }}>
                <label className="field">
                  <span className="field-label">거절 사유 (거절 시)</span>
                  <input
                    className="input"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="거절 사유를 입력해 주세요"
                  />
                </label>
              </div>
              {error && <p className="form-error">{error}</p>}
              <div className="admin-modal-actions">
                <button
                  className="btn btn-outline"
                  disabled={decide.isPending}
                  onClick={() => {
                    if (window.confirm(`${selected.email} 님의 등급 변경을 거절할까요?`)) {
                      decide.mutate({
                        id: selected.id,
                        action: "reject",
                        rejectReason: reason,
                      });
                    }
                  }}
                >
                  거절
                </button>
                <button
                  className="btn btn-primary"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ id: selected.id, action: "approve" })}
                >
                  승인
                </button>
              </div>
            </>
          )}
        </AdminModal>
      )}
    </>
  );
};

export default GradeRequestsPage;
