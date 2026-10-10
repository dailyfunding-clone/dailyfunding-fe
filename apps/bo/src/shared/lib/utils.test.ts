import { describe, expect, it } from "vitest";

import { toIso, toLocalInput } from "./utils";

describe("toLocalInput", () => {
  it("converts ISO to local datetime-local value", () => {
    const iso = "2026-10-10T05:30:00Z";
    const expected = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    expect(toLocalInput(iso)).toBe(
      `${expected.getFullYear()}-${pad(expected.getMonth() + 1)}-${pad(expected.getDate())}T${pad(expected.getHours())}:${pad(expected.getMinutes())}`,
    );
  });

  it("returns empty string for missing or invalid input", () => {
    expect(toLocalInput(null)).toBe("");
    expect(toLocalInput(undefined)).toBe("");
    expect(toLocalInput("not-a-date")).toBe("");
  });
});

describe("toIso", () => {
  it("round-trips a datetime-local value back to the same instant", () => {
    const iso = "2026-10-10T05:30:00.000Z";
    expect(toIso(toLocalInput(iso))).toBe(iso);
  });

  it("returns null for invalid input", () => {
    expect(toIso("not-a-date")).toBeNull();
  });
});
