"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useActionState } from "react";

import { api } from "@/shared/api";
import { adminSeedSchema, parseForm } from "@/shared/lib";
import { errMsg } from "@/shared/lib";

import { STATUS_LABEL } from "../_components";

import type { components } from "@dailyfunding/api-client";

type SeedResult = components["schemas"]["SeedProductsResponse"];

const SeedPage = () => {
  const qc = useQueryClient();
  const [state, formAction, pending] = useActionState<
    { error: string } | { result: SeedResult } | null,
    FormData
  >(async (_prev, formData) => {
    const parsed = parseForm(adminSeedSchema, formData);
    if ("error" in parsed) return { error: parsed.error };
    const body: components["schemas"]["SeedProductsRequest"] = {
      count: parsed.data.count ?? 10,
    };
    if (parsed.data.status) body.status = parsed.data.status as components["schemas"]["StatusEnum"];
    if (parsed.data.rate_min !== undefined) body.rate_min = parsed.data.rate_min;
    if (parsed.data.rate_max !== undefined) body.rate_max = parsed.data.rate_max;
    if (parsed.data.amount_min !== undefined) body.amount_min = parsed.data.amount_min;
    if (parsed.data.amount_max !== undefined) body.amount_max = parsed.data.amount_max;
    if (parsed.data.term_min !== undefined) body.term_min = parsed.data.term_min;
    if (parsed.data.term_max !== undefined) body.term_max = parsed.data.term_max;
    if (parsed.data.seed !== undefined) body.seed = parsed.data.seed;
    try {
      const result = await api.post("/api/admin/seed/products", body);
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      return { result };
    } catch (e) {
      return { error: errMsg(e) };
    }
  }, null);

  return (
    <>
      <div className="admin-head">
        <h1>시드 생성</h1>
      </div>
      <p className="admin-card-desc" style={{ marginBottom: 20 }}>
        가상 투자 상품을 대량으로 생성해요. 비우면 기본값이 적용돼요
      </p>
      <form action={formAction} style={{ maxWidth: 480 }}>
        <div className="form-row">
          <label className="field">
            <span className="field-label">개수 (기본 10)</span>
            <input className="input" name="count" type="number" min="1" placeholder="10" />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">상태 고정 (비우면 랜덤)</span>
            <select className="input" name="status" defaultValue="">
              <option value="">랜덤</option>
              {["scheduled", "recruiting", "recruited"].map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">금리 범위 (%) — 기본 6.0 ~ 15.0</span>
            <div className="admin-actions">
              <input className="input" name="rate_min" type="number" step="0.1" placeholder="6.0" />
              <input
                className="input"
                name="rate_max"
                type="number"
                step="0.1"
                placeholder="15.0"
              />
            </div>
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">모집금액 범위 (원) — 기본 1천만 ~ 5억</span>
            <div className="admin-actions">
              <input
                className="input"
                name="amount_min"
                type="number"
                step="10000"
                placeholder="10000000"
              />
              <input
                className="input"
                name="amount_max"
                type="number"
                step="10000"
                placeholder="500000000"
              />
            </div>
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">기간 범위 (개월) — 기본 3 ~ 24</span>
            <div className="admin-actions">
              <input className="input" name="term_min" type="number" min="1" placeholder="3" />
              <input className="input" name="term_max" type="number" min="1" placeholder="24" />
            </div>
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">난수 시드 (재현용, 선택)</span>
            <input className="input" name="seed" type="number" />
          </label>
        </div>
        {state && "error" in state && <p className="form-error">{state.error}</p>}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          생성
        </button>
      </form>
      {state && "result" in state && (
        <pre className="admin-result" style={{ maxWidth: 480 }}>
          {`${state.result.created}개 생성됐어요\n상품 ID: ${state.result.ids.join(", ")}`}
        </pre>
      )}
    </>
  );
};

export default SeedPage;
