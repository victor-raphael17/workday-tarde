import { describe, expect, it } from 'vitest';

import { escapeHtml, escapeHtmlAttr } from './sanitize.js';

describe('sanitize helpers', () => {
  it('escapes HTML tags', () => {
    expect(escapeHtml('<img>')).toBe('&lt;img&gt;');
  });

  it('escapes script payloads', () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      '&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;'
    );
  });

  it('escapes image event-handler payloads as text', () => {
    expect(escapeHtml('<img src=x onerror="alert()">')).toBe(
      '&lt;img src=x onerror=&quot;alert()&quot;&gt;'
    );
  });

  it('escapes ampersands and quotes', () => {
    expect(escapeHtml('A & B "quoted"')).toBe('A &amp; B &quot;quoted&quot;');
  });

  it('handles empty and nullish values', () => {
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('preserves non-string values as escaped text', () => {
    expect(escapeHtml(0)).toBe('0');
    expect(escapeHtml(false)).toBe('false');
  });

  it('escapes quotes for attribute contexts', () => {
    expect(escapeHtmlAttr('" onclick="alert(1)" data-test=\'x\'')).toBe(
      '&quot; onclick=&quot;alert(1)&quot; data-test=&#39;x&#39;'
    );
  });
});
