"use client";

import { useQuery } from "@tanstack/react-query";

import { fmtDate } from "@/entities/content";
import { AuthGate } from "@/features/auth";
import { api } from "@/shared/api";
import { useDocumentTitle } from "@/shared/lib";

import "./notification.scss";

type Notification = {
  id: number;
  kind: string;
  title: string;
  body: string;
  created_at: string;
};

const NotificationPage = () => (
  <AuthGate title="알림">
    <NotificationList />
  </AuthGate>
);

const NotificationList = () => {
  useDocumentTitle("알림");
  const { data, isPending, isError, refetch } = useQuery<{ results: Notification[] }>({
    queryKey: ["notifications"],
    queryFn: () => api.request<{ results: Notification[] }>("get", "/api/notifications"),
  });

  return (
    <main className="container">
      <h1 className="page-title">알림</h1>
      {isPending ? (
        <div className="empty">불러오는 중…</div>
      ) : isError ? (
        <div className="empty">
          <p>알림을 불러오지 못했어요</p>
          <button type="button" className="btn btn-outline" onClick={() => void refetch()}>
            다시 시도
          </button>
        </div>
      ) : !data || data.results.length === 0 ? (
        <div className="empty">새 알림이 없어요</div>
      ) : (
        <ul className="notif-list">
          {data.results.map((n) => (
            <li key={n.id} className="notif-row">
              <span className="notif-kind">{n.kind}</span>
              <div className="notif-main">
                <span className="notif-title">{n.title}</span>
                <span className="notif-body">{n.body}</span>
              </div>
              <span className="notif-date">{fmtDate(n.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default NotificationPage;
