import { branch, navigation } from './data.js';
import { api, auth, initials as toInitials } from './api.js';
import { escapeHtml, escapeHtmlAttr } from './sanitize.js';
import logoMark from '../images/logo-mark.svg';

const ROLE_LABELS = {
  pharmacist: 'Pharmacist',
  technician: 'Technician',
  admin: 'Administrator',
};

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
    <label class="topbar-search mb-0">
      <i data-lucide="search"></i>
      <input type="search" placeholder="Search medications, patients, scripts..." aria-label="Search">
      <kbd>/</kbd>
    </label>
    <div class="topbar-actions">
      <div class="topbar-branch">
        <i data-lucide="store"></i>
        <span>${escapeHtml(branch.name)}</span>
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

  const closeNav = () => document.body.classList.remove('nav-open');

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

  
  const searchInput = document.querySelector('.topbar-search input');
  //Para caso seja uma div dinamica ou existente
  const searchResultsContainer = document.querySelector('.topbar-search-results') || createSearchResultsContainer(); 
  let debounceTimeout;
  
  //Atalho de foco no input '/' e 'Escape' para limpar
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
     if (typeof closeNav === 'function') closeNav();
     clearSearchResult();
    }

    const target = event.target;
    const isTyping =
      target instanceof HTMLElement &&
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName || target.isContentEditable
    );

    if (event.key === '/' && !isTyping && searchInput) {
      event.preventDefault();
      searchInput.focus();
    }
  });
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
    const query = event.target.value.trim();
    clearTimeout(debounceTimeout);

    //Para buscar com pelo menos 3 caracteres
    if(query.lenght > 3) {
      clearSearchResults();
    return;
    }
  debounceTimeout = setTimeout(() => {
      performGlobalSearch(query);
    }, 300);
  });
}
async function performGlobalSearch(query) {
  try {
    showSearchLoader();

    // Substitua pela rota real da sua API
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Erro ao buscar dados');
    
    const data = await response.json(); 
    renderSearchResults(data);
  } catch (error) {
    console.error('Erro na busca global:', error);
    renderSearchError();
  }
}

function clearSearchResults() {
    if (searchResultsContainer) {
      searchResultsContainer.innerHTML = '';
      searchResultsContainer.style.display = 'none';
    }
  }

function showSearchLoader() {
    if (searchResultsContainer) {
      searchResultsContainer.style.display = 'block';
      searchResultsContainer.innerHTML = '<div class="search-loading">Buscando...</div>';
    }
  }

function renderSearchError() {
    if (searchResultsContainer) {
      searchResultsContainer.innerHTML = '<div class="search-error">Erro na busca. Tente novamente.</div>';
    }
  }

function createSearchResultsContainer() {
    if (!searchInput) return null;
    const container = document.createElement('div');
    container.className = 'topbar-search-results';
    container.style.display = 'none';
    searchInput.parentNode.appendChild(container);
    return container;
  }

document.addEventListener('click', (e) => {
    if (searchInput && searchResultsContainer && !searchInput.contains(e.target) && !searchResultsContainer.contains(e.target)) {
      clearSearchResults();
    }
  });
}