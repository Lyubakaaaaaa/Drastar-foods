document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("admin-stats-grid");
  const healthBody = document.getElementById("admin-health-body");
  const healthStatusText = document.getElementById("admin-health-status-text");
  const healthDot = document.querySelector(".admin-health-dot");

  /* ---------- HEALTH CHECK ---------- */

  async function loadHealth() {
    // ако по някаква причина липсва HTML-а за health – излизаме тихо
    if (!healthBody || !healthStatusText) return;

    try {
      const res = await fetch("health.php", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);

      const data = await res.json();
      const ok = data.ok === true;
      const checks = data.checks || {};

      // статус текст
      healthStatusText.textContent = ok ? "Всичко е наред" : "Открити са проблеми";

      // лампичка
      if (healthDot) {
        if (ok) {
          healthDot.style.background = "#22C55E";
          healthDot.style.boxShadow = "0 0 0 4px rgba(34,197,94,0.25)";
        } else {
          healthDot.style.background = "#EF4444";
          healthDot.style.boxShadow = "0 0 0 4px rgba(248,113,113,0.35)";
        }
      }

      // малки „пилета“ с info
      const pills = [];

      function pill(label, good) {
        const cls = good
          ? "admin-health-pill"
          : "admin-health-pill admin-health-pill--bad";
        return `<span class="${cls}">${label}</span>`;
      }

      pills.push(
        pill("PHP " + (checks.php_version || "?"), true),
        pill("data/ съществува", !!checks.data_dir_exists),
        pill("data/ writable", !!checks.data_dir_writable),
        pill("products.json съществува", !!checks.products_exists),
        pill("products.json readable", !!checks.products_readable),
        pill("валиден JSON", !!checks.products_json_valid),
        pill("продукти: " + (checks.products_count ?? "?"), !!checks.products_json_valid),
        pill("products.json writable", !!checks.products_writable),
        pill("write test", !!checks.data_write_test),
        pill(
          "save-products.php",
          !!checks.save_products_exists && !!checks.save_products_readable
        )
      );

      healthBody.innerHTML = pills.join("");
    } catch (err) {
      console.error("Admin health error:", err);
      healthStatusText.textContent = "Грешка при проверката";
      if (healthDot) {
        healthDot.style.background = "#F97316";
        healthDot.style.boxShadow = "0 0 0 4px rgba(249,115,22,0.35)";
      }
      healthBody.innerHTML =
        '<span class="admin-health-pill admin-health-pill--bad">Неуспешна връзка с health.php</span>';
    }
  }

  /* ---------- СТАТИСТИКИ ЗА ПРОДУКТИ ---------- */

  async function loadStats() {
    if (!grid) return;

    const products = await adminLoadProducts(); // идва от admin-api.js

    const total = products.length;
    const featured = products.filter((p) => p.featured === true).length;
    const isNew = products.filter((p) => p.is_new === true).length;

    grid.innerHTML = `
      <div class="admin-stat-card">
        <div class="admin-stat-label">Общо продукти</div>
        <div class="admin-stat-value">${total}</div>
        <div class="admin-stat-sub">Всички активни артикули в каталога</div>
      </div>

      <div class="admin-stat-card">
        <div class="admin-stat-label">Най-поръчвани</div>
        <div class="admin-stat-value">${featured}</div>
        <div class="admin-stat-sub">Продукти с <code>featured: true</code></div>
      </div>

      <div class="admin-stat-card">
        <div class="admin-stat-label">Нови продукти</div>
        <div class="admin-stat-value">${isNew}</div>
        <div class="admin-stat-sub">Продукти с <code>is_new: true</code></div>
      </div>
    `;
  }

  await loadHealth();
  await loadStats();
});
