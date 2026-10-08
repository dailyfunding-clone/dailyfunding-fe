"use client";

import { Button } from "@dailyfunding/design-system/components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActionState, useState } from "react";

import { AuthGate } from "@/features/auth";
import { ReauthProvider, useReauth } from "@/features/auth";
import { api, apiFetch, fmtMan } from "@/shared/api";
import { gradeRequestSchema, parseForm, type FormState } from "@/shared/lib";
import { useDocumentTitle } from "@/shared/lib";
import { useMe } from "@/shared/session";

import { apiErrorMessage, GRADE_LABELS, GRADE_LIMIT_TABLE, GRADE_REQUEST_STATUS_LABELS } from "../_components";
import { fmtDate } from "../_components";

import "../mypage.scss";


type GradeInfo = {
  grade: string;
  limits: {
    total: number | null;
    real_estate: number | null;
    same_borrower: number | null;
    per_product_pct: number | null;
  };
  used: {
    total: number;
    real_estate: number;
  };
};

type GradeHistoryItem = {
  id: number;
  to_grade: string;
  status: string;
  created_at: string;
  decided_at: string | null;
};

const fmtLimit = (n: number | null) => (n === null ? "무제한" : fmtMan(n));

const GradePage = () => {
  useDocumentTitle("등급정보");
  return (
    <AuthGate>
      <Grade />
    </AuthGate>
  );
};

const Grade = () => {
  const me = useMe();
  const grade = useQuery<GradeInfo>({
    queryKey: ["me-grade"],
    queryFn: () => api.request<GradeInfo>("get", "/api/me/grade"),
  });
  const history = useQuery<{ results: GradeHistoryItem[] }>({
    queryKey: ["me-grade-history"],
    queryFn: () =>
      api.request<{ results: GradeHistoryItem[] }>(
        "get",
        "/api/me/grade/history",
      ),
  });

  if (grade.isPending) {
    return (
      <div className="container">
        <div className="empty">불러오는 중…</div>
      </div>
    );
  }
  if (!grade.data) {
    return (
      <div className="container">
        <div className="empty">등급 정보를 불러오지 못했어요</div>
      </div>
    );
  }

  const { limits, used } = grade.data;

  return (
    <div className="container">
      <h1 className="page-title">등급정보</h1>

      <div className="card mb-16">
        <div className="grade-current">
          <strong>{GRADE_LABELS[grade.data.grade] ?? grade.data.grade}</strong>
          <span className="muted">현재 등급</span>
        </div>
        <div className="stat-rows">
          <div className="row-between">
            <span>총 투자 한도</span>
            <strong>
              {fmtLimit(limits.total)}
              {limits.total !== null &&
                ` (사용 ${fmtMan(used.total)})`}
            </strong>
          </div>
          <div className="row-between">
            <span>부동산 상품 한도</span>
            <strong>
              {fmtLimit(limits.real_estate)}
              {limits.real_estate !== null &&
                ` (사용 ${fmtMan(used.real_estate)})`}
            </strong>
          </div>
          <div className="row-between">
            <span>동일 차입자 한도</span>
            <strong>{fmtLimit(limits.same_borrower)}</strong>
          </div>
          <div className="row-between">
            <span>상품별 한도</span>
            <strong>
              {limits.per_product_pct === null
                ? "—"
                : `모집금액의 ${Math.round(limits.per_product_pct * 100)}%`}
            </strong>
          </div>
        </div>
      </div>

      <div className="mypage-section">
        <h2>등급별 투자 한도</h2>
        <div className="card card-tight">
          <table className="table">
            <thead>
              <tr>
                <th>등급</th>
                <th>총 한도</th>
                <th>부동산</th>
                <th>동일 차입자</th>
              </tr>
            </thead>
            <tbody>
              {GRADE_LIMIT_TABLE.map((g) => (
                <tr key={g.grade}>
                  <td>
                    {g.label}
                    {grade.data.grade === g.grade && (
                      <span className="badge badge-accent"> 현재</span>
                    )}
                  </td>
                  <td>{fmtLimit(g.total)}</td>
                  <td>{fmtLimit(g.realEstate)}</td>
                  <td>{fmtLimit(g.sameBorrower)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mypage-section">
        <h2>등급 변경 신청</h2>
        <ReauthProvider
          title="등급 변경 비밀번호 확인"
          description="등급 변경을 신청하려면 비밀번호를 한 번 더 입력해 주세요."
        >
          <GradeRequestForm />
        </ReauthProvider>
      </div>

      <div className="mypage-section">
        <h2>원스톱 한도심사</h2>
        <LimitAssessment verified={me.data?.identity_verified ?? false} />
      </div>

      <div className="mypage-section">
        <h2>신청 이력</h2>
        {history.isPending ? (
          <div className="empty">불러오는 중…</div>
        ) : (history.data?.results.length ?? 0) === 0 ? (
          <div className="empty">신청 이력이 없어요</div>
        ) : (
          <div className="card card-tight">
            <ul className="list">
              {history.data?.results.map((g) => (
                <li key={g.id} className="hist-row">
                  <div className="hist-row-main">
                    <span>{GRADE_LABELS[g.to_grade] ?? g.to_grade}</span>
                    <small>{fmtDate(g.created_at)} 신청</small>
                  </div>
                  <span
                    className={`badge${
                      g.status === "approved"
                        ? " badge-success"
                        : g.status === "rejected"
                          ? " badge-danger"
                          : ""
                    }`}
                  >
                    {GRADE_REQUEST_STATUS_LABELS[g.status] ?? g.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const GradeRequestForm = () => {
  const reauth = useReauth();
  const queryClient = useQueryClient();
  const [done, setDone] = useState(false);

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      setDone(false);
      const parsed = parseForm(gradeRequestSchema, formData);
      if ("error" in parsed) return { error: parsed.error };
      const file = formData.get("document");
      if (file instanceof File && file.size === 0) formData.delete("document");
      for (let attempt = 0; attempt < 2; attempt++) {
        const token = await reauth?.ensure(attempt > 0);
        if (!token) return { error: "본인 인증이 취소됐어요" };
        const res = await apiFetch("/api/me/grade-request", {
          method: "POST",
          headers: { "X-Reauth-Token": token },
          body: formData,
        });
        if (res.ok) {
          setDone(true);
          queryClient.invalidateQueries({ queryKey: ["me-grade-history"] });
          queryClient.invalidateQueries({ queryKey: ["me-grade"] });
          queryClient.invalidateQueries({ queryKey: ["me"] });
          return null;
        }
        const body = (await res.json().catch(() => null)) as {
          code?: string;
          message?: string;
        } | null;
        if (body?.code === "REAUTH_REQUIRED") {
          reauth?.reset();
          continue;
        }
        return { error: body?.message ?? "신청에 실패했어요" };
      }
      return { error: "잠시 후 다시 시도해 주세요" };
    },
    null,
  );

  return (
    <div className="card">
      {done && (
        <p className="ok-msg">등급 변경을 신청했어요. 심사 후 반영돼요.</p>
      )}
      <form className="auth-form" action={formAction}>
        <label className="field">
          <span className="field-label">변경할 등급</span>
          <select name="to_grade" className="input" required>
            <option value="income_eligible">소득적격투자자</option>
            <option value="professional">전문투자자</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">자격 서류 (선택)</span>
          <input type="file" name="document" className="input" />
        </label>
        {state?.error && <p className="form-error">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "신청 중…" : "등급 변경 신청"}
        </Button>
      </form>
      <p className="muted mt-12">
        소득적격·전문투자자는 자격 서류 심사 후 승인돼요.
      </p>
    </div>
  );
};

const LimitAssessment = ({ verified }: { verified: boolean }) => {
  const queryClient = useQueryClient();
  const [done, setDone] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      setDone(null);
      const file = formData.get("document");
      if (file instanceof File && file.size === 0) formData.delete("document");
      try {
        const res = await apiFetch("/api/me/limit-assessment", {
          method: "POST",
          body: formData,
        });
        const body = (await res.json().catch(() => null)) as {
          status?: string;
          message?: string;
        } | null;
        if (!res.ok) {
          return { error: body?.message ?? "심사 신청에 실패했어요" };
        }
        setDone(body?.status ?? "submitted");
        queryClient.invalidateQueries({ queryKey: ["me-grade-history"] });
        return null;
      } catch (err) {
        return { error: apiErrorMessage(err) };
      }
    },
    null,
  );

  if (!verified) {
    return (
      <div className="card">
        <p className="muted">
          원스톱 한도심사는 본인인증 후 이용할 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      {done && (
        <p className="ok-msg">
          한도심사를 접수했어요. 소득적격·전문투자자 자격을 검토해요.
        </p>
      )}
      <form className="auth-form" action={formAction}>
        <label className="field">
          <span className="field-label">소득 서류 (선택)</span>
          <input type="file" name="document" className="input" />
        </label>
        {state?.error && <p className="form-error">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "접수 중…" : "한도심사 신청"}
        </Button>
      </form>
      <p className="muted mt-12">
        시뮬레이션 심사예요. 실제 소득 확인은 이뤄지지 않아요.
      </p>
    </div>
  );
};

export default GradePage;
