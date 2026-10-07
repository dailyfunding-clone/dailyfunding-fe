"use client";

import { Button, Field } from "@dailyfunding/design-system/components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActionState, useState } from "react";

import {
  ApiRequestError,
  api,
  fmtWon,
  idempotencyKey,
} from "@/shared/api";
import {
  depositChargeSchema,
  parseForm,
  type FormState,
} from "@/shared/lib";

import { apiErrorMessage } from "./constants";

export type DepositAccount = {
  bank: string;
  account_no: string;
  holder: string;
  deposit: number;
  held: number;
  withdrawable: number;
};

export const useDepositAccount = () =>
  useQuery<DepositAccount>({
    queryKey: ["deposit-account"],
    queryFn: () =>
      api.request<DepositAccount>("get", "/api/deposit/account"),
    retry: false,
  });

const DepositCharge = () => {
  const account = useDepositAccount();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const [key, setKey] = useState(idempotencyKey);

  const copyAccount = async () => {
    if (!account.data) return;
    try {
      await navigator.clipboard.writeText(account.data.account_no);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      setDone(false);
      const parsed = parseForm(depositChargeSchema, formData);
      if ("error" in parsed) return { error: parsed.error };
      try {
        await api.post("/api/deposit/notify-intent", parsed.data, {
          idempotencyKey: key,
        });
        setDone(true);
        setKey(idempotencyKey());
        queryClient.invalidateQueries({ queryKey: ["deposit-account"] });
        queryClient.invalidateQueries({ queryKey: ["deposit-history"] });
        return null;
      } catch (err) {
        return {
          error:
            err instanceof ApiRequestError && err.code === "VALIDATION_ERROR"
              ? "입금할 금액과 입금자명을 확인해 주세요"
              : apiErrorMessage(err),
        };
      }
    },
    null,
  );

  if (account.isPending) {
    return <div className="empty">불러오는 중…</div>;
  }
  if (!account.data) {
    return <div className="empty">가상계좌 정보를 불러오지 못했어요</div>;
  }

  return (
    <div>
      <div className="card mb-16">
        <p className="muted">입금할 전용 가상계좌</p>
        <p className="acct-no">
          {account.data.bank} {account.data.account_no}
        </p>
        <p className="muted acct-holder">예금주 {account.data.holder}</p>
        <div className="card-links">
          <button type="button" className="btn btn-outline" onClick={copyAccount}>
            {copied ? "복사했어요" : "계좌번호 복사"}
          </button>
        </div>
        <p className="muted mt-12">
          현재 예치금 {fmtWon(account.data.deposit)}
        </p>
      </div>

      {done && (
        <p className="ok-msg">
          입금 의사를 등록했어요. 위 계좌로 입금하면 자동으로 충전돼요.
        </p>
      )}

      <form className="auth-form" action={formAction}>
        <Field
          label="입금자명"
          name="sender_name"
          placeholder="입금할 때 표시될 이름"
          defaultValue={account.data.holder}
          maxLength={50}
          required
        />
        <Field
          label="입금 금액"
          name="amount"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          placeholder="금액을 입력해 주세요"
          required
        />
        {state?.error && <p className="form-error">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "등록 중…" : "입금 알리기"}
        </Button>
      </form>
      <p className="muted mt-12">
        입금자명이 계좌 예금주와 다르면 입금이 보류될 수 있어요.
      </p>
    </div>
  );
};

export default DepositCharge;
