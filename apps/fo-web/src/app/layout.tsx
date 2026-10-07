import localFont from "next/font/local";
import Script from "next/script";
import { Suspense } from "react";

import { RootProviders } from "@/apps/providers";
import { WebViewBridge } from "@/apps/ui";

import type { Metadata, Viewport } from "next";
import "@dailyfunding/design-system/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "데일리펀딩",
  description: "온라인투자연계금융 플랫폼",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-pretendard",
});

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ko" className={pretendard.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Suspense fallback={null}>
          <WebViewBridge />
        </Suspense>
        <RootProviders>{children}</RootProviders>
        {process.env.NEXT_PUBLIC_DEV_SCRIPT_URL && (
          <Script
            src={process.env.NEXT_PUBLIC_DEV_SCRIPT_URL}
            strategy="beforeInteractive"
          />
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var bad=function(n,v){return n==="bis_skin_checked"||(typeof v==="string"&&v.indexOf("chrome://")===0)};var o=Element.prototype.setAttribute;Element.prototype.setAttribute=function(n,v){if(bad(n,v))return;return o.call(this,n,v)};var s=function(){document.querySelectorAll("[bis_skin_checked],[href^='chrome://'],[src^='chrome://']").forEach(function(e){e.removeAttribute("bis_skin_checked");e.removeAttribute("href");e.removeAttribute("src")})};s();new MutationObserver(s).observe(document.documentElement,{subtree:true,attributes:true})})()`,
          }}
        />
      </body>
    </html>
  );
}

export default RootLayout;
