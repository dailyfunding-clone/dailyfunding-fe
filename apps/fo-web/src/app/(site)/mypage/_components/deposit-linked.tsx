"use client";

import { Button, Field } from "@dailyfunding/design-system/components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActionState, useState } from "react";

import { useReauth } from "@/features/auth";
import { ApiRequestError, api } from "@/shared/api";
import { linkedAccountSchema, parseForm, type FormState } from "@/shared/lib";

import { apiErrorMessage, BANKS } from "./constants";


type LinkedAccount = {
  bank_name: string;
  account_no: string;
  holder: string;
  auto_charge: boolean;
};

type LinkedResponse = { linked: boolean } & Partial<LinkedAccount>;

const LINKED_KEY = ["deposit", "linked-account"] as const;

const DepositLinked = () => {
  const reauth = useReauth();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const linkedQuery = useQuery<LinkedResponse>({
    queryKey: LINKED_KEY,
    queryFn: () => api.request<LinkedResponse>("get", "/api/deposit/linked-account"),
    retry: false,
  });

  const linked: LinkedAccount | null = linkedQuery.data?.linked
    ? {
        bank_name: linkedQuery.data.bank_name ?? "",
        account_no: linkedQuery.data.account_no ?? "",
        holder: linkedQuery.data.holder ?? "",
        auto_charge: linkedQuery.data.auto_charge ?? false,
      }
    : null;

  const toggle = useMutation({
    mutationFn: (enabled: boolean) =>
      api.request<{ enabled: boolean }>("put", "/api/deposit/auto-charge", {
        enabled,
      }),
    onSuccess: (res) => {
      queryClient.setQueryData<LinkedResponse>(LINKED_KEY, (prev) =>
        prev ? { ...prev, auto_charge: res.enabled } : prev,
      );
    },
  });

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      setSaved(false);
      const parsed = parseForm(linkedAccountSchema, formData);
      if ("error" in parsed) return { error: parsed.error };
      for (let attempt = 0; attempt < 2; attempt++) {
        const token = await reauth?.ensure(attempt > 0);
        if (!token) return { error: "본인 인증이 취소됐어요" };
        try {
          const res = await api.request<LinkedResponse>(
            "put",
            "/api/deposit/linked-account",
            parsed.data,
            { reauthToken: token },
          );
          queryClient.setQueryData(LINKED_KEY, res);
          setSaved(true);
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
              err instanceof ApiRequestError && err.code === "VALIDATION_ERROR"
                ? "본인 명의 계좌인지 확인해 주세요"
                : apiErrorMessage(err),
          };
        }
      }
      return { error: "잠시 후 다시 시도해 주세요" };
    },
    null,
  );

  const formError =
    state?.error ?? (toggle.error ? apiErrorMessage(toggle.error) : "");

  if (linkedQuery.isPending) {
    return <div className="empty">불러오는 중이에요…</div>;
  }

  if (linkedQuery.isError) {
    return (
      <div className="empty">
        <p>연결계좌 정보를 불러오지 못했어요</p>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => void linkedQuery.refetch()}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div>
      {linked && (
        <div className="card mb-16">
          <p className="muted">연결된 계좌</p>
          <p className="acct-no">
            {linked.bank_name} {linked.account_no}
          </p>
          <p className="muted acct-holder">예금주 {linked.holder}</p>
          <div className="card-links">
            <button
              type="button"
              className="btn btn-outline"
              disabled={toggle.isPending}
              onClick={() => toggle.mutate(!linked.auto_charge)}
            >
              간편충전 {linked.auto_charge ? "끄기" : "켜기"}
            </button>
          </div>
          <p className="muted mt-12">
            간편충전을 켜면 투자할 때 부족한 금액을 연결계좌에서 자동으로
            채워요.
          </p>
        </div>
      )}

      {saved && <p className="ok-msg">연결계좌를 등록했어요.</p>}

      <form className="auth-form" action={formAction}>
        <label className="field">
          <span className="field-label">은행</span>
          <select name="bank_name" className="input" required>
            {BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <Field
          label="계좌번호"
          name="account_no"
          placeholder="숫자만 입력해 주세요"
          maxLength={32}
          required
        />
        <Field
          label="예금주"
          name="holder"
          placeholder="본인 명의 예금주"
          maxLength={50}
          required
        />
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "등록 중…" : "연결계좌 등록"}
        </Button>
      </form>
      <p className="muted mt-12">
        본인 명의 계좌만 등록할 수 있어요. 출금 시 이 계좌로 입금돼요.
      </p>
    </div>
  );
};

export default DepositLinked;
