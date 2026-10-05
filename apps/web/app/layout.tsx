import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { WebViewBridge } from "../components/webview-bridge";
import "./globals.css";

export const metadata: Metadata = {
  title: "데일리펀딩",
  description: "온라인투자연계금융 플랫폼",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <WebViewBridge />
        {children}
        {process.env.NODE_ENV === "development" && (
          <Script src="http://localhost:8097" strategy="beforeInteractive" />
        )}
      </body>
    </html>
  );
}
