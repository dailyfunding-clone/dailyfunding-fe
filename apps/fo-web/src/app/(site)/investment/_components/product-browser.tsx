"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { api, fmtMan } from "@/shared/api";
import { useMounted } from "@/shared/lib";
import { useMe } from "@/shared/session";
import { FilterRow } from "@/shared/ui";

import { HIDDEN_STATUSES, OPEN_STATUSES, TYPE_OPTIONS } from "./constants";
import ProductCard from "./product-card";
import { useProductStream } from "./use-product-stream";

import type { ProductListItem } from "./types";

const TERM_MAX = 24;
const AMOUNT_MAX = 1_000_000_000;
const AMOUNT_STEP = 10_000_000;
const CLOSED_PREVIEW = 4;

const STATUS_TABS = [
  { value: "", label: "전체" },
  { value: "recruiting", label: "모집중" },
  { value: "scheduled", label: "모집예정" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "rate_desc", label: "수익률 높은 순" },
  { value: "rate_asc", label: "수익률 낮은 순" },
];

type Filters = {
  status: string;
  type: string;
  sort: string;
  min_term: number;
  max_term: number;
  min_amount: number;
  max_amount: number;
};

const fromParams = (sp: URLSearchParams | ReturnType<typeof useSearchParams>): Filters => ({
  status: sp.get("status") ?? "",
  type: sp.get("type") ?? "",
  sort: sp.get("sort") ?? "latest",
  min_term: Number(sp.get("min_term")) || 1,
  max_term: Number(sp.get("max_term")) || TERM_MAX,
  min_amount: Number(sp.get("min_amount")) || 0,
  max_amount: Number(sp.get("max_amount")) || AMOUNT_MAX,
});

const toParams = (f: Filters) => {
  const qs = new URLSearchParams();
  if (f.status) qs.set("status", f.status);
  if (f.type) qs.set("type", f.type);
  if (f.sort !== "latest") qs.set("sort", f.sort);
  if (f.min_term > 1) qs.set("min_term", String(f.min_term));
  if (f.max_term < TERM_MAX) qs.set("max_term", String(f.max_term));
  if (f.min_amount > 0) qs.set("min_amount", String(f.min_amount));
  if (f.max_amount < AMOUNT_MAX) qs.set("max_amount", String(f.max_amount));
  return qs.toString();
};

const fmtAmountCap = (n: number, max: number) => (n >= max ? `${fmtMan(max)}+` : fmtMan(n));

type Props = {
  products: ProductListItem[];
};

const ProductBrowser = ({ products }: Props) => {
  const router = useRouter();
  const sp = useSearchParams();
  const me = useMe();
  const mounted = useMounted();
  const [f, setF] = useState<Filters>(() => fromParams(sp));
  const [expanded, setExpanded] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");

  const [prevSp, setPrevSp] = useState(sp);
  if (prevSp !== sp) {
    setPrevSp(sp);
    setF(fromParams(sp));
  }

  const commit = (next: Filters) => {
    setF(next);
    const qs = toParams(next);
    router.replace(qs ? `/investment?${qs}` : "/investment", { scroll: false });
  };

  const patch = (part: Partial<Filters>) => setF((prev) => ({ ...prev, ...part }));
  const commitRange = () => commit(f);

  const visible = products.filter((p) => !HIDDEN_STATUSES.has(p.status));
  const open = visible.filter(
    (p) => OPEN_STATUSES.has(p.status) && (!f.status || p.status === f.status),
  );
  const closed = visible.filter((p) => !OPEN_STATUSES.has(p.status));

  useProductStream(open.map((p) => p.id));

  const toggleNotify = async () => {
    try {
      await api.request("post", "/api/notifications/settings", { new_product: true });
      setNotifyMsg("신규 상품 알림을 켰어요");
    } catch {
      setNotifyMsg("알림 설정에 실패했어요");
    }
  };

  return (
    <>
      <div className="inv-filters">
        <FilterRow label="모집상태">
          <div className="chips">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`chip${f.status === t.value ? " is-active" : ""}`}
                onClick={() => commit({ ...f, status: t.value })}
              >
                {t.label}
              </button>
            ))}
          </div>
          {mounted && me.data && (
            <button type="button" className="inv-notify" onClick={toggleNotify}>
              {notifyMsg || "신규 상품 알림 받기"}
            </button>
          )}
        </FilterRow>
        <FilterRow label="상품유형">
          <div className="chips">
            <button
              type="button"
              className={`chip${f.type === "" ? " is-active" : ""}`}
              onClick={() => commit({ ...f, type: "" })}
            >
              전체
            </button>
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`chip${f.type === t.value ? " is-active" : ""}`}
                onClick={() => commit({ ...f, type: f.type === t.value ? "" : t.value })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </FilterRow>
        <FilterRow label="수익률">
          <select
            className="inv-sort"
            value={f.sort}
            onChange={(e) => commit({ ...f, sort: e.target.value })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FilterRow>
        <FilterRow label="투자기간">
          <div className="inv-range">
            <input
              type="range"
              min={1}
              max={TERM_MAX}
              value={f.min_term}
              onChange={(e) => patch({ min_term: Number(e.target.value) })}
              onPointerUp={commitRange}
              onKeyUp={commitRange}
              onBlur={commitRange}
              aria-label="최소 기간"
            />
            <span className="inv-range-val">{f.min_term}개월</span>
            <span>~</span>
            <input
              type="range"
              min={1}
              max={TERM_MAX}
              value={f.max_term}
              onChange={(e) => patch({ max_term: Number(e.target.value) })}
              onPointerUp={commitRange}
              onKeyUp={commitRange}
              onBlur={commitRange}
              aria-label="최대 기간"
            />
            <span className="inv-range-val">
              {f.max_term >= TERM_MAX ? `${TERM_MAX}개월+` : `${f.max_term}개월`}
            </span>
          </div>
        </FilterRow>
        <FilterRow label="모집금액">
          <div className="inv-range">
            <input
              type="range"
              min={0}
              max={AMOUNT_MAX}
              step={AMOUNT_STEP}
              value={f.min_amount}
              onChange={(e) => patch({ min_amount: Number(e.target.value) })}
              onPointerUp={commitRange}
              onKeyUp={commitRange}
              onBlur={commitRange}
              aria-label="최소 금액"
            />
            <span className="inv-range-val">
              {f.min_amount <= 0 ? "제한 없음" : fmtMan(f.min_amount)}
            </span>
            <span>~</span>
            <input
              type="range"
              min={0}
              max={AMOUNT_MAX}
              step={AMOUNT_STEP}
              value={f.max_amount}
              onChange={(e) => patch({ max_amount: Number(e.target.value) })}
              onPointerUp={commitRange}
              onKeyUp={commitRange}
              onBlur={commitRange}
              aria-label="최대 금액"
            />
            <span className="inv-range-val">{fmtAmountCap(f.max_amount, AMOUNT_MAX)}</span>
          </div>
        </FilterRow>
      </div>

      {open.length === 0 ? (
        <div className="empty">조건에 맞는 상품이 없어요</div>
      ) : (
        <div className="card-grid">
          {open.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {closed.length > 0 && (
        <section className="inv-section">
          <h2 className="inv-section-title">마감된 상품</h2>
          <div className="card-grid">
            {(expanded ? closed : closed.slice(0, CLOSED_PREVIEW)).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {closed.length > CLOSED_PREVIEW && !expanded && (
            <button
              type="button"
              className="btn btn-outline inv-more"
              onClick={() => setExpanded(true)}
            >
              마감 상품 더보기
            </button>
          )}
        </section>
      )}
    </>
  );
};

export default ProductBrowser;
