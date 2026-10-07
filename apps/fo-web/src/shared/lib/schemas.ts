import { z } from "zod";

export const emailSchema = z.email("이메일 형식이 아니에요");

export const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 해요");

export const pinSchema = z
  .string()
  .regex(/^\d{6}$/, "숫자 6자리를 입력해 주세요");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "비밀번호를 입력해 주세요"),
});

export const findIdSchema = z.object({
  name: z.string().min(1, "이름을 입력해 주세요"),
  birth_date: z
    .string()
    .regex(/^\d{8}$/, "생년월일 8자리를 입력해 주세요"),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, "휴대폰 번호를 숫자만 입력해 주세요"),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
  password_confirm: z.string().min(1, "비밀번호 확인을 입력해 주세요"),
}).refine((d) => d.password === d.password_confirm, {
  path: ["password_confirm"],
  message: "비밀번호가 일치하지 않아요",
});

export const reauthSchema = z.object({
  password: z.string().min(1, "비밀번호를 입력해 주세요"),
});

export const signupAccountSchema = z
  .object({
    email: z.email("이메일 형식을 확인해 주세요"),
    password: z.string().min(8, "비밀번호는 8자 이상이에요"),
    passwordConfirm: z.string().min(1, "비밀번호를 한 번 더 입력해 주세요"),
    referrer: z.string().default(""),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "비밀번호가 서로 달라요",
  });

export const signupVerifySchema = z.object({
  name: z.string().min(1, "이름을 입력해 주세요"),
  birth: z.preprocess(
    (v) => String(v ?? "").replace(/\D/g, ""),
    z.string().regex(/^\d{8}$/, "생년월일 8자리를 입력해 주세요"),
  ),
  phone: z.preprocess(
    (v) => String(v ?? "").replace(/\D/g, ""),
    z.string().regex(/^\d{10,11}$/, "휴대폰 번호를 확인해 주세요"),
  ),
  carrier: z.string().default("SKT"),
  businessNumber: z.string().default(""),
});

export const depositChargeSchema = z.object({
  sender_name: z.string().min(1, "입금자명을 입력해 주세요"),
  amount: z.coerce
    .number()
    .int("금액을 확인해 주세요")
    .positive("1원 이상 입력해 주세요"),
});

export const withdrawAmountSchema = z.object({
  amount: z.coerce
    .number()
    .int("금액을 확인해 주세요")
    .positive("1원 이상 입력해 주세요"),
});

export const linkedAccountSchema = z.object({
  bank_name: z.string().min(1, "은행을 선택해 주세요"),
  account_no: z
    .string()
    .regex(/^\d+$/, "계좌번호는 숫자만 입력해 주세요"),
  holder: z.string().min(1, "예금주를 입력해 주세요"),
});

export const gradeRequestSchema = z.object({
  to_grade: z.enum(["income_eligible", "professional"]),
});

export const pointConvertSchema = z.object({
  amount: z.coerce
    .number()
    .int("금액을 확인해 주세요")
    .positive("1포인트 이상 입력해 주세요"),
});

export const schedulePreviewSchema = z.object({
  man: z.coerce
    .number()
    .int("금액을 확인해 주세요")
    .positive("투자금액을 입력해 주세요"),
});

export const limitCheckSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("mortgage"),
    complex: z.string().min(1, "단지명을 입력해 주세요"),
    area: z.coerce.number().positive("면적을 입력해 주세요"),
    dong: z.string().min(1, "동을 입력해 주세요"),
    ho: z.string().min(1, "호수를 입력해 주세요"),
  }),
  z.object({
    type: z.literal("credit"),
    biz_no: z.string().min(1, "사업자등록번호를 입력해 주세요"),
  }),
]);

export const loanApplyInfoSchema = z.object({
  name: z.string().min(1, "이름을 입력해 주세요"),
  phone: z
    .string()
    .regex(/^\d+$/, "연락처는 - 없이 숫자만 입력해 주세요"),
  email: z.email("이메일 형식을 확인해 주세요"),
  company: z.string().default(""),
  biz_type: z.string().default(""),
  biz_no: z.string().default(""),
  agree_privacy: z.literal("on", {
    message: "개인정보 수집·이용에 동의해야 신청할 수 있어요",
  }),
  agree_marketing: z.string().optional(),
});

export const loanApplyFundsSchema = z.object({
  amount: z.coerce
    .number()
    .int("금액을 확인해 주세요")
    .positive("필요 자금을 입력해 주세요"),
  term_months: z.coerce
    .number()
    .int("기간을 확인해 주세요")
    .min(1, "대출 기간을 입력해 주세요")
    .max(60, "대출 기간은 60개월까지예요"),
  purpose: z.string().default(""),
  memo: z.string().default(""),
});

export const orderSchema = z.object({
  man: z.coerce
    .number()
    .int("투자 금액을 입력해 주세요")
    .positive("투자 금액을 입력해 주세요"),
  points: z.coerce
    .number()
    .nonnegative("포인트를 확인해 주세요")
    .default(0),
  confirm: z.literal("네", {
    message: "유의사항을 확인하고 '네'를 입력해 주세요",
  }),
});

const firstError = (error: z.ZodError) =>
  error.issues[0]?.message ?? "입력값을 확인해 주세요";

export type FormState = { error: string } | null;

export const parseForm = <T extends z.ZodType>(
  schema: T,
  input: FormData | Record<string, unknown>,
): { data: z.infer<T> } | { error: string } => {
  const raw = input instanceof FormData ? Object.fromEntries(input) : input;
  const parsed = schema.safeParse(raw);
  return parsed.success
    ? { data: parsed.data }
    : { error: firstError(parsed.error) };
};
