import * as z from "zod/mini";

const MAX_AMOUNT = 100_000_000_000;
const MAX_MAN = 10_000_000;
const MAX_AMOUNT_MSG = "금액이 너무 커요";

const digitsOnly = () => z.transform((v: unknown) => String(v ?? "").replace(/\D/g, ""));
const amountField = (positiveMsg: string, max: number) =>
  z.pipe(
    z.coerce.number(),
    z
      .int("금액을 확인해 주세요")
      .check(z.positive(positiveMsg), z.lte(max, MAX_AMOUNT_MSG)),
  );

export const emailSchema = z.email("이메일 형식이 아니에요");

export const passwordSchema = z.string().check(z.minLength(8, "비밀번호는 8자 이상이어야 해요"));

export const pinSchema = z.string().check(z.regex(/^\d{6}$/, "숫자 6자리를 입력해 주세요"));

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().check(z.minLength(1, "비밀번호를 입력해 주세요")),
});

export const findIdSchema = z.object({
  name: z.string().check(z.minLength(1, "이름을 입력해 주세요")),
  birth_date: z.string().check(z.regex(/^\d{8}$/, "생년월일 8자리를 입력해 주세요")),
  phone: z.string().check(z.regex(/^\d{10,11}$/, "휴대폰 번호를 숫자만 입력해 주세요")),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z
  .object({
    token: z.string().check(z.minLength(1)),
    password: passwordSchema,
    password_confirm: z.string().check(z.minLength(1, "비밀번호 확인을 입력해 주세요")),
  })
  .check(
    z.refine((d) => d.password === d.password_confirm, {
      error: "비밀번호가 일치하지 않아요",
      path: ["password_confirm"],
    }),
  );

export const reauthSchema = z.object({
  password: z.string().check(z.minLength(1, "비밀번호를 입력해 주세요")),
});

export const signupAccountSchema = z
  .object({
    email: z.email("이메일 형식을 확인해 주세요"),
    password: z.string().check(z.minLength(8, "비밀번호는 8자 이상이에요")),
    passwordConfirm: z.string().check(z.minLength(1, "비밀번호를 한 번 더 입력해 주세요")),
    referrer: z._default(z.string(), ""),
  })
  .check(
    z.refine((v) => v.password === v.passwordConfirm, {
      error: "비밀번호가 서로 달라요",
      path: ["passwordConfirm"],
    }),
  );

export const signupVerifySchema = z.object({
  name: z.string().check(z.minLength(1, "이름을 입력해 주세요")),
  birth: z.pipe(
    digitsOnly(),
    z.string().check(z.regex(/^\d{8}$/, "생년월일 8자리를 입력해 주세요")),
  ),
  phone: z.pipe(
    digitsOnly(),
    z.string().check(z.regex(/^\d{10,11}$/, "휴대폰 번호를 확인해 주세요")),
  ),
  carrier: z._default(z.string(), "SKT"),
  businessNumber: z._default(z.string(), ""),
});

export const depositChargeSchema = z.object({
  sender_name: z.string().check(z.minLength(1, "입금자명을 입력해 주세요")),
  amount: amountField("1원 이상 입력해 주세요", MAX_AMOUNT),
});

export const withdrawAmountSchema = z.object({
  amount: amountField("1원 이상 입력해 주세요", MAX_AMOUNT),
});

export const linkedAccountSchema = z.object({
  bank_name: z.string().check(z.minLength(1, "은행을 선택해 주세요")),
  account_no: z.string().check(z.regex(/^\d+$/, "계좌번호는 숫자만 입력해 주세요")),
  holder: z.string().check(z.minLength(1, "예금주를 입력해 주세요")),
});

export const gradeRequestSchema = z.object({
  to_grade: z.enum(["income_eligible", "professional"]),
});

export const pointConvertSchema = z.object({
  amount: amountField("1포인트 이상 입력해 주세요", MAX_AMOUNT),
});

export const schedulePreviewSchema = z.object({
  man: amountField("투자금액을 입력해 주세요", MAX_MAN),
});

export const limitCheckSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("mortgage"),
    complex: z.string().check(z.minLength(1, "단지명을 입력해 주세요")),
    area: z.coerce.number().check(z.positive("면적을 입력해 주세요")),
    dong: z.string().check(z.minLength(1, "동을 입력해 주세요")),
    ho: z.string().check(z.minLength(1, "호수를 입력해 주세요")),
  }),
  z.object({
    type: z.literal("credit"),
    biz_no: z.string().check(z.minLength(1, "사업자등록번호를 입력해 주세요")),
  }),
]);

export const loanApplyInfoSchema = z.object({
  name: z.string().check(z.minLength(1, "이름을 입력해 주세요")),
  phone: z.string().check(z.regex(/^\d+$/, "연락처는 - 없이 숫자만 입력해 주세요")),
  email: z.email("이메일 형식을 확인해 주세요"),
  company: z._default(z.string(), ""),
  biz_type: z._default(z.string(), ""),
  biz_no: z._default(z.string(), ""),
  agree_privacy: z.literal("on", "개인정보 수집·이용에 동의해야 신청할 수 있어요"),
  agree_marketing: z.optional(z.string()),
});

export const loanApplyFundsSchema = z.object({
  amount: amountField("필요 자금을 입력해 주세요", MAX_AMOUNT),
  term_months: z.pipe(
    z.coerce.number(),
    z
      .int("기간을 확인해 주세요")
      .check(z.gte(1, "대출 기간을 입력해 주세요"), z.lte(60, "대출 기간은 60개월까지예요")),
  ),
  purpose: z._default(z.string(), ""),
  memo: z._default(z.string(), ""),
});

export const orderSchema = z.object({
  man: z.pipe(
    z.coerce.number(),
    z
      .int("투자 금액을 입력해 주세요")
      .check(z.positive("투자 금액을 입력해 주세요"), z.lte(MAX_MAN, MAX_AMOUNT_MSG)),
  ),
  points: z._default(
    z.coerce.number().check(z.nonnegative("포인트를 확인해 주세요"), z.lte(MAX_AMOUNT, MAX_AMOUNT_MSG)),
    0,
  ),
  confirm: z.literal("네", "유의사항을 확인하고 '네'를 입력해 주세요"),
});

const firstError = (error: z.core.$ZodError) => error.issues[0]?.message ?? "입력값을 확인해 주세요";

export type FormState = { error: string } | null;

export const parseForm = <T extends z.ZodMiniType>(
  schema: T,
  input: FormData | Record<string, unknown>,
): { data: z.infer<T> } | { error: string } => {
  const raw = input instanceof FormData ? Object.fromEntries(input) : input;
  const parsed = schema.safeParse(raw);
  return parsed.success ? { data: parsed.data } : { error: firstError(parsed.error) };
};
