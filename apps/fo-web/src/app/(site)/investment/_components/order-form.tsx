"use client";

import { useQuery } from "@tanstack/react-query";
import { useActionState, useState } from "react";

import { useReauth } from "@/features/auth";
import { api, fmtPoint, fmtWon } from "@/shared/api";
import { orderSchema, parseForm } from "@/shared/lib";
import { useAppNavigate } from "@/shared/lib";
import { useMe } from "@/shared/session";
import { AppLink } from "@/shared/ui";

import { fmtDate } from "./constants";
import { useInvestOrder } from "./use-invest-order";

import type { DepositAccount, PointBalance, ProductDetail, SuitabilityQuestions } from "./types";

type Props = {
  product: ProductDetail;
};

const OrderForm = ({ product }: Props) => {
  const me = useMe();
  const reauth = useReauth();
  const nav = useAppNavigate();
  const [man, setMan] = useState("");
  const [points, setPoints] = useState("");
  const [confirm, setConfirm] = useState("");

  const detail = useQuery<ProductDetail>({
    queryKey: ["product", product.id],
    queryFn: () => api.request<ProductDetail>("get", `/api/products/${product.id}`),
    enabled: !!me.data,
    initialData: product,
  });
  const deposit = useQuery<DepositAccount>({
    queryKey: ["deposit", "account"],
    queryFn: () => api.request<DepositAccount>("get", "/api/deposit/account"),
    enabled: !!me.data,
    retry: false,
  });
  const pointBalance = useQuery<PointBalance>({
    queryKey: ["points"],
    queryFn: () => api.request<PointBalance>("get", "/api/points"),
    enabled: !!me.data,
    retry: false,
  });
  const suitability = useQuery<SuitabilityQuestions>({
    queryKey: ["suitability"],
    queryFn: () => api.request<SuitabilityQuestions>("get", "/api/suitability-test"),
    enabled: !!me.data,
    retry: false,
  });

  const order = useInvestOrder({
    accountId: me.data?.id ?? 0,
    productId: product.id,
    reauth,
  });

  const [state, formAction] = useActionState<{ error: string } | null, FormData>(
    (_prev, formData) => {
      const parsed = parseForm(orderSchema, formData);
      if ("error" in parsed) return { error: parsed.error };
      void order.submit({
        amount: parsed.data.man * 10_000,
        use_points: parsed.data.points,
      });
      return null;
    },
    null,
  );

  if (me.isLoading) {
    return <div className="empty">불러오는 중이에요…</div>;
  }

  if (!me.data) {
    return (
      <div className="gate">
        <p>투자하려면 로그인이 필요해요</p>
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

  if (suitability.data && !suitability.data.valid_until) {
    return (
      <div className="gate">
        <p>
          투자적합성 테스트를 완료해야 투자할 수 있어요.
          <br />
          6개 문항이고 1분이면 끝나요.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => nav.push("/investment/suitability", "투자적합성 테스트")}
        >
          테스트 하러가기
        </button>
      </div>
    );
  }

  if (order.state.status === "done") {
    const result = order.state.result;
    const rows = result.schedule ?? [];
    return (
      <section className="card result-card">
        <h2>투자가 완료됐어요</h2>
        <p>투자번호 {result.investment_id}</p>
        <div className="order-lines">
          <div className="order-line">
            <span>투자금액</span>
            <strong>{fmtWon(result.amount)}</strong>
          </div>
          {result.points_used > 0 && (
            <div className="order-line">
              <span>사용 포인트</span>
              <strong>{fmtPoint(result.points_used)}</strong>
            </div>
          )}
          <div className="order-line">
            <span>예상 수익(세후)</span>
            <strong>{fmtWon(result.expected_net_return)}</strong>
          </div>
          <div className="order-line">
            <span>상환 회차</span>
            <strong>{rows.length}회</strong>
          </div>
          {rows[0] && (
            <div className="order-line">
              <span>첫 이자지급일</span>
              <strong>{fmtDate(rows[0].pay_date)}</strong>
            </div>
          )}
          {rows.length > 0 && (
            <div className="order-line">
              <span>마지막 상환일</span>
              <strong>{fmtDate(rows[rows.length - 1].pay_date)}</strong>
            </div>
          )}
        </div>
        <div className="result-actions">
          <AppLink href="/mypage" className="btn btn-outline">
            마이페이지
          </AppLink>
          <AppLink href="/investment" className="btn btn-primary">
            투자 더보기
          </AppLink>
        </div>
      </section>
    );
  }

  const amount = Math.round(Number(man) * 10_000);
  const my = detail.data?.my;
  const depositAmt = my?.deposit ?? deposit.data?.deposit;
  const investable = my?.investable;
  const pointAmt = pointBalance.data?.balance;
  const orderError = order.state.status === "failed" ? order.state.error : null;

  return (
    <>
      <div className="order-lines">
        {depositAmt !== undefined && (
          <div className="order-line">
            <span>나의 예치금</span>
            <strong>{fmtWon(depositAmt)}</strong>
          </div>
        )}
        {investable !== undefined && (
          <div className="order-line">
            <span>투자 가능 금액</span>
            <strong>{fmtWon(investable)}</strong>
          </div>
        )}
        <div className="order-line">
          <span>잔여 모집금액</span>
          <strong>{fmtWon(detail.data?.remaining_amount ?? product.remaining_amount)}</strong>
        </div>
        {pointAmt !== undefined && (
          <div className="order-line">
            <span>보유 포인트</span>
            <strong>{fmtPoint(pointAmt)}</strong>
          </div>
        )}
      </div>

      <form className="order-form" action={formAction}>
        <label className="field">
          <span className="field-label">투자 금액</span>
          <span className="unit-input">
            <input
              className="input"
              name="man"
              inputMode="numeric"
              value={man}
              onChange={(e) => setMan(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
            />
            <em>만원</em>
          </span>
          {amount > 0 && <span className="field-hint">{fmtWon(amount)}</span>}
        </label>
        {pointAmt !== undefined && pointAmt > 0 && (
          <label className="field">
            <span className="field-label">사용할 포인트 (선택)</span>
            <span className="unit-input">
              <input
                className="input"
                name="points"
                inputMode="numeric"
                value={points}
                onChange={(e) => setPoints(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="0"
              />
              <em>P</em>
            </span>
            <span className="field-hint">보유 {fmtPoint(pointAmt)}</span>
          </label>
        )}
        <label className="field">
          <span className="field-label">
            투자 원금과 수익이 보장되지 않음을 확인했어요. 동의하면 “네”를 입력해 주세요
          </span>
          <input
            className="input"
            name="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="네"
            autoComplete="off"
          />
        </label>
        {(state?.error || orderError) && (
          <p className="form-error">
            {state?.error ?? orderError?.text}{" "}
            {orderError?.code === "SUITABILITY_REQUIRED" && (
              <AppLink href="/investment/suitability">테스트 하러가기</AppLink>
            )}
          </p>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={
            order.pending ||
            (detail.data?.status ?? product.status) !== "recruiting"
          }
        >
          {order.pending ? "처리 중이에요…" : "투자하기"}
        </button>
      </form>
    </>
  );
};

export default OrderForm;
