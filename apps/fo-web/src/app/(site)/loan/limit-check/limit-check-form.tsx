"use client";

import { Field } from "@dailyfunding/design-system/components";
import { useActionState, useState } from "react";

import { api, fmtWon } from "@/shared/api";
import { limitCheckSchema, parseForm } from "@/shared/lib";
import { AppLink } from "@/shared/ui";

import { rateText } from "../types";

type LimitResult = {
  limit: number;
  rate_range: string[];
};

const TYPES = [
  { key: "mortgage", label: "아파트 담보", desc: "아파트를 소유하고 있어요" },
  { key: "credit", label: "신용", desc: "사업자 정보로 조회해요" },
] as const;

const LimitCheckForm = ({ loanId }: { loanId: number | null }) => {
  const [nonce, setNonce] = useState(0);
  return (
    <LimitCheckInner
      key={nonce}
      loanId={loanId}
      onReset={() => setNonce((n) => n + 1)}
    />
  );
};

const LimitCheckInner = ({
  loanId,
  onReset,
}: {
  loanId: number | null;
  onReset: () => void;
}) => {
  const [type, setType] = useState<"mortgage" | "credit">("mortgage");
  const [state, formAction, pending] = useActionState<
    { error: string } | { result: LimitResult } | null,
    FormData
  >(async (_prev, formData) => {
    const parsed = parseForm(limitCheckSchema, formData);
    if ("error" in parsed) return { error: parsed.error };
    try {
      const result = await api.request<LimitResult>(
        "post",
        "/api/loans/limit-check",
        parsed.data,
      );
      return { result };
    } catch {
      return {
        error: "조회에 실패했어요. 입력값을 확인하고 다시 시도해 주세요",
      };
    }
  }, null);

  if (state && "result" in state) {
    const result = state.result;
    return (
      <div className="limit-result">
        <dl>
          <dt>예상 대출 한도</dt>
          <dd>{fmtWon(result.limit)}</dd>
        </dl>
        <p className="limit-result-rate">
          예상 금리 {rateText(result.rate_range)}
        </p>
        <p className="limit-result-note">
          모의 조회 결과예요. 신용도에는 영향이 없어요.
        </p>
        <div className="limit-actions">
          <AppLink
            href={loanId ? `/loan/${loanId}/apply` : "/loan"}
            className="btn btn-primary"
          >
            사전심사 신청하기
          </AppLink>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onReset}
          >
            다시 조회하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="type" value={type} />
      <div className="limit-type">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={type === t.key ? "is-active" : undefined}
            onClick={() => setType(t.key)}
          >
            {t.label}
            <small>{t.desc}</small>
          </button>
        ))}
      </div>
      {type === "mortgage" ? (
        <>
          <div className="form-row">
            <Field
              label="아파트 단지명"
              name="complex"
              placeholder="예) 래미안 데일리"
              required
            />
          </div>
          <div className="form-row">
            <Field
              label="전용면적 (㎡)"
              name="area"
              type="number"
              min={1}
              placeholder="84"
              required
            />
          </div>
          <div className="limit-grid">
            <div className="form-row">
              <Field label="동" name="dong" placeholder="101" required />
            </div>
            <div className="form-row">
              <Field label="호" name="ho" placeholder="702" required />
            </div>
          </div>
        </>
      ) : (
        <div className="form-row">
          <Field
            label="사업자등록번호"
            name="biz_no"
            placeholder="- 없이 입력해 주세요"
            required
          />
        </div>
      )}
      {state && "error" in state && (
        <p className="form-error" role="alert">{state.error}</p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "조회 중..." : "한도 조회하기"}
      </button>
      <p className="limit-form-note">신용점수에 영향 없이 조회할 수 있어요</p>
    </form>
  );
};

export default LimitCheckForm;
