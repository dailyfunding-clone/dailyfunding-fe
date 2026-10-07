export const STATUS_LABEL: Record<string, string> = {
  ongoing: "진행중",
  winners: "당첨발표",
  ended: "종료",
};

export const dday = (endAt: string | null) => {
  if (!endAt) return null;
  const diff = Math.ceil((new Date(endAt).getTime() - Date.now()) / 86_400_000);
  return diff >= 0 ? `D-${diff}` : null;
};
