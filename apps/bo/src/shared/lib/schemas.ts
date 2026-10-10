import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("이메일 형식이 아니에요"),
  password: z.string().min(1, "비밀번호를 입력해 주세요"),
});

const optNum = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().optional(),
);

export const adminSeedSchema = z.object({
  count: optNum,
  rate_min: optNum,
  rate_max: optNum,
  amount_min: optNum,
  amount_max: optNum,
  term_min: optNum,
  term_max: optNum,
  seed: optNum,
  status: z.string().default(""),
});

const optStr = z.string().default("");

const optRate = optStr.refine(
  (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
  "금리를 숫자로 입력해 주세요",
);

export const adminLoanApproveSchema = z.object({
  name: optStr,
  type: optStr,
  annual_rate: optRate,
  repay_type: optStr,
  platform_fee_rate: optRate,
  borrower_id: optStr,
});

export const adminProductSchema = z.object({
  name: z.string().min(1, "상품명을 입력해 주세요"),
  product_no: z.string().default(""),
  type: z.string().min(1, "유형을 선택해 주세요"),
  annual_rate: z
    .string()
    .min(1, "연금리를 입력해 주세요")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "연금리를 숫자로 입력해 주세요"),
  term_months: z.coerce.number().int("기간을 확인해 주세요").positive("기간을 입력해 주세요"),
  target_amount: z.coerce.number().positive("모집금액을 입력해 주세요"),
  repay_type: optStr,
  platform_fee_rate: optRate,
  repay_day: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce
      .number()
      .int("상환일을 확인해 주세요")
      .min(1, "상환일은 1~28일이에요")
      .max(28, "상환일은 1~28일이에요")
      .optional(),
  ),
  borrower_id: z.string().default(""),
  borrower_name: z.string().default(""),
  tags: z.string().default(""),
  notice: z.string().default(""),
});

export const contentFieldSchema = (label: string, kind: string, required?: boolean) => {
  const base = required ? z.string().min(1, `${label}을(를) 입력해 주세요`) : z.string();
  if (kind === "url") {
    return base.refine(
      (v) => v === "" || /^https?:\/\//.test(v),
      `${label}은(는) http(s)로 시작하는 URL이어야 해요`,
    );
  }
  if (kind === "json") {
    return base.refine((v) => {
      if (v === "") return true;
      try {
        JSON.parse(v);
        return true;
      } catch {
        return false;
      }
    }, `${label}의 JSON 형식을 확인해 주세요`);
  }
  return base;
};

const firstError = (error: z.ZodError) => error.issues[0]?.message ?? "입력값을 확인해 주세요";

export type FormState = { error: string } | null;

export const parseForm = <T extends z.ZodType>(
  schema: T,
  input: FormData | Record<string, unknown>,
): { data: z.infer<T> } | { error: string } => {
  const raw = input instanceof FormData ? Object.fromEntries(input) : input;
  const parsed = schema.safeParse(raw);
  return parsed.success ? { data: parsed.data } : { error: firstError(parsed.error) };
};
