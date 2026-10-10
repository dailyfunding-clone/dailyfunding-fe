import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useDocumentTitle } from "./use-document-title";

afterEach(cleanup);

describe("useDocumentTitle", () => {
  it("restores the previous title on unmount", () => {
    document.title = "base";
    const view = renderHook(() => useDocumentTitle("page"));
    expect(document.title).toBe("page");
    view.unmount();
    expect(document.title).toBe("base");
  });

  it("does not clobber a newer instance's title when an older one unmounts", () => {
    document.title = "base";
    const a = renderHook(() => useDocumentTitle("A"));
    const b = renderHook(() => useDocumentTitle("B"));
    expect(document.title).toBe("B");
    a.unmount();
    expect(document.title).toBe("B");
    b.unmount();
    expect(document.title).toBe("A");
  });
});
