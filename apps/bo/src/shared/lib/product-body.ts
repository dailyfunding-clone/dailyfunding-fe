import type { components } from "@dailyfunding/api-client";

export type AdminProduct = components["schemas"]["AdminProduct"];
export type ProductUpsert = components["schemas"]["ProductUpsert"];

export type ProductFormValues = {
  name: string;
  product_no: string;
  type: string;
  annual_rate: string;
  term_months: number;
  target_amount: number;
  repay_type: string;
  platform_fee_rate: string;
  repay_day?: number;
  borrower_id: string;
  borrower_name: string;
  tags: string;
  notice: string;
};

const splitTags = (tags: string) =>
  tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

export const buildProductBody = (
  v: ProductFormValues,
  product: AdminProduct | null,
): ProductUpsert => {
  if (!product) {
    return {
      name: v.name,
      ...(v.product_no ? { product_no: v.product_no } : {}),
      type: v.type as ProductUpsert["type"],
      annual_rate: v.annual_rate,
      term_months: v.term_months,
      target_amount: v.target_amount,
      repay_type: v.repay_type as ProductUpsert["repay_type"],
      ...(v.platform_fee_rate ? { platform_fee_rate: v.platform_fee_rate } : {}),
      ...(v.repay_day !== undefined ? { repay_day: v.repay_day } : {}),
      borrower_id: v.borrower_id,
      ...(v.borrower_name ? { borrower_name: v.borrower_name } : {}),
      tags: splitTags(v.tags),
      ...(v.notice ? { notice: v.notice } : {}),
    };
  }
  const body: ProductUpsert = {};
  if (v.name !== product.name) body.name = v.name;
  if (v.product_no && v.product_no !== product.product_no) body.product_no = v.product_no;
  if (v.type !== product.type) body.type = v.type as ProductUpsert["type"];
  if (Number(v.annual_rate) !== Number(product.annual_rate)) body.annual_rate = v.annual_rate;
  if (v.term_months !== product.term_months) body.term_months = v.term_months;
  if (v.target_amount !== product.target_amount) body.target_amount = v.target_amount;
  if (v.repay_type) body.repay_type = v.repay_type as ProductUpsert["repay_type"];
  if (v.platform_fee_rate) body.platform_fee_rate = v.platform_fee_rate;
  if (v.repay_day !== undefined) body.repay_day = v.repay_day;
  if (v.borrower_id) body.borrower_id = v.borrower_id;
  if (v.borrower_name) body.borrower_name = v.borrower_name;
  if (v.tags) body.tags = splitTags(v.tags);
  if (v.notice) body.notice = v.notice;
  return body;
};
