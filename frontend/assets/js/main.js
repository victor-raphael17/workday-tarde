import { auth } from "./api.js";
import { bindPageBehaviors } from "./page-behaviors.js";
import { bindShellEvents, loadNavCounts, renderShell } from "./shell.js";

const pageId = document.body.dataset.page || "dashboard";

// Route guard: every page that loads the shell requires a session.
if (!auth.token) {
  auth.redirectToLogin();
}

renderShell(pageId);
bindShellEvents();
loadNavCounts();
bindPageBehaviors(pageId);

if (window.lucide) {
  window.lucide.createIcons();
}
