import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/shared/session", () => ({
  useMe: () => ({ data: { id: 1, email: "a@b.c", name: "u" } }),
}));

vi.mock("./use-product-stream", () => ({
  useProductStream: () => undefined,
}));

import { api } from "@/shared/api";

import ProductBrowser from "./product-browser";

import type { ReactNode } from "react";

const renderBrowser = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<ProductBrowser products={[]} />, { wrapper });
};

afterEach(cleanup);

describe("ProductBrowser notify toggle", () => {
  it("hydrates the toggle from GET /api/notifications/settings", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ enabled: true } as never);
    renderBrowser();
    await waitFor(() => expect(get).toHaveBeenCalledWith("/api/notifications/settings"));
    const btn = await screen.findByRole("button", {
      name: /신규 상품 알림/,
    });
    await waitFor(() => expect(btn.className).toContain("is-active"));
    expect(btn.textContent).toContain("신규 상품 알림 끄기");
  });

  it("posts the inverse state when toggled", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ enabled: false } as never);
    const post = vi.spyOn(api, "post").mockResolvedValue({ new_product: true } as never);
    renderBrowser();
    const btn = await screen.findByRole("button", {
      name: /신규 상품 알림 받기/,
    });
    fireEvent.click(btn);
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/api/notifications/settings", {
        new_product: true,
      }),
    );
    await waitFor(() => expect(btn.className).toContain("is-active"));
  });
});
