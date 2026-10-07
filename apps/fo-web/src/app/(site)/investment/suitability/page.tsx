import { SuitabilityTest } from "../_components";

import "../investment.scss";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "투자적합성 테스트" };


const SuitabilityPage = () => (
  <main className="container" style={{ maxWidth: 640 }}>
    <h1 className="page-title">투자적합성 테스트</h1>
    <SuitabilityTest />
  </main>
);

export default SuitabilityPage;
