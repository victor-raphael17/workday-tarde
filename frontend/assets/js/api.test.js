import { describe, expect, it } from "vitest";
import { formatDate, initials, toneClass } from "./api.js";

describe("api.js helpers", () => {
  describe("formatDate", () => {
    it("formats ISO dates for display", () => {
      expect(formatDate("2026-06-08")).toBe("08 Jun 2026");
    });

    it("handles values that include time", () => {
      expect(formatDate("2026-06-08T14:30:00")).toBe("08 Jun 2026");
    });

    it("returns an em dash for empty values", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("")).toBe("—");
    });

    it("returns invalid date input as text", () => {
      expect(formatDate("invalid-date")).toBe("invalid-date");
    });
  });

  describe("initials", () => {
    it("extracts initials from names", () => {
      expect(initials("Jade Okafor")).toBe("JO");
      expect(initials("John")).toBe("J");
    });

    it("uses the first two initials from longer names", () => {
      expect(initials("Mary Jane Watson")).toBe("MJ");
    });

    it("handles empty values and extra spacing", () => {
      expect(initials(null)).toBe("");
      expect(initials(undefined)).toBe("");
      expect(initials("")).toBe("");
      expect(initials("  John   Doe  ")).toBe("JD");
    });
  });

  describe("toneClass", () => {
    it("maps known status keys to badge classes", () => {
      expect(toneClass("in")).toBe("status-success");
      expect(toneClass("low")).toBe("status-warning");
      expect(toneClass("out")).toBe("status-danger");
      expect(toneClass("controlled")).toBe("status-controlled");
    });

    it("falls back to neutral for unknown status keys", () => {
      expect(toneClass("missing")).toBe("status-neutral");
      expect(toneClass(undefined)).toBe("status-neutral");
    });
  });
});
