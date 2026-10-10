import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import SignupTerms from "./signup-terms";

afterEach(cleanup);

const box = (el: HTMLElement) => el as HTMLInputElement;

describe("SignupTerms", () => {
  it("checks every term when the master box is checked", () => {
    const { getByRole } = render(<SignupTerms />);
    const master = box(getByRole("checkbox", { name: "모두 동의해요" }));
    fireEvent.click(master);
    expect(master.checked).toBe(true);
    const marketing = box(
      getByRole("checkbox", { name: "(선택) 마케팅 소식 받기" }),
    );
    expect(marketing.checked).toBe(true);
  });

  it("unchecks the master box when a term is unchecked", () => {
    const { getByRole } = render(<SignupTerms />);
    const master = box(getByRole("checkbox", { name: "모두 동의해요" }));
    fireEvent.click(master);
    const marketing = box(
      getByRole("checkbox", { name: "(선택) 마케팅 소식 받기" }),
    );
    fireEvent.click(marketing);
    expect(marketing.checked).toBe(false);
    expect(master.checked).toBe(false);
  });
});
