import { describe, expect, it } from "vitest";

import { buildProductBody, type AdminProduct } from "./product-body";

const base = {
  name: "테스트상품",
  product_no: "P-001",
  type: "personal_credit",
  annual_rate: "12.00",
  term_months: 12,
  target_amount: 100000000,
  repay_type: "equal_installment",
  platform_fee_rate: "1.00",
  repay_day: 15,
  borrower_id: "b-1",
  borrower_name: "김차주",
  tags: "조기상환가능, 보증보험",
  notice: "유의사항",
};

const product: AdminProduct = {
  id: 1,
  product_no: "P-001",
  name: "테스트상품",
  type: "personal_credit",
  annual_rate: "12.00",
  term_months: 12,
  target_amount: 100000000,
  raised_amount: 0,
  status: "draft",
};

describe("buildProductBody", () => {
  it("sends full body on create", () => {
    const body = buildProductBody(base, null);
    expect(body).toMatchObject({
      name: "테스트상품",
      product_no: "P-001",
      type: "personal_credit",
      annual_rate: "12.00",
      term_months: 12,
      target_amount: 100000000,
      repay_type: "equal_installment",
      platform_fee_rate: "1.00",
      repay_day: 15,
      borrower_id: "b-1",
      borrower_name: "김차주",
      notice: "유의사항",
    });
    expect(body.tags).toEqual(["조기상환가능", "보증보험"]);
  });

  it("sends only dirty fields on edit", () => {
    const body = buildProductBody(
      {
        ...base,
        name: "바뀐상품",
        repay_type: "",
        platform_fee_rate: "",
        repay_day: undefined,
        borrower_id: "",
        borrower_name: "",
        tags: "",
        notice: "",
      },
      product,
    );
    expect(body).toEqual({ name: "바뀐상품" });
  });

  it("does not wipe list-omitted fields when left empty on edit", () => {
    const body = buildProductBody({ ...base, tags: "", notice: "" }, product);
    expect(body.tags).toBeUndefined();
    expect(body.notice).toBeUndefined();
  });

  it("returns empty object when nothing changed", () => {
    const body = buildProductBody(
      {
        ...base,
        repay_type: "",
        platform_fee_rate: "",
        repay_day: undefined,
        borrower_id: "",
        borrower_name: "",
        tags: "",
        notice: "",
      },
      product,
    );
    expect(body).toEqual({});
  });
});
