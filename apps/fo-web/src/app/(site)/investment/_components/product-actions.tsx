"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { ApiRequestError, api } from "@/shared/api";
import { useAppNavigate } from "@/shared/lib";
import { useMe } from "@/shared/session";

import ScheduleModal from "./schedule-modal";

import type { ProductDetail } from "./types";

const MSG_MS = 3_000;

type Props = {
  product: ProductDetail;
};

const ProductActions = ({ product }: Props) => {
  const me = useMe();
  const nav = useAppNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (msgTimer.current) clearTimeout(msgTimer.current);
    },
    [],
  );

  const flash = (text: string) => {
    setMsg(text);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(""), MSG_MS);
  };

  const addCart = useMutation({
    mutationFn: () => api.post("/api/cart", { product_id: product.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      flash("장바구니에 담았어요");
    },
    onError: (e) => {
      flash(
        e instanceof ApiRequestError && e.code === "UNAUTHORIZED"
          ? "로그인이 필요해요"
          : "장바구니 담기에 실패했어요",
      );
    },
  });

  const onCart = () => {
    if (!me.data) {
      nav.push("/auth/signin", "로그인");
      return;
    }
    addCart.mutate();
  };

  const orderable = product.status === "recruiting";

  return (
    <>
      <div className="detail-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={onCart}
          disabled={addCart.isPending}
        >
          {msg || "장바구니"}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setModalOpen(true)}
        >
          예상수익
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!orderable}
          onClick={() => nav.push(`/investment/${product.id}/order`, "투자하기")}
        >
          {orderable
            ? "투자하기"
            : product.status === "scheduled"
              ? "모집 예정이에요"
              : "모집이 마감됐어요"}
        </button>
      </div>
      <ScheduleModal
        productId={product.id}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default ProductActions;
