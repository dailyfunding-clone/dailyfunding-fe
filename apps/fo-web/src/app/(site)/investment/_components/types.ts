export type ProductListItem = {
  id: number;
  product_no: string;
  name: string;
  type: string;
  annual_rate: string;
  term_months: number;
  target_amount: number;
  raised_amount: number;
  progress_pct: string;
  status: string;
  tags?: string[];
  registered_at: string;
};

export type ProductDetail = ProductListItem & {
  repay_type: string;
  platform_fee_rate: string;
  repay_day: number;
  remaining_amount: number;
  recruit_open_at: string | null;
  tabs?: {
    overview?: Record<string, unknown>;
    detail?: Record<string, unknown>;
    notice?: string;
  };
  my?: {
    deposit: number;
    investable: number;
    grade_remaining_limit: number | null;
    same_borrower_remaining: number | null;
  };
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

export type EligibleInvestment = {
  investment_id: number;
  product_id: number;
  product_name: string;
  amount: number;
  maturity_date: string;
  refinance_open: boolean;
};

export type Reservation = {
  id: number;
  status: string;
  amount: number;
};
