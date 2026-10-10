"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP } from "web-vitals";

const ENDPOINT = "/api/metrics/vitals";

const report = (path: string) => (metric: { name: string; value: number }) => {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    path,
    ts: Date.now(),
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
  }
};

const VitalsReporter = () => {
  const pathname = usePathname();
  useEffect(() => {
    const send = report(pathname);
    onCLS(send);
    onFCP(send);
    onINP(send);
    onLCP(send);
  }, [pathname]);
  return null;
};

export default VitalsReporter;
