import { ApiRequestError } from "../api";

export const errMsg = (e: unknown) =>
  e instanceof ApiRequestError ? e.message : "요청에 실패했어요";

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? iso.slice(0, 16).replace("T", " ") : "-";

export const today = () => new Date().toISOString().slice(0, 10);
