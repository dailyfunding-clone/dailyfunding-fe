"use client";

import { useState } from "react";

import { ApiRequestError, api } from "@/shared/api";
import { useAppNavigate } from "@/shared/lib";
import { useMe } from "@/shared/session";

const EnterButton = ({ eventId }: { eventId: number }) => {
  const me = useMe();
  const nav = useAppNavigate();
  const [done, setDone] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const enter = async () => {
    if (!me.data) {
      nav.push("/auth/signin", "로그인");
      return;
    }
    setPending(true);
    setError("");
    try {
      const json = await api.request<{
        entered?: boolean;
        reward_points?: number;
        message?: string;
      }>("post", `/api/events/${eventId}/enter`);
      setDone(json.reward_points ?? 0);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 401) {
          nav.push("/auth/signin", "로그인");
          return;
        }
        setError(
          err.message ?? "참여에 실패했어요. 잠시 후 다시 시도해 주세요",
        );
      } else {
        setError("네트워크 오류가 발생했어요. 다시 시도해 주세요");
      }
    } finally {
      setPending(false);
    }
  };

  if (done !== null) {
    return (
      <div className="event-entered">
        참여가 완료됐어요
        {done > 0 && <small>{done.toLocaleString("ko-KR")}P가 적립됐어요</small>}
      </div>
    );
  }

  return (
    <>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button
        type="button"
        className="btn btn-primary"
        onClick={enter}
        disabled={pending}
      >
        {pending ? "참여 중..." : "이벤트 참여하기"}
      </button>
    </>
  );
};

export default EnterButton;
