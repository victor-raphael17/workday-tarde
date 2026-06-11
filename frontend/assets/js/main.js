import { ApiError, api, auth } from './api.js';
import { bindPageBehaviors } from './page-behaviors.js';
import { bindShellEvents, loadNavCounts, renderShell } from './shell.js';

const pageId = document.body.dataset.page || 'dashboard';

async function bootstrap() {
  if (!auth.token) {
    auth.redirectToLogin();
    return;
  }

  const expiresAt = auth.session?.expires_at;

  if (expiresAt) {
    const expiresTime = new Date(expiresAt).getTime();

    if (!Number.isNaN(expiresTime) && Date.now() >= expiresTime) {
      auth.clear();
      auth.redirectToLogin();
      return;
    }
  }

  try {
    await api.me();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      auth.clear();
      auth.redirectToLogin();
      return;
    }
  }

  renderShell(pageId);
  bindShellEvents();
  loadNavCounts();
  bindPageBehaviors(pageId);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

bootstrap();
