"use client";

import { bridge, isInWebView } from "@dailyfunding/bridge";
import { Button, Field, Steps } from "@dailyfunding/design-system/components";
import ky from "ky";
import { useActionState, useState } from "react";

import {
  parseForm,
  signupAccountSchema,
  signupVerifySchema,
  useAppNavigate,
  type FormState,
} from "@/shared/lib";

import SignupTerms from "./signup-terms";

const STEP_LABELS = ["계정 정보", "본인인증"];

const REQUIRED_TERMS = [
  "service",
  "investment",
  "privacy",
  "credit_info",
  "electronic_finance",
];

const BORROWER_EXTRA_TERMS = ["credit_inquiry", "loan_terms"];

type Props = {
  memberType: "personal" | "corporate";
  role?: "investor" | "borrower";
};

const SignupFlow = ({ memberType, role = "investor" }: Props) => {
  const nav = useAppNavigate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [taken, setTaken] = useState(false);
  const [account, setAccount] = useState<{
    email: string;
    password: string;
    referrer?: string;
    agreements: { term: string; agreed: boolean }[];
  } | null>(null);

  const [nextState, nextAction] = useActionState<FormState, FormData>(
    (_prev, formData) => {
      const parsed = parseForm(signupAccountSchema, formData);
      if ("error" in parsed) return { error: parsed.error };
      const checked = new Set(formData.getAll("term").map(String));
      const required =
        role === "borrower"
          ? [...REQUIRED_TERMS, ...BORROWER_EXTRA_TERMS]
          : REQUIRED_TERMS;
      if (!required.every((t) => checked.has(t))) {
        return { error: "필수 약관에 모두 동의해 주세요" };
      }
      const agreements = formData
        .getAll("term")
        .map((t) => ({ term: String(t), agreed: true }));
      setAccount({
        email: parsed.data.email,
        password: parsed.data.password,
        referrer: parsed.data.referrer || undefined,
        agreements,
      });
      setStep(1);
      return null;
    },
    null,
  );

  const [verifyState, verifyAction, pending] = useActionState<
    FormState,
    FormData
  >(async (_prev, formData) => {
    if (!account) return { error: "계정 정보를 다시 입력해 주세요" };
    setTaken(false);
    const parsed = parseForm(signupVerifySchema, formData);
    if ("error" in parsed) return { error: parsed.error };
    try {
      if (memberType === "corporate") {
        const biz = parsed.data.businessNumber;
        if (!/^\d{10}$/.test(biz)) {
          return { error: "사업자등록번호 10자리를 입력해 주세요" };
        }
        const bizRes = await ky.post("/api/auth/business-number/verify", {
          json: { business_number: biz },
          throwHttpErrors: false,
        });
        const bizBody = (await bizRes.json().catch(() => null)) as {
          verified?: boolean;
        } | null;
        if (!bizRes.ok || !bizBody?.verified) {
          return { error: "등록되지 않은 사업자등록번호예요" };
        }
      }
      const signupRes = await ky.post(
        role === "borrower" ? "/api/auth/signup/borrower" : "/api/auth/signup",
        {
          json: {
            email: account.email,
            password: account.password,
            name: parsed.data.name,
            member_type: memberType,
            business_number:
              memberType === "corporate" ? parsed.data.businessNumber : "",
            referrer_email: account.referrer,
            agreements: account.agreements,
          },
          throwHttpErrors: false,
        },
      );
      if (!signupRes.ok) {
        const signupBody = (await signupRes.json().catch(() => null)) as {
          code?: string;
        } | null;
        if (signupBody?.code !== "EMAIL_TAKEN") {
          setAccount(null);
          setStep(0);
          return { error: "가입에 실패했어요. 이메일을 확인해 주세요" };
        }
        setTaken(true);
      }
      const res = await ky.post("/api/auth/identity/verify", {
        json: { ...parsed.data, email: account.email },
        credentials: "include",
        throwHttpErrors: false,
      });
      if (!res.ok) {
        return { error: "인증에 실패했어요. 정보를 확인해 주세요" };
      }
      setDone(true);
      return null;
    } catch {
      return { error: "잠시 후 다시 시도해 주세요" };
    }
  }, null);

  const registerPin = async () => {
    if (!account || !isInWebView()) return;
    const loginRes = await ky.post("/api/auth/login", {
      json: { email: account.email, password: account.password },
      credentials: "include",
      throwHttpErrors: false,
    });
    if (!loginRes.ok) return;
    const codeRes = await ky.post("/api/auth/app-code", {
      credentials: "include",
      throwHttpErrors: false,
    });
    if (!codeRes.ok) return;
    const { code } = (await codeRes.json()) as { code: string };
    bridge.exchangeAuthCode(code, "/auth/pin");
  };

  if (done) {
    return (
      <div className="auth-done">
        <h2 className="auth-question">가입이 완료됐어요</h2>
        {role === "borrower" && (
          <p className="auth-desc">
            대출 신청을 위해 연결계좌 등록이 필요해요
          </p>
        )}
        <div className="auth-actions">
          {memberType === "personal" && isInWebView() && (
            <Button onClick={registerPin}>간편비밀번호 등록하기</Button>
          )}
          <Button
            variant="outline"
            onClick={() => bridge.push("/auth/signin", "로그인")}
          >
            로그인하기
          </Button>
        </div>
      </div>
    );
  }

  if (step === 0) {
    return (
      <>
        <Steps items={STEP_LABELS} current={0} />
        <form key="account" className="auth-form" action={nextAction}>
          <Field
            label="이메일"
            type="email"
            name="email"
            placeholder="email@example.com"
            autoComplete="email"
            required
          />
          <Field
            label="비밀번호"
            type="password"
            name="password"
            placeholder="영문, 숫자, 특수문자 조합 8~15자"
            autoComplete="new-password"
            required
          />
          <Field
            label="비밀번호 확인"
            type="password"
            name="passwordConfirm"
            placeholder="비밀번호를 한 번 더 입력해 주세요"
            autoComplete="new-password"
            required
          />
          {memberType === "personal" && role === "investor" && (
            <Field label="추천인 이메일 (선택)" type="email" name="referrer" />
          )}
          <SignupTerms borrower={role === "borrower"} />
          {(nextState?.error ?? verifyState?.error) && (
            <p className="form-error">
              {nextState?.error ?? verifyState?.error}
            </p>
          )}
          <Button type="submit">다음</Button>
        </form>
      </>
    );
  }

  return (
    <>
      <Steps items={STEP_LABELS} current={1} />
      <form key="verify" className="auth-form" action={verifyAction} autoComplete="off">
        <Field
          label="이름"
          type="text"
          name="name"
          autoComplete="name"
          required
        />
        <Field
          label="생년월일"
          type="text"
          name="birth"
          inputMode="numeric"
          autoComplete="bday"
          maxLength={10}
          placeholder="8자리 (예: 19900101)"
          required
        />
        <Field
          label="휴대폰 번호"
          type="tel"
          name="phone"
          inputMode="tel"
          autoComplete="tel-national"
          maxLength={13}
          placeholder="- 없이 숫자만"
          required
        />
        {memberType === "corporate" && (
          <Field
            label="사업자등록번호"
            type="text"
            name="businessNumber"
            inputMode="numeric"
            autoComplete="off"
            maxLength={12}
            placeholder="- 없이 숫자 10자리"
            required
          />
        )}
        {taken && (
          <p className="form-error">
            이미 가입된 이메일이에요. 본인인증을 이어서 진행하거나{" "}
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => nav.push("/auth/signin", "로그인")}
            >
              로그인하기
            </button>
          </p>
        )}
        {verifyState?.error && (
          <p className="form-error">{verifyState.error}</p>
        )}
        <Button type="submit" disabled={pending}>
          인증하고 가입하기
        </Button>
      </form>
    </>
  );
};

export default SignupFlow;
