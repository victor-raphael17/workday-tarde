import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api, auth } from './api.js';
import { bindShellEvents, renderShell } from './shell.js';

const originalApi = {
  medications: api.medications,
  patients: api.patients,
  prescriptions: api.prescriptions,
  logout: api.logout,
};

function setupShell() {
  document.body.innerHTML = `
    <aside id="appSidebar"></aside>
    <header id="appTopbar"></header>
    <div id="appScrim"></div>
    <main class="app-content"></main>`;
  localStorage.setItem(
    'ca_pharmacy_session',
    JSON.stringify({
      token: 'test-token',
      user: { name: 'Jade Okafor', role: 'pharmacist' },
    })
  );
  renderShell('dashboard');
}

describe('topbar shell', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.assign(api, originalApi);
    document.body.innerHTML = '';
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renderiza busca global e botoes acionaveis', () => {
    setupShell();

    expect(document.querySelector('[data-global-search]')).not.toBeNull();
    expect(
      document.querySelector('[data-topbar-panel-toggle="notifications"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-topbar-panel-toggle="help"]')
    ).not.toBeNull();
  });

  it('abre o painel de ajuda', () => {
    setupShell();
    bindShellEvents();

    document.querySelector('[data-topbar-panel-toggle="help"]').click();

    expect(document.getElementById('helpPanel').classList).not.toContain(
      'd-none'
    );
    expect(document.getElementById('helpPanel').textContent).toContain(
      'Focus global search'
    );
  });

  it('renderiza resultados da busca global', async () => {
    vi.useFakeTimers();
    setupShell();
    api.medications = vi
      .fn()
      .mockResolvedValue([{ name: 'Amoxicillin', sku: 'CA-AMX-001' }]);
    api.patients = vi
      .fn()
      .mockResolvedValue([{ name: 'Amara Okafor', code: 'PT-001' }]);
    api.prescriptions = vi.fn().mockResolvedValue([
      {
        code: 'RX-001',
        state: 'ready',
        patient: { name: 'Amara Okafor' },
        medication: { name: 'Amoxicillin' },
      },
    ]);
    bindShellEvents();

    const input = document.querySelector('[data-global-search]');
    input.value = 'amo';
    input.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(230);

    const panel = document.getElementById('globalSearchPanel');

    expect(panel.classList).not.toContain('d-none');
    expect(panel.textContent).toContain('Amoxicillin');
    expect(panel.textContent).toContain('RX-001');
    expect(api.medications).toHaveBeenCalled();
  });

  it('limpa sessao ao sair', async () => {
    setupShell();
    api.logout = vi.fn().mockResolvedValue(null);
    bindShellEvents();
    vi.spyOn(auth, 'redirectToLogin').mockImplementation(() => {});

    document.getElementById('logoutButton').click();
    await Promise.resolve();

    expect(auth.token).toBeNull();
  });
});
