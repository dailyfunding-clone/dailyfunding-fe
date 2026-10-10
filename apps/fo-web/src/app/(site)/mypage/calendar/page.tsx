"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AuthGate } from "@/features/auth";
import { api, fmtWon } from "@/shared/api";
import { useDocumentTitle } from "@/shared/lib";

import { toISODate } from "../_components";

import "../mypage.scss";

type CalendarDay = {
  date: string;
  principal: number;
  interest_net: number;
  status: string;
};

type CalendarResponse = {
  days: CalendarDay[];
  monthly: {
    principal_done: number;
    principal_scheduled: number;
    interest_done_net: number;
    interest_scheduled_net: number;
  };
};

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

const CalendarPage = () => {
  useDocumentTitle("상환달력");
  return (
    <AuthGate title="상환달력">
      <RepayCalendar />
    </AuthGate>
  );
};

const RepayCalendar = () => {
  const [ym, setYm] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const { data } = useQuery<CalendarResponse>({
    queryKey: ["me-calendar", ym.year, ym.month],
    queryFn: () =>
      api.request<CalendarResponse>("get", `/api/me/calendar?year=${ym.year}&month=${ym.month}`),
  });

  const move = (delta: number) => {
    setYm((prev) => {
      const d = new Date(prev.year, prev.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  };

  const dayMap = new Map<string, CalendarDay[]>();
  for (const d of data?.days ?? []) {
    const list = dayMap.get(d.date) ?? [];
    list.push(d);
    dayMap.set(d.date, list);
  }

  const firstDow = new Date(ym.year, ym.month - 1, 1).getDay();
  const lastDay = new Date(ym.year, ym.month, 0).getDate();
  const todayIso = toISODate(new Date());
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: lastDay }, (_, i) => i + 1),
  ];

  return (
    <div className="container">
      <h1 className="page-title">상환달력</h1>

      <div className="card mypage-section">
        <div className="calendar-head">
          <strong>
            {ym.year}년 {ym.month}월
          </strong>
          <div className="cal-nav">
            <button type="button" onClick={() => move(-1)} aria-label="이전 달">
              ◀
            </button>
            <button type="button" onClick={() => move(1)} aria-label="다음 달">
              ▶
            </button>
          </div>
        </div>
        <div className="calendar-grid">
          {DOW.map((d) => (
            <div key={d} className="cal-dow">
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`b-${i}`} className="cal-day is-blank" />;
            }
            const iso = `${ym.year}-${String(ym.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const entries = dayMap.get(iso) ?? [];
            return (
              <div key={iso} className={`cal-day${iso === todayIso ? " is-today" : ""}`}>
                <span>{day}</span>
                {entries.length > 0 && (
                  <span className="cal-dots">
                    {entries.map((e, j) => (
                      <i key={j} className={`cal-dot is-${e.status}`} />
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="cal-legend">
          <span>
            <i className="cal-dot is-scheduled" /> 상환 예정
          </span>
          <span>
            <i className="cal-dot is-paid" /> 상환 완료
          </span>
          <span>
            <i className="cal-dot is-overdue" /> 연체
          </span>
        </div>
      </div>

      {data && (
        <div className="card mypage-section">
          <div className="stat-rows">
            <div className="row-between">
              <span>상환 완료 원금</span>
              <strong>{fmtWon(data.monthly.principal_done)}</strong>
            </div>
            <div className="row-between">
              <span>상환 예정 원금</span>
              <strong>{fmtWon(data.monthly.principal_scheduled)}</strong>
            </div>
            <div className="row-between">
              <span>상환 완료 이자 (세후)</span>
              <strong>{fmtWon(data.monthly.interest_done_net)}</strong>
            </div>
            <div className="row-between">
              <span>상환 예정 이자 (세후)</span>
              <strong>{fmtWon(data.monthly.interest_scheduled_net)}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
