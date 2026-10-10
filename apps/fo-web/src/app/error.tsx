"use client";

import { useEffect } from "react";

const RootError = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="container">
      <div className="gate">
        <p>화면을 불러오지 못했어요</p>
        <button type="button" className="btn btn-primary" onClick={reset}>
          다시 시도하기
        </button>
      </div>
    </main>
  );
};

export default RootError;
