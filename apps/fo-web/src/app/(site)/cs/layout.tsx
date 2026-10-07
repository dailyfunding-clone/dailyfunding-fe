import { Suspense } from "react";

import CsNav from "./cs-nav";

import type { ReactNode } from "react";
import "./cs.scss";

const CsLayout = ({ children }: { children: ReactNode }) => (
  <main className="container">
    <h1 className="page-title">고객지원</h1>
    <Suspense fallback={null}>
      <CsNav />
    </Suspense>
    {children}
  </main>
);

export default CsLayout;
