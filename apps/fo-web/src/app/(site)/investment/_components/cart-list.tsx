"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, fmtMan } from "@/shared/api";
import { useAppNavigate } from "@/shared/lib";
import { useMe } from "@/shared/session";
import { AppLink } from "@/shared/ui";

import { STATUS_LABEL } from "./constants";

import type { CartList } from "./types";

const CartListPanel = () => {
  const me = useMe();
  const nav = useAppNavigate();
  const queryClient = useQueryClient();

  const cart = useQuery<CartList>({
    queryKey: ["cart"],
    queryFn: () => api.request<CartList>("get", "/api/cart"),
    enabled: !!me.data,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete("/api/cart/{id}", { path: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (me.isLoading || (me.data && cart.isLoading)) {
    return <div className="empty">불러오는 중이에요…</div>;
  }

  if (!me.data) {
    return (
      <div className="gate">
        <p>로그인하면 장바구니를 볼 수 있어요</p>
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

  const items = cart.data?.results ?? [];
  if (items.length === 0) {
    return (
      <div className="empty">
        담긴 상품이 없어요
        <div style={{ marginTop: 16 }}>
          <AppLink href="/investment" className="btn btn-primary inv-more">
            투자 상품 보러가기
          </AppLink>
        </div>
      </div>
    );
  }

  const total = items.reduce((s, i) => s + i.target_amount, 0);

  return (
    <>
      <div className="stack">
        {items.map((item) => (
          <div key={item.id} className="card cart-card">
            <AppLink href={`/investment/${item.product_id}`} className="cart-card-main">
              <div className="product-card-badges">
                {item.closed ? (
                  <span className="badge badge-danger">마감</span>
                ) : (
                  <span className="badge badge-accent">
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                )}
              </div>
              <h3>{item.name}</h3>
              <p className="cart-card-meta">
                연 {item.annual_rate}% · {item.term_months}개월 · 잔여{" "}
                {fmtMan(item.remaining_amount)}
              </p>
              <small className="cart-card-meta">{item.product_no}</small>
            </AppLink>
            <button
              type="button"
              className="cart-remove"
              onClick={() => remove.mutate(item.id)}
              disabled={remove.isPending}
            >
              삭제
            </button>
          </div>
        ))}
      </div>
      <div className="cart-total">
        <span>{items.length}개 상품</span>
        <strong>모집금액 합계 {fmtMan(total)}</strong>
      </div>
    </>
  );
};

export default CartListPanel;
