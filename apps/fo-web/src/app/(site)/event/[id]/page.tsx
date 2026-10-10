import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  fmtDate,
} from "@/entities/content";
import { fetchJson } from "@/entities/content/index.server";
import { AppLink } from "@/shared/ui";

import EnterButton from "./enter-button";
import { STATUS_LABEL, dday } from "../utils";

import type { Metadata } from "next";
import "../event.scss";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> => {
  const { id } = await params;
  const event = await fetchJson<{ title?: string }>(`/events/${id}`);
  return { title: event?.title ?? "이벤트" };
};


type EventDetail = {
  id: number;
  title: string;
  summary: string;
  body: string;
  status: string;
  thumbnail_url: string;
  reward_points: number;
  start_at: string | null;
  end_at: string | null;
  prev_id: number | null;
  next_id: number | null;
  ongoing?: { id: number; title: string; thumbnail_url: string }[];
};

const EventDetailContent = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const event = await fetchJson<EventDetail>(`/events/${id}`);
  if (!event) notFound();
  const d = event.status === "ongoing" ? dday(event.end_at) : null;
  return (
    <main className="container">
      <article className="event-hero">
        <div className="event-thumb">
          {event.thumbnail_url ? (
            <Image src={event.thumbnail_url} alt="" fill sizes="100vw" />
          ) : (
            "이벤트"
          )}
        </div>
        <div className="event-card-badges event-hero-badges">
          <span
            className={`badge${event.status === "ongoing" ? " badge-accent" : ""}`}
          >
            {STATUS_LABEL[event.status] ?? event.status}
          </span>
          {d && <span className="badge">{d}</span>}
        </div>
        <h2>{event.title}</h2>
        {event.summary && <p className="event-hero-sub">{event.summary}</p>}
        {(event.start_at || event.end_at) && (
          <p className="event-period">
            {fmtDate(event.start_at)} ~ {fmtDate(event.end_at)}
          </p>
        )}
        {event.reward_points > 0 && event.status === "ongoing" && (
          <span className="event-reward">
            참여하면 {event.reward_points.toLocaleString("ko-KR")}P 적립
          </span>
        )}
      </article>

      {event.status === "ongoing" && (
        <div className="event-enter">
          <EnterButton eventId={event.id} />
        </div>
      )}

      {event.body && <div className="event-body">{event.body}</div>}

      <nav className="event-nav">
        {event.prev_id ? (
          <AppLink href={`/event/${event.prev_id}`}>
            <b>이전</b>이전 이벤트
          </AppLink>
        ) : (
          <span />
        )}
        {event.next_id ? (
          <AppLink href={`/event/${event.next_id}`}>
            <b>다음</b>다음 이벤트
          </AppLink>
        ) : (
          <span />
        )}
      </nav>

      {(event.ongoing?.length ?? 0) > 0 && (
        <section className="event-section">
          <h3>진행 중인 다른 이벤트</h3>
          <div className="event-ongoing">
            {(event.ongoing ?? []).map((e) => (
              <AppLink key={e.id} href={`/event/${e.id}`}>
                <div className="event-thumb">
                  {e.thumbnail_url ? (
                    <Image
                      src={e.thumbnail_url}
                      alt=""
                      fill
                      sizes="(max-width: 600px) 100vw, 160px"
                    />
                  ) : (
                    "이벤트"
                  )}
                </div>
                {e.title}
              </AppLink>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

const EventDetailPage = (props: { params: Promise<{ id: string }> }) => (
  <Suspense fallback={null}>
    <EventDetailContent {...props} />
  </Suspense>
);

export default EventDetailPage;
