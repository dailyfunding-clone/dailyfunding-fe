"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { api } from "@/shared/api";
import { useAppNavigate } from "@/shared/lib";
import { useMe } from "@/shared/session";

import { fmtDate } from "./constants";

import type { SuitabilityQuestion, SuitabilityQuestions, SuitabilityResult } from "./types";

const SuitabilityTest = () => {
  const me = useMe();
  const nav = useAppNavigate();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<SuitabilityResult | null>(null);

  const test = useQuery<SuitabilityQuestions>({
    queryKey: ["suitability"],
    queryFn: () => api.request<SuitabilityQuestions>("get", "/api/suitability-test"),
    enabled: !!me.data,
  });

  const submit = useMutation({
    mutationFn: (questions: SuitabilityQuestion[]) =>
      api.request<SuitabilityResult>("post", "/api/suitability-test", {
        answers: questions.map((q) => ({
          seq: q.seq,
          choice: answers[q.seq],
        })),
      }),
    onSuccess: (r) => {
      setResult(r);
      queryClient.invalidateQueries({ queryKey: ["suitability"] });
    },
  });

  if (me.isLoading || (me.data && test.isLoading)) {
    return <div className="empty">불러오는 중이에요…</div>;
  }

  if (!me.data) {
    return (
      <div className="gate">
        <p>로그인이 필요해요</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => nav.push("/auth/signin", "로그인")}
        >
          로그인하기
        </button>
      </div>
    );
  }

  if (test.isError || !test.data) {
    return <div className="empty">문항을 불러오지 못했어요</div>;
  }

  if (result) {
    return (
      <div className="card result-card">
        {result.passed ? (
          <>
            <h2>투자할 수 있어요</h2>
            <p>
              테스트를 통과했어요
              {result.expires_at && ` · ${fmtDate(result.expires_at)}까지 유효해요`}
            </p>
            <div className="result-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => nav.push("/investment", "투자하기")}
              >
                투자하러 가기
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>아직 조금 부족해요</h2>
            <p>틀린 문항이 있어요. 온투업 투자의 위험성을 다시 확인하고 재응시해 주세요.</p>
            <div className="result-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => nav.push("/investment", "투자하기")}
              >
                나중에
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
              >
                다시 응시하기
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  const total = test.data.questions.length;
  const done = Object.keys(answers).length;

  return (
    <>
      {test.data.valid_until && (
        <div className="my-block">
          <div className="my-block-row">
            <span>이미 통과한 상태예요</span>
            <strong>{fmtDate(test.data.valid_until)}까지 유효</strong>
          </div>
        </div>
      )}
      <p className="field-hint" style={{ marginBottom: 16 }}>
        모든 문항이 정답이어야 통과해요 ({done}/{total})
      </p>
      {test.data.questions.map((q) => (
        <div key={q.seq} className="suit-q">
          <p className="suit-q-seq">Q{q.seq}</p>
          <p className="suit-q-text">{q.text}</p>
          <div className="suit-opts">
            {q.answer_options.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`suit-opt${answers[q.seq] === opt ? " is-active" : ""}`}
                onClick={() => setAnswers((prev) => ({ ...prev, [q.seq]: opt }))}
              >
                {opt === "O" ? "O 맞아요" : opt === "X" ? "X 아니에요" : opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      {submit.isError && (
        <p className="form-error" role="alert">
          제출에 실패했어요. 다시 시도해 주세요
        </p>
      )}
      <button
        type="button"
        className="btn btn-primary"
        style={{ width: "100%", marginTop: 8 }}
        disabled={done < total || submit.isPending}
        onClick={() => submit.mutate(test.data.questions)}
      >
        제출하기
      </button>
    </>
  );
};

export default SuitabilityTest;
