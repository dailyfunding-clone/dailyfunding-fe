import { Suspense } from "react";

import { JsonBlock } from "@/entities/content";
import {
  fetchJson,
  firstParam,
  fmtDate,
  qs,
} from "@/entities/content";
import { AppLink } from "@/shared/ui";

import "./disclosure.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "공시" };


const TABS = [
  { key: "management", label: "경영현황" },
  { key: "operations", label: "운영현황" },
  { key: "internal", label: "내부통제" },
];

const KPI_LABEL: Record<string, string> = {
  yield: "수익률",
  avg_yield: "수익률",
  annual_yield: "수익률",
  total_loan: "누적대출액",
  cumulative_loan: "누적대출액",
  balance: "잔액",
  delinquency: "연체율",
  delinquency_rate: "연체율",
  loss: "손실률",
  loss_rate: "손실률",
};

type Disclosure = {
  id: number;
  year: number;
  month: number;
  kpi: Record<string, unknown>;
  tabs: Record<string, unknown>;
  published_at: string;
};

const DisclosureContent = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;
  const year = firstParam(params.year) ?? "";
  const month = firstParam(params.month) ?? "";
  const tab = firstParam(params.tab) ?? "management";
  const data = await fetchJson<{ results: Disclosure[] }>(
    `/disclosures${qs({ year, month })}`,
  );
  const d = data?.results?.[0];
  const thisYear = new Date().getFullYear();
  const years = [thisYear, thisYear - 1, thisYear - 2, thisYear - 3];
  return (
    <main className="container">
      <h1 className="page-title">공시</h1>
      <form className="disc-filter" action="/disclosure" method="get">
        <select name="year" defaultValue={year} aria-label="연도">
          <option value="">전체 연도</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
        <select name="month" defaultValue={month} aria-label="월">
          <option value="">전체 월</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m}월
            </option>
          ))}
        </select>
        <input type="hidden" name="tab" value={tab} />
        <button type="submit" className="btn btn-primary">
          조회
        </button>
      </form>
      {!d ? (
        <div className="empty">해당 기간의 공시가 아직 없어요</div>
      ) : (
        <>
          <p className="disc-period">
            {d.year}년 {d.month}월 공시
          </p>
          <p className="disc-published">공시일 {fmtDate(d.published_at)}</p>
          <div className="kpi-band">
            {Object.entries(d.kpi ?? {}).map(([k, v]) => (
              <dl className="kpi" key={k}>
                <dt>{KPI_LABEL[k] ?? k}</dt>
                <dd>
                  {typeof v === "number" ? v.toLocaleString("ko-KR") : String(v)}
                </dd>
              </dl>
            ))}
          </div>
          <nav className="tabs">
            {TABS.map((t) => (
              <AppLink
                key={t.key}
                href={`/disclosure${qs({ year, month, tab: t.key })}`}
                className={tab === t.key ? "is-active" : undefined}
              >
                {t.label}
              </AppLink>
            ))}
          </nav>
          <section className="disc-section">
            <JsonBlock data={d.tabs?.[tab]} />
          </section>
        </>
      )}
    </main>
  );
};

const DisclosurePage = (props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => (
  <Suspense fallback={null}>
    <DisclosureContent {...props} />
  </Suspense>
);

export default DisclosurePage;
