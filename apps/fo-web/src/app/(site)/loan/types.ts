export type LoanProduct = {
  id: number;
  category: string;
  name: string;
  summary: string;
  target: string;
  max_limit: number;
  rate_range: string[];
  term_desc: string;
  repay_method: string;
};

export type LoanDetail = LoanProduct & {
  features: unknown[];
  steps: unknown[];
  info: Record<string, unknown>;
  faqs: unknown[];
  notices: string;
};

export const CATEGORY_LABEL: Record<string, string> = {
  personal: "개인대출",
  business: "기업대출",
};

export const textOf = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const first = o.title ?? o.name ?? o.label ?? o.q ?? Object.values(o)[0];
    return first === undefined || first === null ? "" : String(first);
  }
  return "";
};

export const faqOf = (v: unknown): { q: string; a: string } | null => {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const q = String(o.q ?? o.question ?? "");
  const a = String(o.a ?? o.answer ?? "");
  return q ? { q, a } : null;
};
