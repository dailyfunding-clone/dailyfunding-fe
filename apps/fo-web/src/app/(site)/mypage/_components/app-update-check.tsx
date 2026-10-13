"use client";

import { checkAppUpdate, isInWebView } from "@dailyfunding/bridge";
import { useState } from "react";

import type { UpdateCheckStatus } from "@dailyfunding/bridge";

const LABELS: Record<UpdateCheckStatus, string> = {
  updated: "업데이트를 적용했어요",
  latest: "최신 버전이에요",
  unavailable: "앱에서 확인할 수 있어요",
  error: "업데이트 확인에 실패했어요",
};

const AppUpdateCheck = () => {
  const [status, setStatus] = useState<UpdateCheckStatus | "checking" | null>(null);
  if (!isInWebView()) return null;

  const check = () => {
    if (status === "checking") return;
    setStatus("checking");
    void checkAppUpdate().then(setStatus);
  };

  return (
    <li>
      <button
        type="button"
        className="update-check"
        onClick={check}
        disabled={status === "checking"}
      >
        {status === "checking" ? "업데이트 확인 중…" : "앱 업데이트 확인"}
        {status && status !== "checking" && <span>{LABELS[status]}</span>}
      </button>
    </li>
  );
};

export default AppUpdateCheck;
