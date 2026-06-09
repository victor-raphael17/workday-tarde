/**
 * Login page behaviour.
 *
 * Authenticates against the API (`POST /api/auth/login`). On success the
 * returned bearer token + user are stored via `auth` (local or session storage
 * per "Keep me signed in") and the user is forwarded to the dashboard; the API
 * client then attaches the token to every subsequent request.
 */

import { ApiError, api, auth } from "./api.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberInput = document.getElementById("remember");
const submitButton = document.getElementById("loginSubmit");
const errorBox = document.getElementById("authError");
const errorText = document.querySelector("[data-auth-error-text]");
const toggleButton = document.getElementById("togglePassword");

// Already signed in? Skip straight to the app.
if (auth.token) {
  window.location.replace("dashboard.html");
}

function showError(message) {
  errorText.textContent = message;
  errorBox.classList.remove("d-none");
}

function clearError() {
  errorBox.classList.add("d-none");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

toggleButton?.addEventListener("click", () => {
  const revealed = passwordInput.type === "text";
  passwordInput.type = revealed ? "password" : "text";
  toggleButton.setAttribute("aria-pressed", String(!revealed));
  toggleButton.setAttribute("aria-label", revealed ? "Show password" : "Hide password");
  toggleButton.innerHTML = `<i data-lucide="${revealed ? "eye" : "eye-off"}"></i>`;
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

[emailInput, passwordInput].forEach((input) => {
  input.addEventListener("input", clearError);
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!isValidEmail(email)) {
    showError("Enter a valid email address.");
    emailInput.focus();
    return;
  }
  if (!password) {
    showError("Enter your password.");
    passwordInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Signing in";

  try {
    const session = await api.login(email, password);
    auth.save(session, rememberInput.checked);
    window.location.href = "dashboard.html";
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.status === 401
          ? "Invalid email or password."
          : error.message
        : "Something went wrong. Please try again.";
    showError(message);
    submitButton.disabled = false;
    submitButton.textContent = "Sign in";
    passwordInput.focus();
  }
});

if (window.lucide) {
  window.lucide.createIcons();
}
