import assert from "node:assert/strict";
import test from "node:test";

import { escapeHtml, escapeHtmlAttr } from "./sanitize.js";

test("escapeHtml escapes HTML tags", () => {
  assert.equal(escapeHtml("<img>"), "&lt;img&gt;");
});

test("escapeHtml escapes script payloads", () => {
  assert.equal(
    escapeHtml("<script>alert('xss')</script>"),
    "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
  );
});

test("escapeHtml escapes image event-handler payloads as text", () => {
  assert.equal(
    escapeHtml('<img src=x onerror="alert()">'),
    "&lt;img src=x onerror=&quot;alert()&quot;&gt;"
  );
});

test("escapeHtml escapes ampersands and quotes", () => {
  assert.equal(escapeHtml('A & B "quoted"'), "A &amp; B &quot;quoted&quot;");
});

test("escapeHtml handles empty and nullish values", () => {
  assert.equal(escapeHtml(""), "");
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
});

test("escapeHtml preserves non-string values as escaped text", () => {
  assert.equal(escapeHtml(0), "0");
  assert.equal(escapeHtml(false), "false");
});

test("escapeHtmlAttr escapes quotes for attribute contexts", () => {
  assert.equal(
    escapeHtmlAttr('" onclick="alert(1)" data-test=\'x\''),
    "&quot; onclick=&quot;alert(1)&quot; data-test=&#39;x&#39;"
  );
});
