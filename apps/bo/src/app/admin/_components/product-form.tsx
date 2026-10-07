"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useActionState } from "react";

import { api } from "@/shared/api";
import { apiPatch } from "@/shared/api";
import { adminProductSchema, parseForm, type FormState } from "@/shared/lib";
import { errMsg } from "@/shared/lib";

import AdminModal from "./admin-modal";
import { REPAY_LABEL, TYPE_LABEL } from "./constants";

export type AdminProduct = {
  id: number;
  product_no: string;
  name: string;
  type: string;
  annual_rate: string;
  term_months: number;
  target_amount: number;
  raised_amount: number;
  status: string;
};

const TYPE_OPTIONS = Object.entries(TYPE_LABEL);
const REPAY_OPTIONS = Object.entries(REPAY_LABEL);

const ProductForm = ({
  product,
  onClose,
}: {
  product: AdminProduct | null;
  onClose: () => void;
}) => {
  const qc = useQueryClient();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const parsed = parseForm(adminProductSchema, formData);
      if ("error" in parsed) return { error: parsed.error };
      const { product_no, platform_fee_rate, repay_day, borrower_name, tags, ...rest } =
        parsed.data;
      const body: Record<string, unknown> = {
        ...rest,
        tags: tags
          ? tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };
      if (product_no) body.product_no = product_no;
      if (platform_fee_rate) body.platform_fee_rate = platform_fee_rate;
      if (repay_day !== undefined) body.repay_day = repay_day;
      if (borrower_name) body.borrower_name = borrower_name;
      try {
        if (product) {
          await apiPatch(`/api/admin/products/${product.id}`, body);
        } else {
          await api.request("post", "/api/admin/products", body);
        }
        qc.invalidateQueries({ queryKey: ["admin", "products"] });
        onClose();
        return null;
      } catch (e) {
        return { error: errMsg(e) };
      }
    },
    null,
  );

  return (
    <AdminModal title={product ? "상품 수정" : "신규 상품 등록"} onClose={onClose}>
      <form action={formAction}>
        <div className="form-row">
          <label className="field">
            <span className="field-label">상품명 *</span>
            <input
              className="input"
              name="name"
              defaultValue={product?.name}
              required
            />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">상품번호 (비우면 자동)</span>
            <input
              className="input"
              name="product_no"
              defaultValue={product?.product_no}
            />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">유형 *</span>
            <select
              className="input"
              name="type"
              defaultValue={product?.type ?? "personal_credit"}
              required
            >
              {TYPE_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">연금리 (%) *</span>
            <input
              className="input"
              name="annual_rate"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.annual_rate}
              required
            />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">기간 (개월) *</span>
            <input
              className="input"
              name="term_months"
              type="number"
              min="1"
              defaultValue={product?.term_months}
              required
            />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">모집금액 (원) *</span>
            <input
              className="input"
              name="target_amount"
              type="number"
              min="1"
              step="10000"
              defaultValue={product?.target_amount}
              required
            />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">상환방식 *</span>
            <select
              className="input"
              name="repay_type"
              defaultValue="equal_installment"
              required
            >
              {REPAY_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">플랫폼 수수료율 (%)</span>
            <input
              className="input"
              name="platform_fee_rate"
              type="number"
              step="0.01"
              min="0"
            />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">상환일 (매월 1~28일)</span>
            <input
              className="input"
              name="repay_day"
              type="number"
              min="1"
              max="28"
            />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">차주 ID *</span>
            <input className="input" name="borrower_id" required />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">차주명</span>
            <input className="input" name="borrower_name" />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">태그 (쉼표 구분)</span>
            <input
              className="input"
              name="tags"
              placeholder="조기상환가능, 보증보험"
            />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span className="field-label">유의사항</span>
            <textarea className="input" name="notice" />
          </label>
        </div>
        {state?.error && <p className="form-error">{state.error}</p>}
        <div className="admin-modal-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={pending}
          >
            취소
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={pending}
          >
            {product ? "수정" : "등록"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};

export default ProductForm;
