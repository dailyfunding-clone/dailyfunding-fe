"use client";

import { useEffect, useRef } from "react";

let latest = 0;

export const useDocumentTitle = (title: string) => {
  const token = useRef(0);
  useEffect(() => {
    const prev = document.title;
    token.current = ++latest;
    const mine = token.current;
    document.title = title;
    return () => {
      if (latest === mine) {
        document.title = prev;
      }
    };
  }, [title]);
};
