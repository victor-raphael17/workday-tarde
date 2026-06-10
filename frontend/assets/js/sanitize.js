const HTML_ESCAPE = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function normalize(value) {
  return value === null || value === undefined ? '' : String(value);
}

/**
 * Escape untrusted text before interpolating it into an innerHTML template.
 */
export function escapeHtml(value) {
  return normalize(value).replace(/[&<>"']/g, (char) => HTML_ESCAPE[char]);
}

/**
 * Escape untrusted values before interpolating them into HTML attributes.
 */
export function escapeHtmlAttr(value) {
  return escapeHtml(value);
}
