const ADMIN_LOGIN_KEY = "dr_admin_logged";

function adminRequireAuth() {
  const isLogged = localStorage.getItem(ADMIN_LOGIN_KEY) === "1";
  const isLoginPage = window.location.pathname.endsWith("/login.html") ||
                      window.location.pathname.endsWith("login.html");

  if (!isLogged && !isLoginPage) {
    window.location.href = "login.html";
  }
}

function adminInitLogoutButton() {
  const logoutBtn = document.getElementById("admin-logout-btn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(ADMIN_LOGIN_KEY);
    window.location.href = "login.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  adminRequireAuth();
  adminInitLogoutButton();
});
