"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { onCLS, onFCP, onINP, onLCP } from "web-vitals";

const ENDPOINT = "/api/metrics/vitals";

const report = (getPath: () => string) => (metric: { name: string; value: number }) => {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    path: getPath(),
    ts: Date.now(),
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
  }
};

const VitalsReporter = () => {
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);
  useEffect(() => {
    const send = report(() => pathRef.current);
    onCLS(send);
    onFCP(send);
    onINP(send);
    onLCP(send);
  }, []);
  return null;
};

export default VitalsReporter;
