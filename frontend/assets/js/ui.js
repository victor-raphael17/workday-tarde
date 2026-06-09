/**
 * Small dependency-free UI helpers shared across pages: toast notifications and
 * a promise-based form modal (the project ships Bootstrap CSS but not its JS, so
 * these are hand-rolled to keep the bundle framework-light).
 */

import { toneClass } from "./api.js";

let toastHost = null;

export function toast(message, tone = "info") {
  if (!toastHost) {
    toastHost = document.createElement("div");
    toastHost.className = "toast-host";
    document.body.appendChild(toastHost);
  }

  const el = document.createElement("div");
  el.className = `toast-note toast-${tone}`;
  el.textContent = message;
  toastHost.appendChild(el);

  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

export function statusBadge(stateKey, label) {
  return `<span class="status-badge ${toneClass(stateKey)}">${label}</span>`;
}

/** Render a centered "empty" / "error" / "loading" placeholder string. */
export function placeholder(message, tone = "muted") {
  const cls = tone === "error" ? "text-danger" : "text-body-secondary";
  return `<div class="muted-note text-center w-100 py-4 ${cls}">${message}</div>`;
}

/**
 * Open a modal form. `fields` is an array of:
 *   { name, label, type?, required?, value?, placeholder?, options?, help? }
 * `type` may be text | number | email | date | select | checkbox.
 * Resolves to a values object, or null if cancelled.
 */
export function openForm({ title, fields, submitLabel = "Save" }) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const renderField = (field) => {
      const id = `f_${field.name}`;
      if (field.type === "select") {
        const options = (field.options || [])
          .map((opt) => {
            const value = typeof opt === "string" ? opt : opt.value;
            const label = typeof opt === "string" ? opt : opt.label;
            const selected = String(field.value ?? "") === String(value) ? "selected" : "";
            return `<option value="${value}" ${selected}>${label}</option>`;
          })
          .join("");
        return `
          <label class="modal-field">
            <span>${field.label}${field.required ? " *" : ""}</span>
            <select id="${id}" name="${field.name}" ${field.required ? "required" : ""}>${options}</select>
          </label>`;
      }
      if (field.type === "checkbox") {
        return `
          <label class="modal-field modal-field-inline">
            <input type="checkbox" id="${id}" name="${field.name}" ${field.value ? "checked" : ""}>
            <span>${field.label}</span>
          </label>`;
      }
      return `
        <label class="modal-field">
          <span>${field.label}${field.required ? " *" : ""}</span>
          <input type="${field.type || "text"}" id="${id}" name="${field.name}"
            value="${field.value ?? ""}" placeholder="${field.placeholder || ""}"
            ${field.required ? "required" : ""} ${field.step ? `step="${field.step}"` : ""}>
          ${field.help ? `<small class="text-body-secondary">${field.help}</small>` : ""}
        </label>`;
    };

    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="modal-head">
          <h2 class="section-title mb-0">${title}</h2>
          <button type="button" class="modal-close" aria-label="Close">&times;</button>
        </div>
        <form class="modal-body">
          ${fields.map(renderField).join("")}
          <div class="modal-actions">
            <button type="button" class="btn btn-outline-secondary btn-sm px-3" data-cancel>Cancel</button>
            <button type="submit" class="btn btn-success btn-sm px-3">${submitLabel}</button>
          </div>
        </form>
      </div>`;

    const close = (result) => {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
      resolve(result);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        close(null);
      }
    };

    overlay.querySelector(".modal-close").addEventListener("click", () => close(null));
    overlay.querySelector("[data-cancel]").addEventListener("click", () => close(null));
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) {
        close(null);
      }
    });
    overlay.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const values = {};
      fields.forEach((field) => {
        const input = overlay.querySelector(`#f_${field.name}`);
        values[field.name] = field.type === "checkbox" ? input.checked : input.value.trim();
      });
      close(values);
    });

    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
    const first = overlay.querySelector("input, select");
    if (first) {
      first.focus();
    }
  });
}
