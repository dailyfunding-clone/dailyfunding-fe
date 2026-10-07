export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("ko-KR") : "";
