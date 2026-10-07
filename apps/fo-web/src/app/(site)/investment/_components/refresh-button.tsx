"use client";

import { useRouter } from "next/navigation";

const RefreshButton = () => {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.refresh()}>
      새로고침
    </button>
  );
};

export default RefreshButton;
