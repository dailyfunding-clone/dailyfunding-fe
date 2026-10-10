import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/shared/api")>();
  return { ...mod, apiFetch: vi.fn() };
});

import { apiFetch } from "@/shared/api";

import ApplyForm from "./apply-form";

const apiFetchMock = vi.mocked(apiFetch);

afterEach(cleanup);

const response = (ok: boolean, body: unknown = {}) =>
  ({
    ok,
    json: async () => body,
  }) as unknown as Awaited<ReturnType<typeof apiFetch>>;

const formOf = (name: RegExp | string) =>
  screen.getByRole("button", { name }).closest("form") as HTMLFormElement;

const submitInfoStep = () => {
  fireEvent.change(screen.getByLabelText(/^이름/), {
    target: { value: "홍길동" },
  });
  fireEvent.change(screen.getByLabelText(/연락처/), {
    target: { value: "01012345678" },
  });
  fireEvent.change(screen.getByLabelText(/이메일/), {
    target: { value: "a@b.co" },
  });
  fireEvent.click(screen.getByRole("checkbox", { name: /개인정보 수집·이용/ }));
  fireEvent.submit(formOf("다음"));
};

const fillFundsStep = () => {
  fireEvent.change(screen.getByLabelText(/필요 자금/), {
    target: { value: "50000000" },
  });
  fireEvent.change(screen.getByLabelText(/대출 기간/), {
    target: { value: "12" },
  });
};

const submitFundsStep = async () => {
  await screen.findByLabelText(/필요 자금/);
  fillFundsStep();
  fireEvent.submit(formOf(/신청하기/));
  await waitFor(() => expect(apiFetchMock).toHaveBeenCalled());
};

describe("ApplyForm idempotency", () => {
  it("reuses the same Idempotency-Key across retries of one draft", async () => {
    apiFetchMock
      .mockResolvedValueOnce(response(false, { message: "실패" }))
      .mockResolvedValueOnce(response(true, { application_id: 7 }));
    render(<ApplyForm />);
    submitInfoStep();
    await submitFundsStep();
    await screen.findByText("실패");
    fillFundsStep();
    fireEvent.submit(formOf(/신청하기/));
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(2));
    const first = apiFetchMock.mock.calls[0][1]?.idempotencyKey;
    const second = apiFetchMock.mock.calls[1][1]?.idempotencyKey;
    expect(first).toBeTruthy();
    expect(second).toBe(first);
  });
});
