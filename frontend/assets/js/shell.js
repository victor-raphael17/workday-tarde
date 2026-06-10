import { branch, navigation } from './data.js';
import { api, auth, initials as toInitials } from './api.js';
import { escapeHtml, escapeHtmlAttr } from './sanitize.js';
import logoMark from '../images/logo-mark.svg';

const ROLE_LABELS = {
  pharmacist: 'Pharmacist',
  technician: 'Technician',
  admin: 'Administrator',
};

const SEARCH_LIMIT = 4;

const SEARCH_GROUPS = [
  { key: 'medications', label: 'Medications', icon: 'pill' },
  { key: 'patients', label: 'Patients', icon: 'users' },
  { key: 'prescriptions', label: 'Prescriptions', icon: 'clipboard-list' },
];

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function normalize(value) {
  return String(value || '').toLowerCase();
}

function includesTerm(values, term) {
  const needle = normalize(term);
  return values.some((value) => normalize(value).includes(needle));
}

function resultLink(result) {
  return `
    <a class="topbar-result" href="${escapeHtmlAttr(result.href)}">
      <span class="topbar-result-icon"><i data-lucide="${escapeHtmlAttr(result.icon)}"></i></span>
      <span>
        <span class="topbar-result-title">${escapeHtml(result.title)}</span>
        <span class="topbar-result-meta">${escapeHtml(result.meta)}</span>
      </span>
    </a>`;
}

function renderSearchPanel(panel, groups, term) {
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  if (!total) {
    panel.innerHTML = `
      <div class="topbar-panel-empty">
        No results for <span class="mono">${escapeHtml(term)}</span>.
      </div>`;
    return;
  }

  panel.innerHTML = groups
    .filter((group) => group.items.length)
    .map(
      (group) => `
        <section class="topbar-result-group">
          <div class="topbar-result-group-title">${escapeHtml(group.label)}</div>
          ${group.items.map(resultLink).join('')}
        </section>`
    )
    .join('');
}

async function findGlobalResults(term) {
  const [medications, patients, prescriptions] = await Promise.all([
    api.medications(),
    api.patients(),
    api.prescriptions(),
  ]);

  return [
    {
      ...SEARCH_GROUPS[0],
      items: medications
        .filter((medication) =>
          includesTerm(
            [
              medication.name,
              medication.sku,
              medication.category,
              medication.strength,
              medication.form,
            ],
            term
          )
        )
        .slice(0, SEARCH_LIMIT)
        .map((medication) => ({
          href: 'inventory.html',
          icon: 'pill',
          title: medication.name,
          meta: `${medication.sku} · ${medication.on_hand} on hand`,
        })),
    },
    {
      ...SEARCH_GROUPS[1],
      items: patients
        .filter((patient) =>
          includesTerm([patient.name, patient.code, patient.plan], term)
        )
        .slice(0, SEARCH_LIMIT)
        .map((patient) => ({
          href: 'patients.html',
          icon: 'users',
          title: patient.name,
          meta: `${patient.code} · ${patient.plan || 'No plan'}`,
        })),
    },
    {
      ...SEARCH_GROUPS[2],
      items: prescriptions
        .filter((prescription) =>
          includesTerm(
            [
              prescription.code,
              prescription.patient?.name,
              prescription.medication?.name,
              prescription.prescriber,
            ],
            term
          )
        )
        .slice(0, SEARCH_LIMIT)
        .map((prescription) => ({
          href: 'prescriptions.html',
          icon: 'clipboard-list',
          title: prescription.code,
          meta: `${prescription.patient?.name || 'Patient'} · ${prescription.state}`,
        })),
    },
  ];
}

export function renderShell(pageId) {
  const sidebar = document.getElementById('appSidebar');
  const topbar = document.getElementById('appTopbar');

  if (!sidebar || !topbar) {
    return;
  }

  // Prefer the signed-in user; fall back to the static branch identity.
  const user = auth.user;
  const displayName = user?.name || branch.shiftLead;
  const displayRole = user ? ROLE_LABELS[user.role] || user.role : branch.role;
  const initials = toInitials(displayName);

  const main = document.querySelector('main.app-content');
  if (main && !document.querySelector('.skip-link')) {
    main.id = main.id || 'mainContent';
    main.setAttribute('tabindex', '-1');
    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = `#${main.id}`;
    skip.textContent = 'Skip to content';
    document.body.prepend(skip);
  }

  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <img src="${logoMark}" alt="CA Pharmacy">
      <div class="sidebar-brand-title">CA <span>Pharmacy</span></div>
    </div>
    <nav class="sidebar-nav" aria-label="Primary navigation">
      ${navigation
        .map(
          (item) => `
          <a class="sidebar-link ${pageId === item.id ? 'active' : ''}" href="${escapeHtmlAttr(item.href)}" ${pageId === item.id ? 'aria-current="page"' : ''}>
            <i data-lucide="${escapeHtmlAttr(item.icon)}"></i>
            <span>${escapeHtml(item.label)}</span>
            <span class="sidebar-link-count d-none" data-nav-count="${escapeHtmlAttr(item.id)}"></span>
          </a>
        `
        )
        .join('')}
    </nav>
    <div class="sidebar-section-label">Current shift</div>
    <div class="sidebar-shift-card d-flex align-items-center gap-3">
      <span class="shift-avatar">${escapeHtml(initials)}</span>
      <div>
        <div class="sidebar-shift-name">${escapeHtml(displayName)}</div>
        <div class="sidebar-shift-role">${escapeHtml(displayRole)} · ${escapeHtml(branch.name)}</div>
      </div>
    </div>
  `;

  topbar.innerHTML = `
    <button class="topbar-menu" id="mobileNavToggle" type="button" aria-label="Open navigation">
      <i data-lucide="menu"></i>
    </button>
    <div class="topbar-search-wrap">
      <label class="topbar-search mb-0">
        <i data-lucide="search"></i>
        <input type="search" placeholder="Search medications, patients, scripts..." aria-label="Search" data-global-search aria-controls="globalSearchPanel" aria-expanded="false" autocomplete="off">
        <kbd>/</kbd>
      </label>
      <div class="topbar-panel topbar-search-panel d-none" id="globalSearchPanel" role="region" aria-label="Global search results">
        <div class="topbar-panel-empty">Type at least 2 characters to search.</div>
      </div>
    </div>
    <div class="topbar-actions">
      <div class="topbar-branch">
        <i data-lucide="store"></i>
        <span>${escapeHtml(branch.name)}</span>
      </div>
      <div class="topbar-action-wrap">
        <button class="topbar-icon" type="button" aria-label="Notifications" data-topbar-panel-toggle="notifications" aria-controls="notificationsPanel" aria-expanded="false">
          <i data-lucide="bell"></i>
        </button>
        <div class="topbar-panel topbar-action-panel d-none" id="notificationsPanel" role="region" aria-label="Notifications">
          <div class="topbar-panel-empty">Loading notifications...</div>
        </div>
      </div>
      <div class="topbar-action-wrap">
        <button class="topbar-icon" type="button" aria-label="Help" data-topbar-panel-toggle="help" aria-controls="helpPanel" aria-expanded="false">
          <i data-lucide="help-circle"></i>
        </button>
        <div class="topbar-panel topbar-action-panel d-none" id="helpPanel" role="region" aria-label="Help">
          <section class="topbar-help-section">
            <div class="topbar-result-group-title">Shortcuts</div>
            <div class="topbar-help-row"><span class="mono">/</span><span>Focus global search</span></div>
            <div class="topbar-help-row"><span class="mono">Esc</span><span>Close panels or navigation</span></div>
            <div class="topbar-help-row"><span class="mono">F2</span><span>Focus POS scanner</span></div>
          </section>
          <section class="topbar-help-section">
            <div class="topbar-result-group-title">Quick links</div>
            <a class="topbar-result" href="inventory.html"><span class="topbar-result-icon"><i data-lucide="package"></i></span><span><span class="topbar-result-title">Inventory</span><span class="topbar-result-meta">Review stock and controlled items</span></span></a>
            <a class="topbar-result" href="prescriptions.html"><span class="topbar-result-icon"><i data-lucide="clipboard-list"></i></span><span><span class="topbar-result-title">Prescriptions</span><span class="topbar-result-meta">Manage dispensing queue</span></span></a>
          </section>
        </div>
      </div>
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
      badge.classList.remove('d-none');
    } else {
      badge.classList.add('d-none');
    }
  };

  try {
    const summary = await api.dashboard();
    setCount('inventory', summary.alerts?.low_stock || 0);
    setCount('prescriptions', summary.dispensing_queue?.open || 0);
  } catch {
    // Counts are non-critical chrome; ignore if the API is unavailable.
  }
}

export function bindShellEvents() {
  const toggle = document.getElementById('mobileNavToggle');
  const scrim = document.getElementById('appScrim');
  const links = document.querySelectorAll('.sidebar-link');
  const logout = document.getElementById('logoutButton');
  const searchInput = document.querySelector('[data-global-search]');
  const searchPanel = document.getElementById('globalSearchPanel');
  const panelToggles = document.querySelectorAll('[data-topbar-panel-toggle]');

  const closeNav = () => document.body.classList.remove('nav-open');
  const closeSearch = () => {
    searchPanel?.classList.add('d-none');
    searchInput?.setAttribute('aria-expanded', 'false');
  };
  const openSearch = () => {
    searchPanel?.classList.remove('d-none');
    searchInput?.setAttribute('aria-expanded', 'true');
  };
  const closeActionPanels = () => {
    panelToggles.forEach((button) => {
      button.setAttribute('aria-expanded', 'false');
      document
        .getElementById(button.getAttribute('aria-controls'))
        ?.classList.add('d-none');
    });
  };
  const closeAllPanels = () => {
    closeSearch();
    closeActionPanels();
  };

  let searchTimer = null;
  let searchRequestId = 0;
  let notificationsLoaded = false;

  logout?.addEventListener('click', async () => {
    logout.disabled = true;
    try {
      await api.logout();
    } catch {
      // Even if the network call fails, clear the local session below.
    }
    auth.clear();
    auth.redirectToLogin();
  });

  toggle?.addEventListener('click', () => {
    document.body.classList.toggle('nav-open');
  });

  scrim?.addEventListener('click', closeNav);
  links.forEach((link) => link.addEventListener('click', closeNav));

  const renderSearchHint = (message) => {
    if (searchPanel) {
      searchPanel.innerHTML = `<div class="topbar-panel-empty">${escapeHtml(message)}</div>`;
    }
  };

  const runSearch = async () => {
    const term = searchInput?.value.trim() || '';
    const requestId = ++searchRequestId;

    if (term.length < 2) {
      renderSearchHint('Type at least 2 characters to search.');
      return;
    }

    renderSearchHint('Searching...');
    try {
      const groups = await findGlobalResults(term);
      if (requestId === searchRequestId && searchPanel) {
        renderSearchPanel(searchPanel, groups, term);
        refreshIcons();
      }
    } catch {
      if (requestId === searchRequestId) {
        renderSearchHint('Search is unavailable right now.');
      }
    }
  };

  searchInput?.addEventListener('focus', openSearch);
  searchInput?.addEventListener('input', () => {
    openSearch();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 220);
  });
  searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const first = searchPanel?.querySelector('.topbar-result');
      if (first) {
        event.preventDefault();
        first.click();
      }
    }
    if (event.key === 'Escape') {
      closeSearch();
    }
  });

  const loadNotifications = async (panel) => {
    if (notificationsLoaded) {
      return;
    }
    panel.innerHTML =
      '<div class="topbar-panel-empty">Loading notifications...</div>';
    try {
      const summary = await api.dashboard();
      const lowStock = summary.alerts?.low_stock || 0;
      const queue = summary.dispensing_queue?.open || 0;
      const salesCount = summary.sales_today?.count || 0;

      panel.innerHTML = `
        <section class="topbar-result-group">
          <div class="topbar-result-group-title">Today</div>
          <a class="topbar-result" href="inventory.html"><span class="topbar-result-icon"><i data-lucide="package-search"></i></span><span><span class="topbar-result-title">${escapeHtml(lowStock)} low-stock item${lowStock === 1 ? '' : 's'}</span><span class="topbar-result-meta">Review reorder needs</span></span></a>
          <a class="topbar-result" href="prescriptions.html"><span class="topbar-result-icon"><i data-lucide="clipboard-list"></i></span><span><span class="topbar-result-title">${escapeHtml(queue)} prescription${queue === 1 ? '' : 's'} open</span><span class="topbar-result-meta">Check dispensing queue</span></span></a>
          <a class="topbar-result" href="dashboard.html"><span class="topbar-result-icon"><i data-lucide="receipt"></i></span><span><span class="topbar-result-title">${escapeHtml(salesCount)} sale${salesCount === 1 ? '' : 's'} today</span><span class="topbar-result-meta">Open dashboard summary</span></span></a>
        </section>`;
      notificationsLoaded = true;
      refreshIcons();
    } catch {
      panel.innerHTML =
        '<div class="topbar-panel-empty text-danger">Notifications are unavailable.</div>';
    }
  };

  panelToggles.forEach((button) => {
    button.addEventListener('click', async () => {
      const panel = document.getElementById(
        button.getAttribute('aria-controls')
      );
      const shouldOpen = button.getAttribute('aria-expanded') !== 'true';

      closeAllPanels();
      if (!shouldOpen || !panel) {
        return;
      }

      button.setAttribute('aria-expanded', 'true');
      panel.classList.remove('d-none');
      if (button.dataset.topbarPanelToggle === 'notifications') {
        await loadNotifications(panel);
      }
      refreshIcons();
    });
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (
      target instanceof Node &&
      !document.getElementById('appTopbar')?.contains(target)
    ) {
      closeAllPanels();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeNav();
      closeAllPanels();
    }

    const target = event.target;
    const isTyping =
      target instanceof HTMLElement &&
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    if (event.key === '/' && !isTyping && searchInput) {
      event.preventDefault();
      searchInput.focus();
    }
  });
}
