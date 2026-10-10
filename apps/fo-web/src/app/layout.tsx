import localFont from "next/font/local";
import Script from "next/script";
import { Suspense } from "react";

import { RootProviders } from "@/apps/providers";
import { DevDomGuard, VitalsReporter, WebViewBridge } from "@/apps/ui";

import type { Metadata, Viewport } from "next";
import "@dailyfunding/design-system/tokens.css";
import "@dailyfunding/design-system/components.css";
import "./globals.scss";

export const metadata: Metadata = {
  title: "데일리펀딩",
  description: "온라인투자연계금융 플랫폼",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "400 800",
  display: "swap",
  variable: "--font-pretendard",
});

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ko" className={pretendard.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Suspense fallback={null}>
          <WebViewBridge />
          <VitalsReporter />
        </Suspense>
        <RootProviders>{children}</RootProviders>
        {process.env.NEXT_PUBLIC_DEV_SCRIPT_URL && (
          <Script src={process.env.NEXT_PUBLIC_DEV_SCRIPT_URL} strategy="beforeInteractive" />
        )}
        {process.env.NODE_ENV === "development" && <DevDomGuard />}
      </body>
    </html>
  );
};

export default RootLayout;
