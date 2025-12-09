// js/user-auth.js


// ----- AUTH STATE -----
let currentUser = null;           // тук ще пазим логнатия потребител
let userIsLoggedIn = false;

// Вземаме текущия user от PHP: /admin/api/user_auth.php?action=me
async function fetchCurrentUser() {
  try {
    const res = await fetch('/admin/api/user_auth.php?action=me', {
      credentials: 'include'
    });

    // 401 = НЕ си логнат -> грешка няма, просто гост
    if (res.status === 401) {
      console.log('[AUTH] guest (401 от /me)');
      return null;
    }

    if (!res.ok) {
      console.error('[AUTH] HTTP error', res.status);
      return null;
    }

    const data = await res.json().catch(() => null);
    if (!data || !data.success || !data.user) {
      console.log('[AUTH] no user in response');
      return null;
    }

    return data.user;
  } catch (err) {
    console.error('[AUTH] fetchCurrentUser error:', err);
    return null;
  }
}

// Обновяване на глобалния state
async function checkUserLogin() {
  const user = await fetchCurrentUser();
  currentUser = user;
  userIsLoggedIn = !!user;

  console.log('[AUTH] userIsLoggedIn =', userIsLoggedIn, 'user =', user);

  updateAuthUI();        // ще я дефинираме след малко
}


const AUTH_API_URL = "admin/api/user_auth.php";

async function apiCall(action, data, method = "POST") {
  const url = `${AUTH_API_URL}?action=${encodeURIComponent(action)}`;

  const options = {
    method,
    headers: {},
    credentials: "same-origin"   // <- ВАЖНО: праща PHP сесийната бисквитка
  };

  if (method === "POST") {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data || {});
  }

  const res = await fetch(url, options);
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json;
}

// табове вход / регистрация
function initAuthTabs() {
  const tabs = document.querySelectorAll(".auth-tab");
  const loginBlock = document.getElementById("auth-login");
  const registerBlock = document.getElementById("auth-register");
  if (!tabs.length || !loginBlock || !registerBlock) return;

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const which = tab.dataset.tab;
      if (which === "login") {
        loginBlock.style.display = "";
        registerBlock.style.display = "none";
      } else {
        loginBlock.style.display = "none";
        registerBlock.style.display = "";
      }
    });
  });
}

function initLoginForm() {
  const form = document.getElementById("login-form");
  const msgEl = document.getElementById("login-message");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgEl.textContent = "";
    msgEl.className = "auth-message";

    const formData = new FormData(form);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password")
    };

    try {
      const res = await apiCall("login", payload);
      msgEl.textContent = "Успешен вход. Пренасочване...";
      msgEl.classList.add("success");

      setTimeout(() => {
        window.location.href = "products.html";
      }, 700);
    } catch (err) {
      msgEl.textContent = err.message || "Грешка при вход.";
      msgEl.classList.add("error");
    }
  });
}

function initRegisterForm() {
  const form = document.getElementById("register-form");
  const msgEl = document.getElementById("register-message");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgEl.textContent = "";
    msgEl.className = "auth-message";

    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password")
    };

    try {
      const res = await apiCall("register", payload);
      msgEl.textContent = "Профилът е създаден. Пренасочване...";
      msgEl.classList.add("success");

      setTimeout(() => {
        window.location.href = "products.html";
      }, 700);
    } catch (err) {
      msgEl.textContent = err.message || "Грешка при регистрация.";
      msgEl.classList.add("error");
    }
  });
}

async function handleLogout() {
  try {
    const res = await fetch('/admin/api/user_auth.php?action=logout', {
      method: 'POST',
      credentials: 'include'
    });

    // не ме интересува много какъв е статуса – чистим локалния state:
    currentUser = null;
    userIsLoggedIn = false;

    updateAuthUI();          // скриваме цените, сменяме бутоните
  } catch (err) {
    console.error('Logout error:', err);
  }
}

const logoutBtn = document.querySelector('[data-btn-logout]');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
  });
}

// навбар логика (ако имаш login / logout бутони)
async function initNavbarAuth() {
  const loginLink = document.getElementById("nav-login-link");
  const logoutBtn = document.getElementById("nav-logout-btn");

  if (!loginLink && !logoutBtn) return;

  try {
    await apiCall("me", null, "GET");
    // логнат
    if (loginLink) loginLink.style.display = "none";
    if (logoutBtn) {
      logoutBtn.style.display = "inline-flex";
      logoutBtn.onclick = async () => {
        try {
          await apiCall("logout", {}, "POST");
        } catch (e) {
          console.warn("Logout error:", e);
        }

        // ако сме на products.html – нулираме флага и рендерираме отново
        if (typeof userIsLoggedIn !== "undefined") {
          userIsLoggedIn = false;
          if (typeof renderProducts === "function") {
            renderProducts();
          }
        }

        // и накрая презареждаме страницата (за всеки случай)
        window.location.reload();
      };
    }
  } catch {
    // не е логнат
    if (loginLink) loginLink.style.display = "inline-flex";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}


document.addEventListener("DOMContentLoaded", () => {
  initAuthTabs();
  initLoginForm();
  initRegisterForm();
  initNavbarAuth();
});
