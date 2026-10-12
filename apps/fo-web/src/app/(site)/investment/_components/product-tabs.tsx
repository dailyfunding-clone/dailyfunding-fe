"use client";

import { useState } from "react";

const TABS = [
  { key: "overview", label: "종합정보" },
  { key: "detail", label: "상세정보" },
  { key: "notice", label: "투자 시 유의사항" },
] as const;

const renderValue = (v: unknown): React.ReactNode => {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "예" : "아니오";
  if (Array.isArray(v)) {
    if (v.length === 0) return "-";
    if (v.every((i) => typeof i !== "object" || i === null))
      return v.map((i) => String(i)).join(", ");
    return (
      <ul className="list">
        {v.map((item, i) => (
          <li key={i}>{renderValue(item)}</li>
        ))}
      </ul>
    );
  }
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.length === 0) return "-";
    return (
      <dl className="kv">
        {entries.map(([k, val]) => (
          <div key={k} style={{ display: "contents" }}>
            <dt>{k}</dt>
            <dd>{renderValue(val)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return String(v);
};

const DictView = ({ data }: { data: Record<string, unknown> }) => {
  const entries = Object.entries(data);
  if (entries.length === 0) return <p className="empty">등록된 정보가 없어요</p>;
  return (
    <dl className="kv">
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}>
          <dt>{k}</dt>
          <dd>{renderValue(v)}</dd>
        </div>
      ))}
    </dl>
  );
};

type Props = {
  tabs?: {
    overview?: Record<string, unknown>;
    detail?: Record<string, unknown>;
    notice?: string;
  };
};

const ProductTabs = ({ tabs }: Props) => {
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("overview");
  const notice = typeof tabs?.notice === "string" && tabs.notice.trim() ? tabs.notice : null;
  const move = (e: React.KeyboardEvent) => {
    const idx = TABS.findIndex((t) => t.key === active);
    let nextIdx: number | null = null;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % TABS.length;
    else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = TABS.length - 1;
    if (nextIdx === null) return;
    e.preventDefault();
    const key = TABS[nextIdx].key;
    setActive(key);
    document.getElementById(`product-tab-${key}`)?.focus();
  };
  return (
    <>
      <div className="tabs" role="tablist" aria-label="상품 정보" onKeyDown={move}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`product-tab-${t.key}`}
            aria-selected={active === t.key}
            aria-controls={`product-panel-${t.key}`}
            tabIndex={active === t.key ? 0 : -1}
            className={active === t.key ? "is-active" : undefined}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        className="tab-panel"
        role="tabpanel"
        id={`product-panel-${active}`}
        aria-labelledby={`product-tab-${active}`}
      >
        {active === "overview" && <DictView data={tabs?.overview ?? {}} />}
        {active === "detail" && <DictView data={tabs?.detail ?? {}} />}
        {active === "notice" &&
          (notice ? (
            <p className="notice-text">{notice}</p>
          ) : (
            <p className="empty">등록된 유의사항이 없어요</p>
          ))}
      </div>
    </>
  );
};

export default ProductTabs;
