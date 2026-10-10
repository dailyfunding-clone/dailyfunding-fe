import type { Metadata } from "next";

export const metadata: Metadata = { title: "투자 내역" };

const InvestmentsLayout = ({ children }: { children: React.ReactNode }) => children;

export default InvestmentsLayout;
