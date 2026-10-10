import type { Metadata } from "next";

export const metadata: Metadata = { title: "마이페이지" };

const MyPageLayout = ({ children }: { children: React.ReactNode }) => children;

export default MyPageLayout;
