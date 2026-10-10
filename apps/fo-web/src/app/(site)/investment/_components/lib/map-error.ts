import { NetworkError, TimeoutError } from "ky";

import { ApiRequestError, fmtWon } from "@/shared/api";

import { INVEST_ERROR } from "../constants";

export type OrderError = { text: string; code?: string; kind: "network" | "rejected" | "unknown" };

export const mapError = (e: unknown): OrderError => {
  if (
    e instanceof NetworkError ||
    e instanceof TimeoutError ||
    (e instanceof TypeError && /failed to fetch|network|load failed/i.test(e.message))
  ) {
    return { kind: "network", text: "연결이 끊겼어요. 같은 주문으로 결과를 다시 확인해 주세요" };
  }
  if (!(e instanceof ApiRequestError))
    return {
      kind: "unknown",
      text: "주문 결과를 확인하지 못했어요. 같은 주문으로 다시 확인해 주세요",
    };
  if (e.status >= 500)
    return {
      kind: "network",
      text: "주문 결과를 확인하지 못했어요. 같은 주문으로 다시 확인해 주세요",
    };
  const kind = "rejected";
  const { code, details, message } = e;
  const num = (k: string) => (typeof details?.[k] === "number" ? (details[k] as number) : null);
  switch (code) {
    case "GRADE_LIMIT_EXCEEDED": {
      const remain = num("remaining_limit");
      return {
        code,
        kind,
        text:
          remain !== null
            ? `투자 한도를 초과했어요. 투자 가능 한도 ${fmtWon(remain)}`
            : INVEST_ERROR[code],
      };
    }
    case "BORROWER_LIMIT_EXCEEDED": {
      const remain = num("remaining_limit");
      return {
        code,
        kind,
        text:
          remain !== null
            ? `동일 차입자 한도를 초과했어요. 잔여 한도 ${fmtWon(remain)}`
            : INVEST_ERROR[code],
      };
    }
    case "INSUFFICIENT_DEPOSIT": {
      const avail = num("available");
      return {
        code,
        kind,
        text:
          avail !== null
            ? `예치금이 부족해요. 사용 가능 금액 ${fmtWon(avail)}`
            : INVEST_ERROR[code],
      };
    }
    case "INSUFFICIENT_REMAINING": {
      const remain = num("remaining");
      return {
        code,
        kind,
        text:
          remain !== null
            ? `잔여 모집금액을 초과했어요. 남은 금액 ${fmtWon(remain)}`
            : INVEST_ERROR[code],
      };
    }
    case "SUITABILITY_REQUIRED":
      return { kind, code, text: INVEST_ERROR[code] };
    default:
      return {
        kind,
        code,
        text: INVEST_ERROR[code ?? ""] ?? (message || "투자에 실패했어요") ?? "투자에 실패했어요",
      };
  }
};
