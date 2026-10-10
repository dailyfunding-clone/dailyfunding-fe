"use client";

import { Field, Steps } from "@dailyfunding/design-system/components";
import { useActionState, useState } from "react";

import { apiFetch, idempotencyKey } from "@/shared/api";
import {
  loanApplyFundsSchema,
  loanApplyInfoSchema,
  parseForm,
  type FormState,
} from "@/shared/lib";
import { AppLink } from "@/shared/ui";

const STEP_LABELS = ["기본 정보", "자금 정보"];

const MAX_FILES = 6;

type BasicInfo = {
  name: string;
  phone: string;
  email: string;
  company: string;
  biz_type: string;
  biz_no: string;
};

const ApplyForm = () => {
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState<BasicInfo | null>(null);
  const [marketing, setMarketing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [doneId, setDoneId] = useState<number | null>(null);
  const [submitKey, setSubmitKey] = useState(idempotencyKey);

  const [infoState, infoAction] = useActionState<FormState, FormData>(
    (_prev, formData) => {
      const parsed = parseForm(loanApplyInfoSchema, formData);
      if ("error" in parsed) return { error: parsed.error };
      setMarketing(parsed.data.agree_marketing === "on");
      setInfo({
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        company: parsed.data.company,
        biz_type: parsed.data.biz_type,
        biz_no: parsed.data.biz_no,
      });
      setStep(1);
      return null;
    },
    null,
  );

  const pickFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    if (picked.length > MAX_FILES) {
      setFileError(`첨부파일은 최대 ${MAX_FILES}개까지 가능해요`);
    } else {
      setFileError("");
    }
    setFiles(picked.slice(0, MAX_FILES));
  };

  const [fundsState, fundsAction, pending] = useActionState<
    FormState,
    FormData
  >(async (_prev, formData) => {
    if (!info) return { error: "기본 정보를 다시 입력해 주세요" };
    const parsed = parseForm(loanApplyFundsSchema, formData);
    if ("error" in parsed) return { error: parsed.error };
    const body = new FormData();
    Object.entries(info).forEach(([k, v]) => body.set(k, v));
    body.set("amount", String(parsed.data.amount));
    body.set("term_months", String(parsed.data.term_months));
    body.set("purpose", parsed.data.purpose);
    body.set("memo", parsed.data.memo);
    body.set("agree_privacy", "true");
    body.set("agree_marketing", marketing ? "true" : "false");
    files.forEach((f) => body.append("attachments", f));
    try {
      const res = await apiFetch("/api/loans/applications", {
        method: "POST",
        body,
        idempotencyKey: submitKey,
      });
      const json = (await res.json()) as {
        application_id?: number;
        message?: string;
      };
      if (!res.ok) {
        return {
          error:
            json.message ?? "신청에 실패했어요. 잠시 후 다시 시도해 주세요",
        };
      }
      setDoneId(json.application_id ?? 0);
      setSubmitKey(idempotencyKey());
      return null;
    } catch {
      return { error: "네트워크 오류가 발생했어요. 다시 시도해 주세요" };
    }
  }, null);

  if (doneId !== null) {
    return (
      <div className="apply-done">
        <h2>신청이 접수됐어요</h2>
        <p>
          접수번호 {doneId}
          <br />
          심사 큐에 등록됐어요. 담당자가 확인 후 빠르게 연락드릴게요.
        </p>
        <AppLink href="/loan" className="btn btn-primary">
          대출 상품 보기
        </AppLink>
      </div>
    );
  }

  return (
    <>
      <Steps items={STEP_LABELS} current={step} />
      {step === 0 ? (
        <form action={infoAction}>
          <div className="form-row">
            <Field label="이름" name="name" required />
          </div>
          <div className="form-row">
            <Field
              label="연락처"
              name="phone"
              type="tel"
              placeholder="- 없이 입력해 주세요"
              required
            />
          </div>
          <div className="form-row">
            <Field
              label="이메일"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="form-row">
            <Field label="회사명" name="company" placeholder="선택 입력" />
          </div>
          <div className="form-row">
            <label className="field">
              <span className="field-label">사업자 유형</span>
              <select className="input" name="biz_type" defaultValue="">
                <option value="">개인(사업자 아님)</option>
                <option value="개인사업자">개인사업자</option>
                <option value="법인사업자">법인사업자</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <Field
              label="사업자등록번호"
              name="biz_no"
              placeholder="사업자인 경우 입력해 주세요"
            />
          </div>
          <div className="apply-checks">
            <label>
              <input type="checkbox" name="agree_privacy" />
              <span>
                <b>(필수)</b> 개인정보 수집·이용에 동의해요
              </span>
            </label>
            <label>
              <input type="checkbox" name="agree_marketing" />
              <span>(선택) 대출 상품·혜택 소식을 받아볼게요</span>
            </label>
          </div>
          {infoState?.error && (
            <p className="form-error" role="alert">{infoState.error}</p>
          )}
          <button type="submit" className="btn btn-primary">
            다음
          </button>
        </form>
      ) : (
        <form action={fundsAction}>
          <div className="form-row">
            <Field
              label="필요 자금 (원)"
              name="amount"
              type="number"
              min={1}
              placeholder="예) 50000000"
              required
            />
          </div>
          <div className="form-row">
            <Field
              label="대출 기간 (개월)"
              name="term_months"
              type="number"
              min={1}
              max={60}
              placeholder="12"
              required
            />
          </div>
          <div className="form-row">
            <Field
              label="자금 용도"
              name="purpose"
              placeholder="예) 사업 운영 자금"
            />
          </div>
          <div className="form-row">
            <label className="field">
              <span className="field-label">요청 내용</span>
              <textarea
                name="memo"
                placeholder="상담 시 전달하고 싶은 내용을 적어 주세요"
              />
            </label>
          </div>
          <div className="form-row">
            <label className="field">
              <span className="field-label">
                첨부파일 (최대 {MAX_FILES}개)
              </span>
              <input
                type="file"
                multiple
                onChange={(e) => pickFiles(e.target.files)}
              />
            </label>
            {files.length > 0 && (
              <p className="apply-file">
                {files.map((f) => f.name).join(", ")}
              </p>
            )}
            {fileError && <p className="form-error" role="alert">{fileError}</p>}
          </div>
          {fundsState?.error && (
            <p className="form-error" role="alert">{fundsState.error}</p>
          )}
          <div className="apply-nav">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setStep(0)}
            >
              이전
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "신청 중..." : "신청하기"}
            </button>
          </div>
        </form>
      )}
    </>
  );
};

export default ApplyForm;
