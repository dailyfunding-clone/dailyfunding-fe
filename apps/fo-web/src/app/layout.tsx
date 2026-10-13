import localFont from "next/font/local";
import Script from "next/script";
import { Suspense } from "react";

import { RootProviders } from "@/apps/providers";
import { DevDomGuard, VitalsReporter, WebViewBridge } from "@/apps/ui";

import type { Metadata, Viewport } from "next";
import "@dailyfunding/design-system/tokens.css";
import "@dailyfunding/design-system/components.css";
import "./globals.scss";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dailyfunding.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "데일리펀딩",
    template: "%s | 데일리펀딩",
  },
  description: "온라인투자연계금융 플랫폼",
  keywords: ["P2P 투자", "온라인투자연계금융", "부동산 투자", "분산투자"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "데일리펀딩",
    title: "데일리펀딩",
    description: "온라인투자연계금융 플랫폼",
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: "데일리펀딩",
    description: "온라인투자연계금융 플랫폼",
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    telephone: false,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "데일리펀딩",
  url: SITE_URL,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
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
