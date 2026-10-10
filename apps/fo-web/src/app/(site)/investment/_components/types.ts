import type { components } from "@dailyfunding/api-client";

export type ProductListItem = Omit<
  components["schemas"]["ProductList"],
  "raised_amount" | "status" | "tags"
> & {
  raised_amount: number;
  status: string;
  tags?: string[];
};

export type ProductDetail = ProductListItem &
  Omit<components["schemas"]["ProductDetail"], keyof ProductListItem> & {
    platform_fee_rate: string;
    repay_day: number;
    recruit_open_at: string | null;
  };

export type ScheduleRow = {
  seq: number;
  pay_date: string;
  principal: number;
  repay_principal: number;
  interest_gross: number;
  tax: number;
  platform_fee: number;
  interest_net: number;
};

export type SchedulePreview = {
  gross_rate: string;
  net_rate: string;
  gross_return: number;
  net_return: number;
  schedule: ScheduleRow[];
};

export type InvestmentResponse = {
  investment_id: number;
  amount: number;
  points_used: number;
  expected_net_return: number;
  status: string;
  schedule: ScheduleRow[];
};

export type DepositAccount = {
  bank: string;
  account_no: string;
  holder: string;
  deposit: number;
  held: number;
  withdrawable: number;
};

export type PointBalance = {
  balance: number;
  expiring_this_month: number;
};

export type SuitabilityQuestion = {
  seq: number;
  text: string;
  answer_options: string[];
};

export type SuitabilityQuestions = {
  questions: SuitabilityQuestion[];
  valid_until: string | null;
};

export type SuitabilityResult = {
  passed: boolean;
  expires_at: string | null;
};

export type CartItem = {
  id: number;
  product_id: number;
  product_no: string;
  name: string;
  annual_rate: string;
  term_months: number;
  target_amount: number;
  remaining_amount: number;
  status: string;
  closed: boolean;
};

export type CartList = {
  results: CartItem[];
  count: number;
};

export type EligibleInvestment = components["schemas"]["ReservationEligibleItem"];

export type Reservation = Omit<
  components["schemas"]["ReservationResponse"],
  "investment_id" | "product_name" | "created_at"
>;
