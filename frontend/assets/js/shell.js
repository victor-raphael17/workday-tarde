import { branch, navigation } from "./data.js";
import { api, auth, initials as toInitials } from "./api.js";
import logoMark from "../images/logo-mark.svg";

const ROLE_LABELS = {
  pharmacist: "Pharmacist",
  technician: "Technician",
  admin: "Administrator",
};

export function renderShell(pageId) {
  const sidebar = document.getElementById("appSidebar");
  const topbar = document.getElementById("appTopbar");

  if (!sidebar || !topbar) {
    return;
  }

  // Prefer the signed-in user; fall back to the static branch identity.
  const user = auth.user;
  const displayName = user?.name || branch.shiftLead;
  const displayRole = user ? ROLE_LABELS[user.role] || user.role : branch.role;
  const initials = toInitials(displayName);

  const main = document.querySelector("main.app-content");
  if (main && !document.querySelector(".skip-link")) {
    main.id = main.id || "mainContent";
    main.setAttribute("tabindex", "-1");
    const skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = `#${main.id}`;
    skip.textContent = "Skip to content";
    document.body.prepend(skip);
  }

  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <img src="${logoMark}" alt="CA Pharmacy">
      <div class="sidebar-brand-title">CA <span>Pharmacy</span></div>
    </div>
    <nav class="sidebar-nav" aria-label="Primary navigation">
      ${navigation.map((item) => `
          <a class="sidebar-link ${pageId === item.id ? "active" : ""}" href="${item.href}" ${pageId === item.id ? 'aria-current="page"' : ""}>
            <i data-lucide="${item.icon}"></i>
            <span>${item.label}</span>
            <span class="sidebar-link-count d-none" data-nav-count="${item.id}"></span>
          </a>
        `).join("")}
    </nav>
    <div class="sidebar-section-label">Current shift</div>
    <div class="sidebar-shift-card d-flex align-items-center gap-3">
      <span class="shift-avatar">${initials}</span>
      <div>
        <div class="sidebar-shift-name">${displayName}</div>
        <div class="sidebar-shift-role">${displayRole} · ${branch.name}</div>
      </div>
    </div>
  `;

  topbar.innerHTML = `
    <button class="topbar-menu" id="mobileNavToggle" type="button" aria-label="Open navigation">
      <i data-lucide="menu"></i>
    </button>
    <label class="topbar-search mb-0">
      <i data-lucide="search"></i>
      <input type="search" placeholder="Search medications, patients, scripts..." aria-label="Search">
      <kbd>/</kbd>
    </label>
    <div class="topbar-actions">
      <div class="topbar-branch">
        <i data-lucide="store"></i>
        <span>${branch.name}</span>
      </div>
      <button class="topbar-icon" type="button" aria-label="Notifications">
        <i data-lucide="bell"></i>
      </button>
      <button class="topbar-icon" type="button" aria-label="Help">
        <i data-lucide="help-circle"></i>
      </button>
      <button class="topbar-icon" id="logoutButton" type="button" aria-label="Sign out">
        <i data-lucide="log-out"></i>
      </button>
    </div>
  `;
}

/** Populate the inventory / prescriptions badges from the dashboard summary. */
export async function loadNavCounts() {
  const setCount = (id, value) => {
    const badge = document.querySelector(`[data-nav-count="${id}"]`);
    if (!badge) {
      return;
    }
    if (value) {
      badge.textContent = value;
      badge.classList.remove("d-none");
    } else {
      badge.classList.add("d-none");
    }
  };

  try {
    const summary = await api.dashboard();
    setCount("inventory", summary.alerts?.low_stock || 0);
    setCount("prescriptions", summary.dispensing_queue?.open || 0);
  } catch {
    // Counts are non-critical chrome; ignore if the API is unavailable.
  }
}

export function bindShellEvents() {
  const toggle = document.getElementById("mobileNavToggle");
  const scrim = document.getElementById("appScrim");
  const links = document.querySelectorAll(".sidebar-link");
  const logout = document.getElementById("logoutButton");

  const closeNav = () => document.body.classList.remove("nav-open");

  logout?.addEventListener("click", async () => {
    logout.disabled = true;
    try {
      await api.logout();
    } catch {
      // Even if the network call fails, clear the local session below.
    }
    auth.clear();
    auth.redirectToLogin();
  });

  toggle?.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
  });

  scrim?.addEventListener("click", closeNav);
  links.forEach((link) => link.addEventListener("click", closeNav));

  const searchInput = document.querySelector(".topbar-search input");

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNav();
    }

    const target = event.target;
    const isTyping = target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    if (event.key === "/" && !isTyping && searchInput) {
      event.preventDefault();
      searchInput.focus();
    }
  });
}