"use client";

import { Button, Field } from "@dailyfunding/design-system/components";
import { useQueryClient } from "@tanstack/react-query";
import { useActionState, useState } from "react";

import { useReauth } from "@/features/auth";
import { ApiRequestError, api, fmtWon, idempotencyKey } from "@/shared/api";
import { parseForm, withdrawAmountSchema, type FormState } from "@/shared/lib";

import { apiErrorMessage, WITHDRAWAL_STATUS_LABELS } from "./constants";
import { useDepositAccount } from "./deposit-charge";

const DepositWithdraw = () => {
  const account = useDepositAccount();
  const reauth = useReauth();
  const queryClient = useQueryClient();
  const [all, setAll] = useState(false);
  const [key, setKey] = useState(idempotencyKey);
  const [result, setResult] = useState<{ fee: number; status: string } | null>(
    null,
  );

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      setResult(null);
      const body = all
        ? ({ all: true } as const)
        : (() => {
            const parsed = parseForm(withdrawAmountSchema, formData);
            return "error" in parsed ? parsed : parsed.data;
          })();
      if ("error" in body) return { error: body.error };
      for (let attempt = 0; attempt < 2; attempt++) {
        const token = await reauth?.ensure(attempt > 0);
        if (!token) return { error: "본인 인증이 취소됐어요" };
        try {
          const res = await api.request<{ fee: number; status: string }>(
            "post",
            "/api/deposit/withdraw",
            body,
            { idempotencyKey: key, reauthToken: token },
          );
          setResult(res);
          setKey(idempotencyKey());
          queryClient.invalidateQueries({ queryKey: ["deposit", "account"] });
          queryClient.invalidateQueries({ queryKey: ["deposit-history"] });
          queryClient.invalidateQueries({ queryKey: ["me-dashboard"] });
          return null;
        } catch (err) {
          if (
            err instanceof ApiRequestError &&
            err.code === "REAUTH_REQUIRED"
          ) {
            reauth?.reset();
            continue;
          }
          return {
            error:
              err instanceof ApiRequestError &&
              err.code === "INSUFFICIENT_DEPOSIT"
                ? "출금 가능한 금액을 초과했어요"
                : apiErrorMessage(err),
          };
        }
      }
      return { error: "잠시 후 다시 시도해 주세요" };
    },
    null,
  );

  if (account.isPending) {
    return <div className="empty">불러오는 중…</div>;
  }
  if (!account.data) {
    return <div className="empty">계좌 정보를 불러오지 못했어요</div>;
  }

  return (
    <div>
      <div className="card mb-16">
        <div className="stat-rows">
          <div className="row-between">
            <span>예치금</span>
            <strong>{fmtWon(account.data.deposit)}</strong>
          </div>
          <div className="row-between">
            <span>처리 중인 금액</span>
            <strong>{fmtWon(account.data.held)}</strong>
          </div>
          <div className="row-between">
            <span>출금 가능 금액</span>
            <strong>{fmtWon(account.data.withdrawable)}</strong>
          </div>
        </div>
      </div>

      {result && (
        <p className="ok-msg">
          출금 요청이 접수됐어요 ({WITHDRAWAL_STATUS_LABELS[result.status] ??
            result.status}
          {result.fee > 0 ? `, 수수료 ${fmtWon(result.fee)}` : ", 수수료 무료"})
        </p>
      )}

      <form className="auth-form" action={formAction}>
        {!all && (
          <Field
            label="출금 금액"
            name="amount"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            max={account.data.withdrawable}
            placeholder="금액을 입력해 주세요"
            required
          />
        )}
        <label className="form-check">
          <input
            type="checkbox"
            checked={all}
            onChange={(e) => setAll(e.target.checked)}
          />
          전액 출금
        </label>
        {state?.error && <p className="form-error" role="alert">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "요청 중…" : "출금하기"}
        </Button>
      </form>
      <p className="muted mt-12">
        출금 수수료는 월 20회까지 무료예요. 이후에는 건당 500원이 빠져요.
      </p>
    </div>
  );
};

export default DepositWithdraw;
