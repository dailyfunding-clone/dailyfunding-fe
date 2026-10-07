import { RootProviders } from "@/apps/providers";

import type { Metadata } from "next";
import "@dailyfunding/design-system/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "데일리펀딩 관리자",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="ko">
    <body>
      <RootProviders>{children}</RootProviders>
    </body>
  </html>
);

export default RootLayout;
