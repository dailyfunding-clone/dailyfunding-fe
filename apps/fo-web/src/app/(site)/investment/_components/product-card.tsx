import { memo } from "react";

import { AppLink } from "@/shared/ui";

import { STATUS_LABEL, TYPE_LABEL, fmtDate } from "./constants";
import ProductProgress from "./product-progress";

import type { ProductListItem } from "./types";

type Props = {
  product: ProductListItem;
};

const ProductCard = memo(({ product: p }: Props) => {
  const statusClass =
    p.status === "recruiting" ? "badge-accent" : p.status === "scheduled" ? "" : "badge-danger";
  return (
    <AppLink href={`/investment/${p.id}`} className="card product-card">
      <div className="product-card-badges">
        <span className="badge">{TYPE_LABEL[p.type] ?? p.type}</span>
        <span className={`badge ${statusClass}`.trim()}>{STATUS_LABEL[p.status] ?? p.status}</span>
      </div>
      <h3>{p.name}</h3>
      <div className="product-card-rate">
        <strong>{p.annual_rate}%</strong>
        <span>{p.term_months}개월</span>
      </div>
      <ProductProgress product={p} />
      {p.tags && p.tags.length > 0 && (
        <div className="tag-row">
          {p.tags.map((t) => (
            <span key={t} className="badge">
              {t}
            </span>
          ))}
        </div>
      )}
      <small>
        {p.product_no} · 등록 {fmtDate(p.registered_at)}
      </small>
    </AppLink>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
