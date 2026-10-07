"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActionState, useState } from "react";
import { z } from "zod";

import { api } from "@/shared/api";
import { apiDelete, apiPatch } from "@/shared/api";
import {
  contentFieldSchema,
  parseForm,
  type FormState,
} from "@/shared/lib";
import { errMsg } from "@/shared/lib";

import { AdminModal } from "../_components";

type Row = { id: number } & Record<string, unknown>;

type FieldDef = {
  name: string;
  label: string;
  kind: "text" | "textarea" | "number" | "select" | "date" | "datetime" | "json";
  options?: { value: string; label: string }[];
  required?: boolean;
  jsonDefault?: unknown;
};

type ContentDef = {
  key: string;
  label: string;
  itemLabel: string;
  columns: { key: string; label: string }[];
  fields: FieldDef[];
};

const TABS: ContentDef[] = [
  {
    key: "notices",
    label: "공지",
    itemLabel: "공지사항",
    columns: [
      { key: "category", label: "분류" },
      { key: "title", label: "제목" },
    ],
    fields: [
      {
        name: "category",
        label: "분류",
        kind: "select",
        required: true,
        options: [
          { value: "notice", label: "공지" },
          { value: "important", label: "중요공지" },
        ],
      },
      { name: "title", label: "제목", kind: "text", required: true },
      { name: "body", label: "본문", kind: "textarea", required: true },
      {
        name: "attachments",
        label: "첨부파일 (JSON 배열)",
        kind: "json",
        jsonDefault: [],
      },
    ],
  },
  {
    key: "faqs",
    label: "FAQ",
    itemLabel: "FAQ",
    columns: [
      { key: "category", label: "분류" },
      { key: "question", label: "질문" },
    ],
    fields: [
      { name: "category", label: "분류", kind: "text", required: true },
      { name: "question", label: "질문", kind: "text", required: true },
      { name: "answer", label: "답변", kind: "textarea", required: true },
    ],
  },
  {
    key: "events",
    label: "이벤트",
    itemLabel: "이벤트",
    columns: [
      { key: "title", label: "제목" },
      { key: "status", label: "상태" },
      { key: "start_at", label: "시작" },
      { key: "end_at", label: "종료" },
    ],
    fields: [
      { name: "title", label: "제목", kind: "text", required: true },
      { name: "summary", label: "요약", kind: "text" },
      { name: "body", label: "본문", kind: "textarea" },
      {
        name: "status",
        label: "상태",
        kind: "select",
        options: [
          { value: "ongoing", label: "진행중" },
          { value: "winners", label: "당첨자 발표" },
          { value: "ended", label: "종료" },
        ],
      },
      { name: "thumbnail_url", label: "썸네일 URL", kind: "text" },
      { name: "reward_points", label: "리워드 포인트", kind: "number" },
      { name: "start_at", label: "시작일시", kind: "datetime" },
      { name: "end_at", label: "종료일시", kind: "datetime" },
    ],
  },
  {
    key: "disclosures",
    label: "공시",
    itemLabel: "공시",
    columns: [
      { key: "year", label: "연도" },
      { key: "month", label: "월" },
    ],
    fields: [
      { name: "year", label: "연도", kind: "number", required: true },
      { name: "month", label: "월", kind: "number", required: true },
      { name: "kpi", label: "KPI (JSON)", kind: "json", jsonDefault: {} },
      {
        name: "management",
        label: "경영현황 (JSON)",
        kind: "json",
        jsonDefault: {},
      },
      {
        name: "operations",
        label: "운영현황 (JSON)",
        kind: "json",
        jsonDefault: {},
      },
      {
        name: "internal",
        label: "내부통제 (JSON)",
        kind: "json",
        jsonDefault: {},
      },
    ],
  },
  {
    key: "news",
    label: "언론",
    itemLabel: "언론보도",
    columns: [
      { key: "title", label: "제목" },
      { key: "source", label: "매체" },
      { key: "published_at", label: "게재일" },
    ],
    fields: [
      { name: "title", label: "제목", kind: "text", required: true },
      { name: "source", label: "매체명", kind: "text" },
      { name: "url", label: "기사 URL", kind: "text", required: true },
      { name: "thumbnail_url", label: "썸네일 URL", kind: "text" },
      { name: "published_at", label: "게재일", kind: "date", required: true },
    ],
  },
];

const cellText = (v: unknown) => {
  if (v === null || v === undefined || v === "") return "-";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return s.length > 60 ? `${s.slice(0, 60)}…` : s;
};

const fieldDefault = (f: FieldDef, row: Row | null) => {
  const v = row?.[f.name];
  if (f.kind === "json")
    return JSON.stringify(v ?? f.jsonDefault ?? {}, null, 2);
  if (f.kind === "datetime" && typeof v === "string") return v.slice(0, 16);
  return v === null || v === undefined ? "" : String(v);
};

const ContentForm = ({
  def,
  row,
  onClose,
}: {
  def: ContentDef;
  row: Row | null;
  onClose: () => void;
}) => {
  const qc = useQueryClient();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const schema = z.object(
        Object.fromEntries(
          def.fields.map((f) => [
            f.name,
            contentFieldSchema(f.name, f.label, f.kind, f.required),
          ]),
        ),
      );
      const parsed = parseForm(schema, formData);
      if ("error" in parsed) return { error: parsed.error };
      const body: Record<string, unknown> = {};
      for (const f of def.fields) {
        const raw = parsed.data[f.name].trim();
        if (f.kind === "number") {
          if (raw !== "") body[f.name] = Number(raw);
          continue;
        }
        if (f.kind === "json") {
          body[f.name] = raw === "" ? (f.jsonDefault ?? {}) : JSON.parse(raw);
          continue;
        }
        if (f.kind === "date" || f.kind === "datetime") {
          body[f.name] = raw === "" ? null : raw;
          continue;
        }
        body[f.name] = raw;
      }
      try {
        if (row) {
          await apiPatch(`/api/admin/${def.key}/${row.id}`, body);
        } else {
          await api.request("post", `/api/admin/${def.key}`, body);
        }
        qc.invalidateQueries({ queryKey: ["admin", "contents", def.key] });
        onClose();
        return null;
      } catch (e) {
        return { error: errMsg(e) };
      }
    },
    null,
  );

  return (
    <AdminModal
      title={row ? `${def.itemLabel} 수정` : `${def.itemLabel} 등록`}
      onClose={onClose}
    >
      <form action={formAction}>
        {def.fields.map((f) => (
          <div className="form-row" key={f.name}>
            <label className="field">
              <span className="field-label">
                {f.label}
                {f.required ? " *" : ""}
              </span>
              {f.kind === "textarea" || f.kind === "json" ? (
                <textarea
                  className="input"
                  name={f.name}
                  defaultValue={fieldDefault(f, row)}
                  required={f.required}
                />
              ) : f.kind === "select" ? (
                <select
                  className="input"
                  name={f.name}
                  defaultValue={fieldDefault(f, row) || f.options?.[0]?.value}
                  required={f.required}
                >
                  {(f.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  name={f.name}
                  type={
                    f.kind === "number"
                      ? "number"
                      : f.kind === "date"
                        ? "date"
                        : f.kind === "datetime"
                          ? "datetime-local"
                          : "text"
                  }
                  defaultValue={fieldDefault(f, row)}
                  required={f.required}
                />
              )}
            </label>
          </div>
        ))}
        {state?.error && <p className="form-error">{state.error}</p>}
        <div className="admin-modal-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={pending}
          >
            취소
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={pending}
          >
            {row ? "수정" : "등록"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};

const ContentSection = ({ def }: { def: ContentDef }) => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [error, setError] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "contents", def.key],
    queryFn: () =>
      api.request<{ results: Row[] }>("get", `/api/admin/${def.key}`),
  });
  const del = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/${def.key}/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "contents", def.key] }),
    onError: (e) => setError(errMsg(e)),
  });

  const rows = data?.results ?? [];

  return (
    <>
      <div className="admin-head">
        <h1>{def.itemLabel}</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setEditing("new")}
        >
          등록
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {isLoading ? (
        <div className="empty">불러오는 중이에요</div>
      ) : rows.length === 0 ? (
        <div className="empty">등록된 {def.itemLabel}이(가) 없어요</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>번호</th>
                {def.columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  {def.columns.map((c) => (
                    <td key={c.key}>{cellText(r[c.key])}</td>
                  ))}
                  <td>
                    <div className="admin-actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setEditing(r)}
                      >
                        수정
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        disabled={del.isPending}
                        onClick={() => {
                          if (window.confirm("삭제할까요?")) del.mutate(r.id);
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <ContentForm
          def={def}
          row={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
};

const ContentsPage = () => {
  const [tab, setTab] = useState(TABS[0].key);
  const def = TABS.find((t) => t.key === tab) ?? TABS[0];
  return (
    <>
      <div className="tabs" style={{ marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? "is-active" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ContentSection key={def.key} def={def} />
    </>
  );
};

export default ContentsPage;
