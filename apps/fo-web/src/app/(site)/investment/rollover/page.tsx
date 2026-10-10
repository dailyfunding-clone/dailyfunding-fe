import { RolloverPanel } from "../_components";

import "../investment.scss";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "예약 투자" };

const RolloverPage = () => (
  <main className="container" style={{ maxWidth: 720 }}>
    <h1 className="page-title">예약 투자</h1>
    <p className="field-hint" style={{ marginBottom: 20 }}>
      만기가 가까운 투자의 상환금을 재모집 상품에 미리 예약할 수 있어요
    </p>
    <RolloverPanel />
  </main>
);

export default RolloverPage;
