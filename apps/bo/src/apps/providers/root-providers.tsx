"use client";

import QueryProviders from "./query-providers";

const RootProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryProviders>{children}</QueryProviders>
);

export default RootProviders;
