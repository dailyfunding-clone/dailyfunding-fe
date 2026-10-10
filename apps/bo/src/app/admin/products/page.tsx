"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { api, fmtMan } from "@/shared/api";
import { errMsg } from "@/shared/lib";

import {
  ProductForm,
  type AdminProduct,
  NEXT_STATUS,
  STATUS_LABEL,
  TYPE_LABEL,
  badgeClass,
} from "../_components";

import type { components } from "@dailyfunding/api-client";

const ProductsPage = () => {
  const qc = useQueryClient();
  const [modal, setModal] = useState<AdminProduct | "new" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const {
    data,
    isLoading,
    error: listError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => api.get("/api/admin/products"),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "products"] });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(
        "/api/admin/products/{id}/status",
        { status: status as components["schemas"]["StatusEnum"] },
        { path: { id } },
      ),
    onSuccess: invalidate,
    onError: (e) => setError(errMsg(e)),
  });
  const execMut = useMutation({
    mutationFn: (id: number) =>
      api.post("/api/admin/products/{id}/execute", undefined, {
        path: { id },
      }),
    onSuccess: () => {
      invalidate();
      setNotice("대출이 실행됐어요. 상환 스케줄이 확정됐어요");
    },
    onError: (e) => setError(errMsg(e)),
  });

  const transition = (id: number, to: string) => {
    setError("");
    setNotice("");
    if (!window.confirm(`'${STATUS_LABEL[to] ?? to}'(으)로 전환할까요?`)) return;
    statusMut.mutate({ id, status: to });
  };
  const execute = (id: number) => {
    setError("");
    setNotice("");
    if (
      window.confirm(
        "대출을 실행하면 투자금이 차입자 계정으로 이동하고 상환 스케줄이 확정돼요. 실행할까요?",
      )
    ) {
      execMut.mutate(id);
    }
  };

  const products = data?.results ?? [];

  return (
    <>
      <div className="admin-head">
        <h1>상품 관리</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setModal("new")}>
          신규 상품 등록
        </button>
      </div>
      {notice && <p className="admin-notice">{notice}</p>}
      {error && <p className="form-error">{error}</p>}
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
      ) : products.length === 0 ? (
        <div className="empty">등록된 상품이 없어요</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>번호</th>
                <th>상품명</th>
                <th>유형</th>
                <th>금리</th>
                <th>기간</th>
                <th>모집금액</th>
                <th>상태</th>
                <th>진행률</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const pct = p.target_amount
                  ? ((p.raised_amount * 100) / p.target_amount).toFixed(1)
                  : "0.0";
                return (
                  <tr key={p.id}>
                    <td>{p.product_no}</td>
                    <td>{p.name}</td>
                    <td>{TYPE_LABEL[p.type] ?? p.type}</td>
                    <td>{p.annual_rate}%</td>
                    <td>{p.term_months}개월</td>
                    <td>{fmtMan(p.target_amount)}</td>
                    <td>
                      <span className={badgeClass(p.status)}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                    <td>{pct}%</td>
                    <td>
                      <div className="admin-actions">
                        {(p.status === "draft" || p.status === "scheduled") && (
                          <button className="btn btn-outline btn-sm" onClick={() => setModal(p)}>
                            수정
                          </button>
                        )}
                        {p.status === "recruited" && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => execute(p.id)}
                            disabled={execMut.isPending}
                          >
                            대출 실행
                          </button>
                        )}
                        {(NEXT_STATUS[p.status] ?? []).map((n) => (
                          <button
                            key={n.to}
                            className="btn btn-outline btn-sm"
                            onClick={() => transition(p.id, n.to)}
                            disabled={statusMut.isPending}
                          >
                            {n.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <ProductForm product={modal === "new" ? null : modal} onClose={() => setModal(null)} />
      )}
    </>
  );
};

export default ProductsPage;
