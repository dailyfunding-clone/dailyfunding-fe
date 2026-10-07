import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  fetchJson,
  fileUrl,
  fmtDate,
} from "@/entities/content";
import { AppLink } from "@/shared/ui";

import type { Metadata } from "next";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> => {
  const { id } = await params;
  const notice = await fetchJson<{ title?: string }>(`/notices/${id}`);
  return { title: notice?.title ?? "공지사항" };
};


const CATEGORY_LABEL: Record<string, string> = {
  important: "중요공지",
  notice: "공지",
};

type NoticeDetail = {
  id: number;
  category: string;
  title: string;
  body: string;
  attachments: unknown[];
  created_at: string;
};

const attachmentOf = (v: unknown): { name: string; url: string } | null => {
  if (typeof v === "string") {
    return { name: v.split("/").pop() || v, url: fileUrl(v) };
  }
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const url = String(o.url ?? o.file ?? o.path ?? "");
    const name = String(o.name ?? o.filename ?? url.split("/").pop() ?? "첨부파일");
    return { name, url: fileUrl(url) };
  }
  return null;
};

const NoticeDetailContent = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const notice = await fetchJson<NoticeDetail>(`/notices/${id}`);
  if (!notice) notFound();
  const attachments = (notice.attachments ?? [])
    .map(attachmentOf)
    .filter((a): a is { name: string; url: string } => a !== null);
  return (
    <article>
      <header className="notice-head">
        <span
          className={`badge${notice.category === "important" ? " badge-accent" : ""}`}
        >
          {CATEGORY_LABEL[notice.category] ?? notice.category}
        </span>
        <h2>{notice.title}</h2>
        <time>{fmtDate(notice.created_at)}</time>
      </header>
      <div className="notice-body">{notice.body}</div>
      {attachments.length > 0 && (
        <ul className="notice-files">
          {attachments.map((a, i) => (
            <li key={i}>
              {a.url ? (
                <a href={a.url} download target="_blank" rel="noopener noreferrer">
                  {a.name}
                </a>
              ) : (
                a.name
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="notice-back">
        <AppLink href="/cs/notice" className="btn btn-outline">
          목록으로
        </AppLink>
      </div>
    </article>
  );
};

const NoticeDetailPage = (props: { params: Promise<{ id: string }> }) => (
  <Suspense fallback={null}>
    <NoticeDetailContent {...props} />
  </Suspense>
);

export default NoticeDetailPage;
