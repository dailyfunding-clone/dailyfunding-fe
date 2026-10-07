"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { api, fmtWon } from "@/shared/api";
import { apiPatch } from "@/shared/api";
import { errMsg, fmtDateTime } from "@/shared/lib";

type DepositHold = {
  id: string;
  user_id: number;
  email: string;
  amount: number;
  sender_name: string;
  held_reason: string;
  created_at: string;
};

const DepositHoldsPage = () => {
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "deposit-holds"],
    queryFn: () =>
      api.request<{ results: DepositHold[] }>("get", "/api/admin/deposit/holds"),
  });
  const match = useMutation({
    mutationFn: (id: string) =>
      apiPatch(`/api/admin/deposit/holds/${id}`, {}),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "deposit-holds"] }),
    onError: (e) => setError(errMsg(e)),
  });

  const rows = data?.results ?? [];

  return (
    <>
      <div className="admin-head">
        <h1>입금 보류</h1>
      </div>
      {error && <p className="form-error">{error}</p>}
      {isLoading ? (
        <div className="empty">불러오는 중이에요</div>
      ) : rows.length === 0 ? (
        <div className="empty">보류된 입금이 없어요</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Intent</th>
                <th>이메일</th>
                <th>예금주명</th>
                <th>금액</th>
                <th>보류 사유</th>
                <th>요청일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <tr key={h.id}>
                  <td>{h.id}</td>
                  <td>{h.email}</td>
                  <td>{h.sender_name}</td>
                  <td>{fmtWon(h.amount)}</td>
                  <td>{h.held_reason || "-"}</td>
                  <td>{fmtDateTime(h.created_at)}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={match.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `${h.sender_name} 님의 ${fmtWon(h.amount)} 입금을 확정할까요?`,
                          )
                        ) {
                          match.mutate(h.id);
                        }
                      }}
                    >
                      수동 매칭
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default DepositHoldsPage;
