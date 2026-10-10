import { ApiRequestError } from "../api";

export const errMsg = (e: unknown) =>
  e instanceof ApiRequestError ? e.message : "요청에 실패했어요";

export const fmtDateTime = (iso: string | null | undefined) => {
  const local = toLocalInput(iso);
  return local ? local.replace("T", " ") : "-";
};

export const today = () => toLocalInput(new Date().toISOString()).slice(0, 10);

export const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const toIso = (local: string) => {
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
