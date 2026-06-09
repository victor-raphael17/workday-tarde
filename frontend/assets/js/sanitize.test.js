import { describe, expect, it } from "vitest";
import { escapeHtml, escapeHtmlAttr } from "./sanitize.js";

describe("sanitize.js", () => {
  describe("escapeHtml", () => {
    it("escapes HTML tags", () => {
      expect(escapeHtml("<img>")).toBe("&lt;img&gt;");
      expect(escapeHtml("<script>alert('xss')</script>")).toContain("&lt;script&gt;");
    });

    it("escapes script payloads as text", () => {
      expect(escapeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
      );
    });

    it("escapes event-handler payloads without leaving raw tags or quotes", () => {
      const escaped = escapeHtml('<img src=x onerror="alert()">');

      expect(escaped).toBe("&lt;img src=x onerror=&quot;alert()&quot;&gt;");
      expect(escaped).not.toContain("<img");
      expect(escaped).not.toContain('"');
    });

    it("escapes ampersands", () => {
      expect(escapeHtml("A & B")).toBe("A &amp; B");
    });

    it("escapes double and single quotes", () => {
      expect(escapeHtml('He said "hello" and it\'s ok')).toBe(
        "He said &quot;hello&quot; and it&#39;s ok",
      );
    });

    it("handles null, undefined, and empty values", () => {
      expect(escapeHtml(null)).toBe("");
      expect(escapeHtml(undefined)).toBe("");
      expect(escapeHtml("")).toBe("");
    });

    it("preserves safe text and stringifies primitive values", () => {
      expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
      expect(escapeHtml(0)).toBe("0");
      expect(escapeHtml(false)).toBe("false");
    });
  });

  describe("escapeHtmlAttr", () => {
    it("escapes attribute values", () => {
      const escaped = escapeHtmlAttr('value with "quotes"');

      expect(escaped).toContain("&quot;");
    });

    it("escapes single quotes", () => {
      expect(escapeHtmlAttr("it's")).toContain("&#39;");
    });

    it("escapes ampersands in attributes", () => {
      expect(escapeHtmlAttr("a&b")).toBe("a&amp;b");
    });
  });
});
