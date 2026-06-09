import { describe, expect, it } from "vitest";
import { escapeHtml, escapeHtmlAttr } from "./sanitize.js";

describe("sanitize helpers", () => {
  it("escapes HTML tags", () => {
    expect(escapeHtml("<img>")).toBe("&lt;img&gt;");
  });

  it("escapes script tags", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes quoted attributes", () => {
    expect(escapeHtmlAttr('"onerror="alert(1)"')).toBe("&quot;onerror=&quot;alert(1)&quot;");
  });

  it("handles nullish and non-string values safely", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(42)).toBe("42");
  });
});
