const ADMIN_LOGIN_KEY = "dr_admin_logged";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("admin-login-form");
  const emailInput = document.getElementById("admin-email");
  const passInput = document.getElementById("admin-password");
  const errorEl = document.getElementById("admin-auth-error");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const pass = passInput.value.trim();

    // Можеш да ги смениш с каквито искаш
    const VALID_EMAIL = "admin@drustur.bg";
    const VALID_PASS = "admin123";

    if (email === VALID_EMAIL && pass === VALID_PASS) {
      localStorage.setItem(ADMIN_LOGIN_KEY, "1");
      window.location.href = "index.html";
    } else {
      errorEl.textContent = "Невалидни данни за вход.";
    }
  });
});
