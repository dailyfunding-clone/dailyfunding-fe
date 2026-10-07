import Image from "next/image";
import { Suspense } from "react";

import { Pagination } from "@/entities/content";
import {
  fetchJson,
  firstParam,
  fmtDate,
  qs,
} from "@/entities/content";
import { AppLink } from "@/shared/ui";

import { STATUS_LABEL, dday } from "./utils";

import "./event.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "이벤트" };


const STATUS_TABS = [
  { key: "", label: "전체" },
  { key: "ongoing", label: "진행중" },
  { key: "winners", label: "당첨발표" },
  { key: "ended", label: "종료" },
];

type EventItem = {
  id: number;
  title: string;
  summary: string;
  status: string;
  thumbnail_url: string;
  start_at: string | null;
  end_at: string | null;
};

const EventListContent = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;
  const status = firstParam(params.status) ?? "";
  const page = Number(firstParam(params.page)) || 1;
  const data = await fetchJson<{ results: EventItem[]; total: number }>(
    `/events${qs({ status, page: String(page) })}`,
  );
  const events = data?.results ?? [];
  const total = data?.total ?? 0;
  return (
    <main className="container">
      <h1 className="page-title">이벤트</h1>
      <nav className="tabs">
        {STATUS_TABS.map((t) => (
          <AppLink
            key={t.key}
            href={`/event${qs({ status: t.key || undefined })}`}
            className={status === t.key ? "is-active" : undefined}
          >
            {t.label}
          </AppLink>
        ))}
      </nav>
      {events.length === 0 ? (
        <div className="empty">진행할 수 있는 이벤트가 없어요</div>
      ) : (
        <div className="card-grid event-cards">
          {events.map((e) => {
            const d = e.status === "ongoing" ? dday(e.end_at) : null;
            return (
              <AppLink key={e.id} href={`/event/${e.id}`} className="card event-card">
                <div className="event-thumb">
                  {e.thumbnail_url ? (
                    <Image
                      src={e.thumbnail_url}
                      alt=""
                      fill
                      sizes="(max-width: 600px) 100vw, 320px"
                    />
                  ) : (
                    "이벤트"
                  )}
                </div>
                <h3>{e.title}</h3>
                <p>{e.summary}</p>
                <div className="event-card-badges">
                  <span
                    className={`badge${e.status === "ongoing" ? " badge-accent" : ""}`}
                  >
                    {STATUS_LABEL[e.status] ?? e.status}
                  </span>
                  {d && <span className="badge">{d}</span>}
                  {(e.start_at || e.end_at) && (
                    <span className="badge">
                      {fmtDate(e.start_at)} ~ {fmtDate(e.end_at)}
                    </span>
                  )}
                </div>
              </AppLink>
            );
          })}
        </div>
      )}
      <Pagination
        total={total}
        page={page}
        buildHref={(p) =>
          `/event${qs({ status: status || undefined, page: String(p) })}`
        }
      />
    </main>
  );
};

const EventListPage = (props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => (
  <Suspense fallback={null}>
    <EventListContent {...props} />
  </Suspense>
);

export default EventListPage;
