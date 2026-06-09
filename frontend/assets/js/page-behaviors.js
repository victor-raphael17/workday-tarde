import { api, ApiError, currency, formatDate, initials, toneClass } from "./api.js";
import { openForm, placeholder, statusBadge, toast } from "./ui.js";

const POS_TAX_RATE = 0.05; // mirrors the API's TAX_RATE for the live cart preview

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function timeAgo(iso) {
  if (!iso) {
    return "";
  }
  const then = new Date(String(iso).replace(" ", "T"));
  const diffMin = Math.round((Date.now() - then.getTime()) / 60000);
  if (Number.isNaN(diffMin)) {
    return "";
  }
  if (diffMin < 1) {
    return "just now";
  }
  if (diffMin < 60) {
    return `${diffMin} min ago`;
  }
  const hours = Math.round(diffMin / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }
  return `${Math.round(hours / 24)} d ago`;
}

function reportError(error) {
  const message = error instanceof ApiError ? error.message : "Something went wrong.";
  toast(message, "error");
  return message;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

async function bindDashboard() {
  const set = (key, value) => {
    const el = document.querySelector(`[data-metric="${key}"]`);
    if (el) {
      el.textContent = value;
    }
  };

  let summary;
  try {
    summary = await api.dashboard();
  } catch (error) {
    reportError(error);
    return;
  }

  const sales = summary.sales_today;
  set("sales-total", currency.format(sales.total));
  set("sales-count", sales.count);
  set("sales-avg", `avg ${currency.format(sales.count ? sales.total / sales.count : 0)} / sale`);
  set("queue", summary.dispensing_queue.open);
  set("queue-sub", `${summary.dispensing_queue.verifying} awaiting verification`);
  set("low-stock", summary.alerts.low_stock);

  // Weekly sales chart
  const chart = document.querySelector("[data-sales-chart]");
  if (chart) {
    const week = summary.sales_week || [];
    const max = Math.max(1, ...week.map((d) => d.total));
    const total = week.reduce((sum, d) => sum + d.total, 0);
    const totalEl = document.querySelector("[data-sales-week-total]");
    if (totalEl) {
      totalEl.textContent = `${currency.format(total)} total`;
    }
    chart.innerHTML = week.length
      ? week
          .map((d, i) => {
            const height = Math.max(6, Math.round((d.total / max) * 100));
            const peak = d.total === max && total > 0 ? "sales-bar-peak" : "";
            const label = new Date(`${d.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" });
            return `<div class="sales-bar-col"><div class="sales-bar ${peak}" style="height:${height}%" title="${currency.format(d.total)}"></div><span class="mono">${label}</span></div>`;
          })
          .join("")
      : placeholder("No sales recorded this week.");
  }

  // Attention list (low stock / out / expiring)
  const attention = document.querySelector("[data-attention-list]");
  if (attention) {
    const items = (summary.low_stock || []).slice(0, 5);
    attention.innerHTML = items.length
      ? items
          .map((m) => {
            const tone = m.controlled ? "controlled" : m.status;
            const label = m.controlled ? "Controlled" : m.status_label;
            const note = m.controlled
              ? `${m.on_hand} on hand. Controlled substance.`
              : `${m.on_hand} on hand. Reorder at ${m.reorder_point}.`;
            const icon = m.status === "out" ? "package-x" : m.controlled ? "shield-alert" : "pill";
            const avatarMod = m.controlled ? "status-avatar-controlled" : "";
            return `
              <div class="list-group-item border-0 px-4 py-3">
                <div class="d-flex align-items-center gap-3">
                  <span class="status-avatar ${avatarMod}"><i data-lucide="${icon}"></i></span>
                  <div class="flex-grow-1">
                    <div class="fw-semibold">${m.name} ${m.strength || ""}</div>
                    <div class="small text-body-secondary mono">${note}</div>
                  </div>
                  ${statusBadge(tone, label)}
                </div>
              </div>`;
          })
          .join("")
      : placeholder("Nothing needs attention. Stock levels look healthy.");
  }

  // Dispensing queue table
  const queueBody = document.querySelector("[data-dispense-queue]");
  if (queueBody) {
    try {
      const scripts = (await api.prescriptions()).filter((rx) =>
        ["new", "verifying", "ready"].includes(rx.state)
      );
      queueBody.innerHTML = scripts.length
        ? scripts
            .slice(0, 6)
            .map((rx) => {
              const flag = rx.flag
                ? statusBadge(rx.flag === "controlled" ? "controlled" : "out", rx.flag[0].toUpperCase() + rx.flag.slice(1))
                : `<span class="text-body-secondary small">None</span>`;
              const stateLabel = rx.state[0].toUpperCase() + rx.state.slice(1);
              const avatarMod = rx.medication.controlled ? "table-avatar-controlled" : "";
              return `
                <tr>
                  <td>
                    <div class="d-flex align-items-center gap-3">
                      <span class="table-avatar ${avatarMod}">${initials(rx.patient.name)}</span>
                      <div>
                        <div class="fw-semibold">${rx.patient.name}</div>
                        <div class="small text-body-secondary mono">${rx.code}</div>
                      </div>
                    </div>
                  </td>
                  <td>${rx.medication.name} ${rx.medication.strength || ""}</td>
                  <td>${rx.prescriber}</td>
                  <td>${flag}</td>
                  <td>${statusBadge(rx.state, stateLabel)}</td>
                </tr>`;
            })
            .join("")
        : `<tr><td colspan="5">${placeholder("The dispensing queue is clear.")}</td></tr>`;
    } catch (error) {
      queueBody.innerHTML = `<tr><td colspan="5">${placeholder(reportError(error), "error")}</td></tr>`;
    }
  }

  refreshIcons();
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

async function bindInventory() {
  const tbody = document.querySelector("[data-inventory-body]");
  const search = document.querySelector("[data-inventory-search]");
  const chips = Array.from(document.querySelectorAll("[data-stock-filter]"));
  const addButton = document.querySelector("[data-add-medication]");
  if (!tbody) {
    return;
  }

  const detailFields = {
    title: document.querySelector("[data-detail='name']"),
    subtitle: document.querySelector("[data-detail='subtitle']"),
    onHand: document.querySelector("[data-detail='onHand']"),
    reorder: document.querySelector("[data-detail='reorder']"),
    expiry: document.querySelector("[data-detail='expiry']"),
    price: document.querySelector("[data-detail='price']"),
    badge: document.querySelector("[data-detail='badge']"),
  };
  const receiveChip = document.querySelector("[data-detail-action='receive']");

  let medications = [];
  let activeFilter = "all";
  let selectedId = null;

  const matchesFilter = (m) => {
    if (activeFilter === "low") {
      return m.status === "low" || m.status === "out";
    }
    if (activeFilter === "expiring") {
      return m.status === "expiring" || m.status === "expired";
    }
    if (activeFilter === "controlled") {
      return m.controlled;
    }
    return true;
  };

  const matchesSearch = (m) => {
    const term = (search?.value || "").trim().toLowerCase();
    if (!term) {
      return true;
    }
    return [m.name, m.sku, m.category].filter(Boolean).join(" ").toLowerCase().includes(term);
  };

  const badgeFor = (m) =>
    m.controlled ? { tone: "controlled", label: "Controlled" } : { tone: m.status, label: m.status_label };

  const renderDetail = (m) => {
    if (!m || !detailFields.title) {
      return;
    }
    detailFields.title.textContent = m.name;
    detailFields.subtitle.textContent = [m.strength, m.form, m.category].filter(Boolean).join(" · ");
    detailFields.onHand.textContent = `${m.on_hand} packs`;
    detailFields.reorder.textContent = `${m.reorder_point} packs`;
    detailFields.expiry.textContent = formatDate(m.expiry);
    detailFields.price.textContent = currency.format(m.price);
    const badge = badgeFor(m);
    detailFields.badge.className = `status-badge ${toneClass(badge.tone)}`;
    detailFields.badge.textContent = badge.label;
  };

  const updateChipCounts = () => {
    const count = (filter) => {
      const prev = activeFilter;
      activeFilter = filter;
      const n = medications.filter(matchesFilter).length;
      activeFilter = prev;
      return n;
    };
    chips.forEach((chip) => {
      const countEl = chip.querySelector(".mono");
      if (countEl) {
        countEl.textContent = count(chip.dataset.stockFilter);
      }
    });
  };

  const render = () => {
    const visible = medications.filter((m) => matchesFilter(m) && matchesSearch(m));
    if (!visible.some((m) => m.id === selectedId)) {
      selectedId = visible.length ? visible[0].id : null;
    }

    tbody.innerHTML = visible.length
      ? visible
          .map((m) => {
            const badge = badgeFor(m);
            const active = m.id === selectedId ? "table-active" : "";
            const expiryClass = m.status === "expiring" || m.status === "expired" ? "text-warning-emphasis" : "text-body-secondary";
            return `
              <tr data-inventory-row data-id="${m.id}" class="${active}" role="button" tabindex="0">
                <td><div class="fw-semibold">${m.name}</div><div class="small text-body-secondary">${[m.strength, m.form].filter(Boolean).join(" · ")}</div></td>
                <td class="mono text-body-secondary">${m.sku}</td>
                <td>${m.category || "—"}</td>
                <td class="text-end mono">${m.on_hand}</td>
                <td class="mono ${expiryClass}">${formatDate(m.expiry)}</td>
                <td>${statusBadge(badge.tone, badge.label)}</td>
                <td class="text-end mono">${currency.format(m.price)}</td>
              </tr>`;
          })
          .join("")
      : `<tr><td colspan="7">${placeholder("No medications match your filters.")}</td></tr>`;

    tbody.querySelectorAll("[data-inventory-row]").forEach((row) => {
      const select = () => {
        selectedId = Number(row.dataset.id);
        tbody.querySelectorAll("[data-inventory-row]").forEach((r) => r.classList.toggle("table-active", r === row));
        renderDetail(medications.find((m) => m.id === selectedId));
      };
      row.addEventListener("click", select);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      });
    });

    renderDetail(medications.find((m) => m.id === selectedId));
    refreshIcons();
  };

  const load = async () => {
    tbody.innerHTML = `<tr><td colspan="7">${placeholder("Loading inventory…")}</td></tr>`;
    try {
      medications = await api.medications();
      updateChipCounts();
      render();
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="7">${placeholder(reportError(error), "error")}</td></tr>`;
    }
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      activeFilter = chip.dataset.stockFilter;
      chips.forEach((c) => c.classList.toggle("active", c === chip));
      render();
    });
  });
  search?.addEventListener("input", render);

  addButton?.addEventListener("click", async () => {
    const values = await openForm({
      title: "Add medication",
      submitLabel: "Create",
      fields: [
        { name: "sku", label: "SKU", required: true, placeholder: "CA-XXX-000" },
        { name: "name", label: "Name", required: true },
        { name: "strength", label: "Strength", placeholder: "500 mg" },
        { name: "form", label: "Form", placeholder: "Tablet" },
        { name: "category", label: "Category" },
        { name: "on_hand", label: "On hand", type: "number", value: 0 },
        { name: "reorder_point", label: "Reorder point", type: "number", value: 0 },
        { name: "price", label: "Unit price", type: "number", step: "0.01", value: 0 },
        { name: "expiry", label: "Expiry", type: "date" },
        { name: "controlled", label: "Controlled substance", type: "checkbox" },
      ],
    });
    if (!values) {
      return;
    }
    try {
      await api.createMedication({
        sku: values.sku,
        name: values.name,
        strength: values.strength,
        form: values.form,
        category: values.category,
        on_hand: Number(values.on_hand) || 0,
        reorder_point: Number(values.reorder_point) || 0,
        price: Number(values.price) || 0,
        expiry: values.expiry || null,
        controlled: values.controlled,
      });
      toast(`${values.name} added to inventory.`, "success");
      await load();
    } catch (error) {
      reportError(error);
    }
  });

  receiveChip?.addEventListener("click", async () => {
    const m = medications.find((x) => x.id === selectedId);
    if (!m) {
      return;
    }
    const values = await openForm({
      title: `Adjust stock — ${m.name}`,
      submitLabel: "Apply",
      fields: [
        { name: "delta", label: "Change (use a negative number to remove)", type: "number", required: true, value: 0, help: `Currently ${m.on_hand} on hand.` },
        { name: "reason", label: "Reason", placeholder: "Goods-in / correction / write-off" },
      ],
    });
    if (!values) {
      return;
    }
    const delta = Number(values.delta);
    if (!delta) {
      return;
    }
    try {
      await api.adjustStock(m.id, delta, values.reason || null);
      toast(`Stock updated for ${m.name}.`, "success");
      await load();
    } catch (error) {
      reportError(error);
    }
  });

  await load();
}

// ---------------------------------------------------------------------------
// Point of sale
// ---------------------------------------------------------------------------

async function bindPos() {
  const grid = document.querySelector("[data-product-grid]");
  const list = document.querySelector("[data-cart-list]");
  const scanInput = document.querySelector("[data-scan-input]");
  const subtotalEl = document.querySelector("[data-pos='subtotal']");
  const taxEl = document.querySelector("[data-pos='tax']");
  const totalEl = document.querySelector("[data-pos='total']");
  const controlledEl = document.querySelector("[data-pos='controlled-warning']");
  const clearButton = document.querySelector("[data-cart-clear]");
  const payButton = document.querySelector("[data-take-payment]");
  const methodSelect = document.querySelector("[data-payment-method]");
  if (!grid || !list) {
    return;
  }

  let products = [];
  const cart = [];

  const stockFor = (id) => products.find((p) => p.id === id)?.on_hand ?? 0;

  const renderProducts = () => {
    const sellable = products.filter((p) => p.status !== "expired" && p.status !== "recalled");
    grid.innerHTML = sellable.length
      ? sellable
          .map((p) => {
            const icon = p.controlled ? "shield-alert" : "pill";
            const out = p.on_hand <= 0 ? "product-card-disabled" : "";
            return `
              <article class="product-card p-3 ${out}" data-product data-id="${p.id}" role="button" tabindex="0">
                <div class="d-flex justify-content-between gap-3 align-items-start mb-2"><div class="product-title">${p.name}</div><i data-lucide="${icon}"></i></div>
                <div class="product-meta">${[p.strength, p.form].filter(Boolean).join(" · ")}</div>
                <div class="d-flex justify-content-between gap-2 align-items-center mt-3"><span class="product-price mono">${currency.format(p.price)}</span><span class="product-meta mono">${p.on_hand} left</span></div>
              </article>`;
          })
          .join("")
      : placeholder("No products available to sell.");

    grid.querySelectorAll("[data-product]").forEach((card) => {
      const id = Number(card.dataset.id);
      const activate = () => addToCart(id);
      card.addEventListener("click", activate);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
    });
    refreshIcons();
  };

  const buildRow = (item, index) => {
    const row = document.createElement("div");
    row.className = "cart-row";

    const info = document.createElement("div");
    info.className = "flex-grow-1";
    const title = document.createElement("div");
    title.className = "cart-item-title";
    title.textContent = item.name;
    const meta = document.createElement("div");
    meta.className = "cart-item-meta mono";
    meta.textContent = `${currency.format(item.price)} each`;
    info.append(title, meta);

    const stepper = document.createElement("div");
    stepper.className = "stepper";
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.textContent = "-";
    decrease.setAttribute("aria-label", `Decrease ${item.name}`);
    decrease.addEventListener("click", () => changeQty(index, -1));
    const qty = document.createElement("span");
    qty.className = "stepper-value";
    qty.textContent = item.qty;
    const increase = document.createElement("button");
    increase.type = "button";
    increase.textContent = "+";
    increase.setAttribute("aria-label", `Increase ${item.name}`);
    increase.addEventListener("click", () => changeQty(index, 1));
    stepper.append(decrease, qty, increase);

    const lineTotal = document.createElement("div");
    lineTotal.className = "mono fw-semibold";
    lineTotal.textContent = currency.format(item.price * item.qty);

    row.append(info, stepper, lineTotal);
    return row;
  };

  const updateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const tax = subtotal * POS_TAX_RATE;
    subtotalEl.textContent = currency.format(subtotal);
    taxEl.textContent = currency.format(tax);
    totalEl.textContent = currency.format(subtotal + tax);
    controlledEl?.classList.toggle("d-none", !cart.some((item) => item.controlled && item.qty > 0));
    if (payButton) {
      payButton.disabled = cart.length === 0;
    }
  };

  const render = () => {
    list.innerHTML = "";
    if (!cart.length) {
      const empty = document.createElement("div");
      empty.className = "muted-note m-4";
      empty.textContent = "Cart is empty. Add a product to start a sale.";
      list.appendChild(empty);
    } else {
      cart.forEach((item, index) => list.appendChild(buildRow(item, index)));
    }
    updateTotals();
  };

  function changeQty(index, delta) {
    const item = cart[index];
    const next = item.qty + delta;
    if (next > stockFor(item.id)) {
      toast(`Only ${stockFor(item.id)} of ${item.name} in stock.`, "error");
      return;
    }
    item.qty = next;
    if (item.qty <= 0) {
      cart.splice(index, 1);
    }
    render();
  }

  function addToCart(id) {
    const product = products.find((p) => p.id === id);
    if (!product) {
      return;
    }
    if (product.on_hand <= 0) {
      toast(`${product.name} is out of stock.`, "error");
      return;
    }
    const existing = cart.find((item) => item.id === id);
    if (existing) {
      if (existing.qty >= product.on_hand) {
        toast(`Only ${product.on_hand} of ${product.name} in stock.`, "error");
        return;
      }
      existing.qty += 1;
    } else {
      cart.push({ id, name: `${product.name} ${product.strength || ""}`.trim(), price: product.price, controlled: product.controlled, qty: 1 });
    }
    render();
  }

  scanInput?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") {
      return;
    }
    e.preventDefault();
    const term = scanInput.value.trim().toLowerCase();
    if (!term) {
      return;
    }
    const match = products.find(
      (p) => p.sku.toLowerCase() === term || p.name.toLowerCase().includes(term)
    );
    if (match) {
      addToCart(match.id);
      scanInput.value = "";
    } else {
      toast("No product matches that search.", "error");
    }
  });

  clearButton?.addEventListener("click", () => {
    cart.length = 0;
    render();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "F2") {
      e.preventDefault();
      scanInput?.focus();
    }
  });

  payButton?.addEventListener("click", async () => {
    if (!cart.length) {
      return;
    }
    payButton.disabled = true;
    try {
      const sale = await api.createSale({
        payment_method: methodSelect?.value || "card",
        items: cart.map((item) => ({ medication_id: item.id, quantity: item.qty })),
      });
      toast(`Sale ${sale.code} completed — ${currency.format(sale.total)}.`, "success");
      cart.length = 0;
      products = await api.medications();
      renderProducts();
      render();
    } catch (error) {
      reportError(error);
      payButton.disabled = false;
    }
  });

  try {
    products = await api.medications();
    renderProducts();
    render();
  } catch (error) {
    grid.innerHTML = placeholder(reportError(error), "error");
  }
}

// ---------------------------------------------------------------------------
// Prescriptions board
// ---------------------------------------------------------------------------

const RX_COLUMNS = [
  { state: "new", label: "New" },
  { state: "verifying", label: "Verifying" },
  { state: "ready", label: "Ready for pickup" },
  { state: "dispensed", label: "Dispensed" },
];
const RX_ADVANCE = { new: "verifying", verifying: "ready", ready: "dispensed" };
const RX_ADVANCE_LABEL = { new: "Start verify", verifying: "Mark ready", ready: "Dispense" };

async function bindPrescriptions() {
  const board = document.querySelector("[data-rx-board]");
  const addButton = document.querySelector("[data-add-rx]");
  if (!board) {
    return;
  }

  const transition = async (id, state) => {
    try {
      await api.transitionPrescription(id, state);
      toast(`Prescription moved to ${state}.`, "success");
      await load();
    } catch (error) {
      reportError(error);
    }
  };

  const card = (rx) => {
    const flagBadge = rx.flag
      ? statusBadge(rx.flag === "controlled" ? "controlled" : "out", rx.flag[0].toUpperCase() + rx.flag.slice(1))
      : "";
    const next = RX_ADVANCE[rx.state];
    const advanceBtn = next
      ? `<button class="btn btn-success btn-sm px-3 mt-3" type="button" data-advance="${rx.id}" data-next="${next}">${RX_ADVANCE_LABEL[rx.state]}</button>`
      : "";
    const voidBtn = rx.state !== "dispensed" && rx.state !== "voided"
      ? `<button class="btn btn-link btn-sm text-danger text-decoration-none px-0 mt-2" type="button" data-void="${rx.id}">Void</button>`
      : "";
    return `
      <article class="queue-card p-3">
        <div class="d-flex justify-content-between gap-2 mb-2"><span class="queue-card-id">${rx.code}</span><span class="queue-card-id">${timeAgo(rx.created_at)}</span></div>
        <div class="queue-card-title">${rx.patient.name}</div>
        <div class="queue-card-meta mt-1">${rx.medication.name} ${rx.medication.strength || ""} · <span class="mono">${rx.quantity} ${rx.unit || ""}</span></div>
        <div class="queue-card-footer mt-3"><span class="small text-body-secondary">${rx.prescriber}</span>${flagBadge}</div>
        <div class="d-flex flex-column align-items-start">${advanceBtn}${voidBtn}</div>
      </article>`;
  };

  const load = async () => {
    board.innerHTML = placeholder("Loading prescriptions…");
    let scripts;
    try {
      scripts = await api.prescriptions();
    } catch (error) {
      board.innerHTML = placeholder(reportError(error), "error");
      return;
    }

    board.innerHTML = RX_COLUMNS.map((col) => {
      const cards = scripts.filter((rx) => rx.state === col.state);
      const note = col.state === "dispensed"
        ? `<div class="muted-note">Controlled prescriptions stay visible after dispensing for audit review.</div>`
        : "";
      return `
        <div class="col-12 col-xl-3">
          <div class="queue-column">
            <div class="queue-column-head"><h2 class="section-title mb-0">${col.label}</h2><span class="queue-column-count">${cards.length}</span></div>
            ${cards.map(card).join("") || placeholder("Empty.")}
            ${note}
          </div>
        </div>`;
    }).join("");

    board.querySelectorAll("[data-advance]").forEach((btn) =>
      btn.addEventListener("click", () => transition(Number(btn.dataset.advance), btn.dataset.next))
    );
    board.querySelectorAll("[data-void]").forEach((btn) =>
      btn.addEventListener("click", () => transition(Number(btn.dataset.void), "voided"))
    );
    refreshIcons();
  };

  addButton?.addEventListener("click", async () => {
    let patients;
    let medications;
    try {
      [patients, medications] = await Promise.all([api.patients(), api.medications()]);
    } catch (error) {
      reportError(error);
      return;
    }
    const values = await openForm({
      title: "New prescription",
      submitLabel: "Create",
      fields: [
        { name: "patient_id", label: "Patient", type: "select", required: true, options: patients.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })) },
        { name: "medication_id", label: "Medication", type: "select", required: true, options: medications.map((m) => ({ value: m.id, label: `${m.name} ${m.strength || ""}` })) },
        { name: "quantity", label: "Quantity", type: "number", required: true, value: 1 },
        { name: "unit", label: "Unit", value: "tabs" },
        { name: "prescriber", label: "Prescriber", required: true, placeholder: "Dr. …" },
      ],
    });
    if (!values) {
      return;
    }
    try {
      await api.createPrescription({
        patient_id: Number(values.patient_id),
        medication_id: Number(values.medication_id),
        quantity: Number(values.quantity),
        unit: values.unit || "tabs",
        prescriber: values.prescriber,
      });
      toast("Prescription created.", "success");
      await load();
    } catch (error) {
      reportError(error);
    }
  });

  await load();
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

async function bindPatients() {
  const tbody = document.querySelector("[data-patient-body]");
  const search = document.querySelector("[data-patient-search]");
  const addButton = document.querySelector("[data-add-patient]");
  if (!tbody) {
    return;
  }

  const fields = {
    name: document.querySelector("[data-patient='name']"),
    summary: document.querySelector("[data-patient='summary']"),
    phone: document.querySelector("[data-patient='phone']"),
    plan: document.querySelector("[data-patient='plan']"),
    active: document.querySelector("[data-patient='active']"),
    allergies: document.querySelector("[data-patient='allergies']"),
    medications: document.querySelector("[data-patient='medications']"),
  };

  let patients = [];
  let selectedId = null;

  const renderChips = (container, items, emptyLabel) => {
    if (!container) {
      return;
    }
    container.innerHTML = "";
    const values = (items || []).filter(Boolean);
    const chips = values.length ? values : [emptyLabel];
    chips.forEach((text) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = text;
      container.appendChild(chip);
    });
  };

  const renderDetail = async (id) => {
    if (!id || !fields.name) {
      return;
    }
    try {
      const p = await api.patient(id);
      fields.name.textContent = p.name;
      fields.summary.textContent = `${p.code} · DOB ${formatDate(p.dob)}`;
      fields.phone.textContent = p.phone || "—";
      fields.plan.textContent = p.plan || "—";
      fields.active.textContent = p.active_prescriptions;
      renderChips(fields.allergies, p.allergies, "None recorded");
      const meds = (p.prescriptions || []).map((rx) => `${rx.medication_name} ${rx.medication_strength || ""}`.trim());
      renderChips(fields.medications, meds, "No medications");
    } catch (error) {
      reportError(error);
    }
  };

  const render = () => {
    const term = (search?.value || "").trim().toLowerCase();
    const visible = patients.filter((p) =>
      !term || `${p.name} ${p.code} ${p.plan || ""}`.toLowerCase().includes(term)
    );
    if (!visible.some((p) => p.id === selectedId)) {
      selectedId = visible.length ? visible[0].id : null;
    }

    tbody.innerHTML = visible.length
      ? visible
          .map((p) => {
            const active = p.id === selectedId ? "table-active" : "";
            return `
              <tr data-patient-row data-id="${p.id}" class="${active}" role="button" tabindex="0">
                <td><div class="fw-semibold">${p.name}</div></td>
                <td class="mono text-body-secondary">${p.code}</td>
                <td class="mono text-body-secondary">${formatDate(p.dob)}</td>
                <td>${p.plan || "—"}</td>
                <td class="text-end mono">${p.active ?? "—"}</td>
                <td class="mono text-body-secondary">${formatDate(p.last_visit)}</td>
              </tr>`;
          })
          .join("")
      : `<tr><td colspan="6">${placeholder("No patients match your search.")}</td></tr>`;

    tbody.querySelectorAll("[data-patient-row]").forEach((row) => {
      const select = () => {
        selectedId = Number(row.dataset.id);
        tbody.querySelectorAll("[data-patient-row]").forEach((r) => r.classList.toggle("table-active", r === row));
        renderDetail(selectedId);
      };
      row.addEventListener("click", select);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      });
    });

    renderDetail(selectedId);
  };

  const load = async () => {
    tbody.innerHTML = `<tr><td colspan="6">${placeholder("Loading patients…")}</td></tr>`;
    try {
      patients = await api.patients();
      render();
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="6">${placeholder(reportError(error), "error")}</td></tr>`;
    }
  };

  search?.addEventListener("input", render);

  addButton?.addEventListener("click", async () => {
    const values = await openForm({
      title: "Add patient",
      submitLabel: "Create",
      fields: [
        { name: "name", label: "Full name", required: true },
        { name: "dob", label: "Date of birth", type: "date" },
        { name: "phone", label: "Phone" },
        { name: "plan", label: "Insurance plan" },
        { name: "allergies", label: "Allergies (comma separated)", placeholder: "Penicillin, Aspirin" },
      ],
    });
    if (!values) {
      return;
    }
    try {
      await api.createPatient({
        name: values.name,
        dob: values.dob || null,
        phone: values.phone || null,
        plan: values.plan || null,
        allergies: values.allergies ? values.allergies.split(",").map((a) => a.trim()).filter(Boolean) : [],
      });
      toast(`${values.name} added.`, "success");
      await load();
    } catch (error) {
      reportError(error);
    }
  });

  await load();
}

// ---------------------------------------------------------------------------
// Orders (purchase orders)
// ---------------------------------------------------------------------------

const PO_ADVANCE = { draft: "submitted", submitted: "transit", transit: "received" };
const PO_ADVANCE_LABEL = { draft: "Submit", submitted: "Mark in transit", transit: "Receive stock" };
const PO_STATE_LABEL = { draft: "Draft", submitted: "Submitted", transit: "In transit", received: "Received", cancelled: "Cancelled" };

async function bindOrders() {
  const tbody = document.querySelector("[data-order-body]");
  const banner = document.querySelector("[data-reorder-banner]");
  const addButton = document.querySelector("[data-add-order]");
  if (!tbody) {
    return;
  }

  const fields = {
    id: document.querySelector("[data-order='id']"),
    supplier: document.querySelector("[data-order='supplier']"),
    expected: document.querySelector("[data-order='expected']"),
    units: document.querySelector("[data-order='units']"),
    total: document.querySelector("[data-order='total']"),
    badge: document.querySelector("[data-order='badge']"),
    lines: document.querySelector("[data-order='lines']"),
    actions: document.querySelector("[data-order='actions']"),
  };

  let orders = [];
  let selectedId = null;

  const transition = async (id, state) => {
    try {
      await api.transitionPurchaseOrder(id, state);
      toast(state === "received" ? "Stock received and added to inventory." : `Order moved to ${state}.`, "success");
      await load();
    } catch (error) {
      reportError(error);
    }
  };

  const renderDetail = async (id) => {
    if (!id || !fields.id) {
      return;
    }
    try {
      const po = await api.purchaseOrder(id);
      fields.id.textContent = po.code;
      fields.supplier.textContent = po.supplier.name;
      fields.expected.textContent = formatDate(po.expected_at);
      fields.units.textContent = po.total_units;
      fields.total.textContent = currency.format(po.total_cost);
      fields.badge.className = `status-badge ${toneClass(po.state)}`;
      fields.badge.textContent = PO_STATE_LABEL[po.state] || po.state;

      fields.lines.innerHTML = (po.items || [])
        .map(
          (item) => `
            <div class="detail-row">
              <span class="detail-row-label">${item.medication_name}</span>
              <span class="detail-row-value mono">${item.units} × ${currency.format(item.unit_cost)}</span>
            </div>`
        )
        .join("") || placeholder("No line items.");

      if (fields.actions) {
        const next = PO_ADVANCE[po.state];
        const advanceBtn = next
          ? `<button class="btn btn-success btn-sm px-3" type="button" data-order-advance data-id="${po.id}" data-next="${next}">${PO_ADVANCE_LABEL[po.state]}</button>`
          : "";
        const cancelBtn = po.state !== "received" && po.state !== "cancelled"
          ? `<button class="btn btn-outline-secondary btn-sm px-3" type="button" data-order-cancel data-id="${po.id}">Cancel</button>`
          : "";
        fields.actions.innerHTML = advanceBtn + cancelBtn || `<span class="muted-note">No actions available.</span>`;
        fields.actions.querySelector("[data-order-advance]")?.addEventListener("click", (e) => {
          const t = e.currentTarget;
          transition(Number(t.dataset.id), t.dataset.next);
        });
        fields.actions.querySelector("[data-order-cancel]")?.addEventListener("click", (e) =>
          transition(Number(e.currentTarget.dataset.id), "cancelled")
        );
      }
    } catch (error) {
      reportError(error);
    }
  };

  const render = () => {
    if (!orders.some((o) => o.id === selectedId)) {
      selectedId = orders.length ? orders[0].id : null;
    }

    tbody.innerHTML = orders.length
      ? orders
          .map((o) => {
            const active = o.id === selectedId ? "table-active" : "";
            return `
              <tr data-order-row data-id="${o.id}" class="${active}" role="button" tabindex="0">
                <td class="mono fw-semibold">${o.code}</td>
                <td>${o.supplier.name}</td>
                <td class="text-end mono">${o.item_count}</td>
                <td class="text-end mono">${o.total_units}</td>
                <td class="mono text-body-secondary">${formatDate(o.expected_at)}</td>
                <td>${statusBadge(o.state, PO_STATE_LABEL[o.state] || o.state)}</td>
                <td class="text-end mono">${currency.format(o.total_cost)}</td>
              </tr>`;
          })
          .join("")
      : `<tr><td colspan="7">${placeholder("No purchase orders yet.")}</td></tr>`;

    tbody.querySelectorAll("[data-order-row]").forEach((row) => {
      const select = () => {
        selectedId = Number(row.dataset.id);
        tbody.querySelectorAll("[data-order-row]").forEach((r) => r.classList.toggle("table-active", r === row));
        renderDetail(selectedId);
      };
      row.addEventListener("click", select);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      });
    });

    renderDetail(selectedId);
  };

  const loadBanner = async () => {
    if (!banner) {
      return;
    }
    try {
      const summary = await api.dashboard();
      const names = (summary.low_stock || []).map((m) => m.name);
      banner.innerHTML = names.length
        ? `<strong>${names.length} item${names.length === 1 ? " is" : "s are"} at or below the reorder point.</strong><p class="mono">${names.join(" · ")}</p>`
        : `<strong>All stock is above the reorder point.</strong>`;
    } catch {
      // banner is non-critical
    }
  };

  const load = async () => {
    tbody.innerHTML = `<tr><td colspan="7">${placeholder("Loading orders…")}</td></tr>`;
    try {
      orders = await api.purchaseOrders();
      render();
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="7">${placeholder(reportError(error), "error")}</td></tr>`;
    }
    await loadBanner();
  };

  addButton?.addEventListener("click", async () => {
    let suppliers;
    let medications;
    try {
      [suppliers, medications] = await Promise.all([api.suppliers(), api.medications()]);
    } catch (error) {
      reportError(error);
      return;
    }
    const values = await openForm({
      title: "Create purchase order",
      submitLabel: "Create",
      fields: [
        { name: "supplier_id", label: "Supplier", type: "select", required: true, options: suppliers.map((s) => ({ value: s.id, label: s.name })) },
        { name: "expected_at", label: "Expected date", type: "date" },
        { name: "medication_id", label: "Medication", type: "select", required: true, options: medications.map((m) => ({ value: m.id, label: `${m.name} ${m.strength || ""}` })) },
        { name: "units", label: "Units", type: "number", required: true, value: 1 },
        { name: "unit_cost", label: "Unit cost", type: "number", step: "0.01", placeholder: "optional" },
      ],
    });
    if (!values) {
      return;
    }
    const item = { medication_id: Number(values.medication_id), units: Number(values.units) };
    if (values.unit_cost) {
      item.unit_cost = Number(values.unit_cost);
    }
    try {
      await api.createPurchaseOrder({
        supplier_id: Number(values.supplier_id),
        expected_at: values.expected_at || null,
        items: [item],
      });
      toast("Purchase order created.", "success");
      await load();
    } catch (error) {
      reportError(error);
    }
  });

  await load();
}

// ---------------------------------------------------------------------------

export function bindPageBehaviors(pageId) {
  const binders = {
    dashboard: bindDashboard,
    inventory: bindInventory,
    pos: bindPos,
    prescriptions: bindPrescriptions,
    patients: bindPatients,
    orders: bindOrders,
  };
  const binder = binders[pageId];
  if (binder) {
    binder();
  }
}
