
document.addEventListener("DOMContentLoaded", () => {
  
  document.querySelectorAll(".accordion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const section = btn.closest(".accordion");
      if (!section) return;
      section.classList.toggle("open");
    });
  });
});

/* ------------------------------------------------------------------ */
/*  ГЛОБАЛНИ НАСТРОЙКИ                                                */
/* ------------------------------------------------------------------ */

// локален кеш (можеш да го махнеш ако не искаш localStorage)
const PRODUCTS_KEY = "drustur_products_v1";



// производители – етикети
const MANUFACTURER_TITLES = {
  baldaran: "Балдаран",
  devin: "Devin",
  hell: "Hell",
  coca_cola: "Coca-Cola",
  barilla: "Barilla",
  krina: "Krina",
  ariel: "Ariel",
  fairy: "Fairy"
};

// fallback заглавия за стари/твърдо кодирани категории
const CATEGORY_TITLES = {
  "": "Продукти",
  all: "Продукти",
  napitki: "Напитки",
  hranitelnI: "Хранителни продукти",
  nehranitelnI: "Нехранителни продукти"
};

// fallback заглавия за подкатегории
const SUBCATEGORY_TITLES = {
  spageti: "Спагети",
  voda: "Води",
  energiyni: "Енергийни напитки",
  gazirani: "Газирани напитки"
};


// всички продукти
let allProducts = [];

// state на филтрите
const state = {
  search: "",
  manufacturers: [],
  category: "",
  subcategory: "",
  subsubcategory: "",
  currentPage: 1,
  pageSize: 12
};


async function checkUserLogin() {
  try {
    const res = await fetch(AUTH_API_URL + "?action=me", {
      method: "GET",
      credentials: "same-origin"
    });
    if (!res.ok) {
      userIsLoggedIn = false;
      return;
    }
    const data = await res.json();
    userIsLoggedIn = !!data.loggedIn;
  } catch (e) {
    userIsLoggedIn = false;
  }
}

/* ------------------------------------------------------------------ */
/*  CATEGORIES.JSON – зареждане и helpers                             */
/* ------------------------------------------------------------------ */

/* ----------------------- КАТЕГОРИИ ОТ categories.json ----------------------- */

let categoriesState = {
  categories: [],
  subcategories: [],
  subsubcategories: []
};

let currentCategoryId = null;
let currentSubcategoryId = null;
let currentSubsubcategoryId = null;

async function loadCategories() {
  try {
    const res = await fetch("data/categories.json?ts=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();

    // НОВО: поддържаме и subsubcategories, и старото subSubcategories
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const subcategories = Array.isArray(data.subcategories) ? data.subcategories : [];
    const subsubcategories = Array.isArray(data.subsubcategories)
      ? data.subsubcategories
      : (Array.isArray(data.subsubcategories) ? data.subsubcategories : []);

    return { categories, subcategories, subsubcategories };
  } catch (err) {
    console.error("Грешка при зареждане на categories.json", err);
    return { categories: [], subcategories: [], subsubcategories: [] };
  }
}

async function ensureCategoriesLoaded() {
  const data = await loadCategories();

  const categories      = data.categories.slice();
  const subcategories   = data.subcategories.slice();
  const subsubcategories = data.subsubcategories.slice();

  categories.sort((a, b) => (a.order || 0) - (b.order || 0));
  subcategories.sort((a, b) => (a.order || 0) - (b.order || 0));
  subsubcategories.sort((a, b) => (a.order || 0) - (b.order || 0));

  categoriesState = { categories, subcategories, subsubcategories };

  // валидация на избраните филтри
  const catIds = new Set(categories.map((c) => c.id));
  if (state.category && !catIds.has(state.category)) {
    state.category = "";
  }

  const subIds = new Set(
    subcategories.map((s) => s.id)
  );
  if (state.subcategory && !subIds.has(state.subcategory)) {
    state.subcategory = "";
  }

  const subSubIds = new Set(subsubcategories.map((s) => s.id));
  if (state.subsubcategory && !subSubIds.has(state.subsubcategory)) {
    state.subsubcategory = "";
  }

  return categoriesState;
}

// Текстове за заглавие и breadcrumb
function getCategoryLabel(id) {
  if (!id) return "Продукти";
  const found = categoriesState.categories.find(c => c.id === id);
  return (found && found.name) || id;
}

function getSubcategoryLabel(id) {
  if (!id) return "";
  const found = categoriesState.subcategories.find(s => s.id === id);
  return (found && found.name) || id;
}

function getSubSubcategoryLabel(id) {
  if (!id) return "";
  const found = categoriesState.subsubcategories.find((s) => s.id === id);
  return (found && found.name) || id;
}
/* ------------------------------------------------------------------ */
/*  PRODUCTS.JSON – зареждане                                         */
/* ------------------------------------------------------------------ */

async function loadProducts() {
  // кеш от localStorage (по желание)
  const cached = localStorage.getItem(PRODUCTS_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        allProducts = parsed;
        return parsed;
      }
    } catch (e) {
      console.warn("Повреден кеш, ще заредя наново products.json");
    }
  }

  const res = await fetch("data/products.json?ts=" + Date.now());
  if (!res.ok) {
    console.error("Грешка при зареждане на products.json");
    return [];
  }
  const data = await res.json();

  if (Array.isArray(data)) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(data));
    allProducts = data;
    return data;
  }
  return [];
}

/* ------------------------------------------------------------------ */
/*  URL ⇄ STATE                                                       */
/* ------------------------------------------------------------------ */

function initStateFromUrl() {
  const params = new URLSearchParams(window.location.search);

  state.search = params.get("search") || "";

  const mans = params.get("manufacturers");
  state.manufacturers = mans ? mans.split(",").filter(Boolean) : [];

  const cat = params.get("category");
  state.category = cat || "";

  const sub = params.get("subcategory");
  state.subcategory = sub || "";

  const subsub = params.get("subsubcategory");
  state.subsubcategory = subsub || "";

  const pageParam = parseInt(params.get("page") || "1", 10);
  state.currentPage = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;
}

function updateUrlFromState() {
  const params = new URLSearchParams();

  if (state.search.trim() !== "") {
    params.set("search", state.search.trim());
  }
  if (state.manufacturers.length > 0) {
    params.set("manufacturers", state.manufacturers.join(","));
  }
  if (state.category && state.category !== "all") {
    params.set("category", state.category);
  }
  if (state.subcategory) {
    params.set("subcategory", state.subcategory);
  }
  if (state.subsubcategory) {
    params.set("subsubcategory", state.subsubcategory);
  }
  if (state.currentPage > 1) {
    params.set("page", String(state.currentPage));
  }

  const newUrl =
    window.location.pathname +
    (params.toString() ? "?" + params.toString() : "");

  window.history.replaceState(state, "", newUrl);
}

/* ------------------------------------------------------------------ */
/*  ФИЛТРИРАНЕ НА ПРОДУКТИТЕ                                          */
/* ------------------------------------------------------------------ */

function filterProducts() {
  let products = allProducts.slice();

  // 1) Категория
  if (state.category && state.category !== "all") {
    products = products.filter((p) => p.category === state.category);
  }

  // 2) Подкатегория
  if (state.subcategory) {
    products = products.filter((p) => p.subcategory === state.subcategory);
  }

  // 3) Под-подкатегория
  if (state.subsubcategory) {
    products = products.filter(
      (p) => p.subsubcategory === state.subsubcategory
    );
  }

  // 4) Производители
  if (state.manufacturers.length > 0) {
    products = products.filter((p) =>
      state.manufacturers.includes(p.manufacturer)
    );
  }

  // 5) Търсачка
  if (state.search.trim() !== "") {
    const q = state.search.trim().toLowerCase();
    products = products.filter((p) =>
      (p.name || "").toLowerCase().includes(q)
    );
  }

  return products;
}


/* ------------------------------------------------------------------ */
/*  ПРОИЗВОДИТЕЛИ                                                     */
/* ------------------------------------------------------------------ */

function getScopedProductsForManufacturers() {
  let products = allProducts.slice();

  if (state.category && state.category !== "all") {
    products = products.filter(p => p.category === state.category);
  }
  if (state.subcategory) {
    products = products.filter(p => p.subcategory === state.subcategory);
  }

  return products;
}

function getManufacturersForCurrentScope() {
  const scoped = getScopedProductsForManufacturers();
  const set = new Set();
  scoped.forEach(p => {
    if (p.manufacturer) set.add(p.manufacturer);
  });
  return Array.from(set);
}

function renderManufacturers() {
  const container = document.querySelector("[data-role='manufacturer-list']");
  if (!container) return;

  const manufacturers = getManufacturersForCurrentScope();

  state.manufacturers = state.manufacturers.filter(m =>
    manufacturers.includes(m)
  );

  if (manufacturers.length === 0) {
    container.innerHTML = `
      <p style="font-size:13px; color:#6B7280;">
        Няма производители за тази категория.
      </p>
    `;
    return;
  }

  manufacturers.sort((a, b) => {
    const nameA = MANUFACTURER_TITLES[a] || a;
    const nameB = MANUFACTURER_TITLES[b] || b;
    return nameA.localeCompare(nameB, "bg");
  });

  container.innerHTML = manufacturers
    .map(m => {
      const isChecked = state.manufacturers.includes(m) ? "checked" : "";
      const label = MANUFACTURER_TITLES[m] || m;
      return `
        <label class="checkbox-row">
          <input type="checkbox" name="manufacturer" value="${m}" ${isChecked}>
          <span class="checkbox-custom"></span>
          <span>${label}</span>
        </label>
      `;
    })
    .join("");

  initManufacturerFilters();
}

/* ------------------------------------------------------------------ */
/*  РЕНДЕРИРАНЕ НА ПРОДУКТИТЕ                                         */
/* ------------------------------------------------------------------ */

function formatPrice(num) {
  if (typeof num !== "number") num = Number(num) || 0;
  return num.toFixed(2).replace(".", ",");
}

function productCardTemplate(p) {
  const priceBgn = formatPrice(p.price_bgn);
  const priceEur = formatPrice(p.price_eur);

  let priceHtml;
  if (userIsLoggedIn) {
    priceHtml = `
      <div class="product-price">
        ${priceBgn} лв. / ${priceEur} € / стк
      </div>
    `;
  } else {
    priceHtml = `
      <div class="product-price product-price--hidden">
        Влезте в профила си, за да видите цените
      </div>
    `;
  }

  return `
    <article class="product-card" data-product-id="${p.id}">
      <img src="${p.image}" alt="${p.name}" class="product-image">

      <div class="product-code">Код: ${p.code || "—"}</div>

      <h2 class="product-name">
        ${p.name}
      </h2>

      <div class="product-unit">${p.unit || "СТК."}</div>

      ${priceHtml}

      <button type="button" class="btn-primary product-btn" data-product-id="${p.id}">
        ВИЖ ДЕТАЙЛИ
      </button>
    </article>
  `;
}

function formatProductCount(n) {
  if (n === 1) return "1 продукт";
  if (n >= 2 && n <= 4) return `${n} продукта`;
  return `${n} продукти`;
}

function renderProducts() {
  const grid = document.querySelector("[data-role='product-grid']");
  const countEl = document.querySelector("[data-role='product-count']");
  if (!grid || !countEl) return;

  const filtered = filterProducts();
  const total = filtered.length;

  countEl.textContent = formatProductCount(total);
  renderPagination(total);

  if (total === 0) {
    grid.innerHTML = `
      <p style="grid-column: 1 / -1; text-align:center; color:#6B7280;">
        Няма продукти, отговарящи на избраните филтри.
      </p>
    `;
    return;
  }

  const pageSize = state.pageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (state.currentPage > totalPages) state.currentPage = totalPages;

  const startIndex = (state.currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filtered.slice(startIndex, endIndex);

  grid.innerHTML = pageItems.map(productCardTemplate).join("");
  updatePricesVisibility();
}

// Викай това всеки път, когато:
// - заредиш продуктите
// - се промени auth състоянието (login / logout)
function updatePricesVisibility() {
  const priceWrappers = document.querySelectorAll('[data-price-locked]');

  priceWrappers.forEach((wrap) => {
    const priceValueEl = wrap.querySelector('[data-price-value]');
    const lockedMsgEl = wrap.querySelector('[data-price-locked-msg]');

    if (userIsLoggedIn) {
      // показваме цената
      if (priceValueEl) priceValueEl.style.display = '';
      if (lockedMsgEl) lockedMsgEl.style.display = 'none';
    } else {
      // скриваме цената
      if (priceValueEl) priceValueEl.style.display = 'none';
      if (lockedMsgEl) lockedMsgEl.style.display = '';
    }
  });
}


function updateAuthUI() {
  // ако имаш бутон "Вход", "Профил", "Изход", ги превключи тук

  const loginBtn = document.querySelector('[data-btn-login]');
  const profileBtn = document.querySelector('[data-btn-profile]');
  const logoutBtn = document.querySelector('[data-btn-logout]');

  if (loginBtn)  loginBtn.style.display  = userIsLoggedIn ? 'none' : '';
  if (profileBtn) profileBtn.style.display = userIsLoggedIn ? '' : 'none';
  if (logoutBtn) logoutBtn.style.display = userIsLoggedIn ? '' : 'none';

  // най-важното: обновяваме видимостта на цените
  updatePricesVisibility();
}

/* ------------------------------------------------------------------ */
/*  ПАГИНАЦИЯ                                                         */
/* ------------------------------------------------------------------ */

function renderPagination(totalItems) {
  const container = document.querySelector("[data-role='pagination']");
  if (!container) return;

  const pageSize = state.pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  if (state.currentPage > totalPages) state.currentPage = totalPages;

  let html = "";
  const hasPrev = state.currentPage > 1;

  if (hasPrev) {
    html += `<button class="pagination-btn" data-page="${state.currentPage - 1}">‹</button>`;
  } else {
    html += `<button class="pagination-btn pagination-btn--disabled">‹</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    const activeClass = i === state.currentPage ? " pagination-btn--active" : "";
    html += `<button class="pagination-btn${activeClass}" data-page="${i}">${i}</button>`;
  }

  const hasNext = state.currentPage < totalPages;
  if (hasNext) {
    html += `<button class="pagination-btn" data-page="${state.currentPage + 1}">›</button>`;
  } else {
    html += `<button class="pagination-btn pagination-btn--disabled">›</button>`;
  }

  container.innerHTML = html;
}

function initPagination() {
  const container = document.querySelector("[data-role='pagination']");
  if (!container) return;

  container.addEventListener("click", e => {
    const btn = e.target.closest("[data-page]");
    if (!btn) return;

    const page = parseInt(btn.getAttribute("data-page"), 10);
    if (isNaN(page)) return;

    state.currentPage = page;
    updateUrlFromState();
    renderProducts();

    const topEl =
      document.querySelector(".products-content") ||
      document.querySelector("[data-role='product-grid']");
    if (topEl) {
      const rect = topEl.getBoundingClientRect();
      const offset = window.scrollY + rect.top - 90;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  });
}

/* ------------------------------------------------------------------ */
/*  МОДАЛ ЗА ПРОДУКТА                                                 */
/* ------------------------------------------------------------------ */

function fillProductModal(p) {
  const img = document.getElementById("modal-product-image");
  const title = document.getElementById("modal-product-title");
  const cat = document.getElementById("modal-product-category");
  const man = document.getElementById("modal-product-manufacturer");
  const priceBgnEl = document.getElementById("modal-price-bgn");
  const priceEurEl = document.getElementById("modal-price-eur");
  const desc = document.getElementById("modal-product-description");
  const code = document.getElementById("modal-product-code");

  if (img) {
    img.src = p.image;
    img.alt = p.name;
  }
  if (title) title.textContent = p.name;
  if (code) code.textContent = "Код: " + (p.code || "—");

  if (cat) {
    const key = p.category || "";
    const label = getCategoryLabel(key) || key || "Други";
    cat.textContent = "Категория: " + label;
  }
  if (man) {
    const label = MANUFACTURER_TITLES[p.manufacturer] || p.manufacturer || "";
    man.textContent = "Производител: " + label;
  }
if (userIsLoggedIn) {
  if (priceBgnEl) {
    priceBgnEl.textContent = formatPrice(p.price_bgn) + " лв.";
  }
  if (priceEurEl) {
    priceEurEl.textContent = formatPrice(p.price_eur) + " €";
  }
} else {
  if (priceBgnEl) {
    priceBgnEl.textContent = "Влезте, за да видите цената";
  }
  if (priceEurEl) {
    priceEurEl.textContent = "";
  }
}

  if (desc) {
    desc.textContent =
      p.description ||
      "За този продукт все още няма въведено подробно описание.";
  }
}

function openProductModal(productId) {
  const product = allProducts.find(p => String(p.id) === String(productId));
  if (!product) return;


  
  const backdrop = document.getElementById("product-backdrop");
  const modal = document.getElementById("product-modal");
  if (!backdrop || !modal) return;

  fillProductModal(product);

  backdrop.classList.add("is-visible");
  modal.classList.add("is-open");
  document.body.classList.add("no-scroll");
}

function closeProductModal() {
  const backdrop = document.getElementById("product-backdrop");
  const modal = document.getElementById("product-modal");
  if (!backdrop || !modal) return;

  backdrop.classList.remove("is-visible");
  modal.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
}

function initProductModal() {
  const grid = document.querySelector("[data-role='product-grid']");
  const backdrop = document.getElementById("product-backdrop");
  const closeBtn = document.getElementById("product-modal-close");

  if (grid) {
    grid.addEventListener("click", e => {
      const clickable = e.target.closest(".product-card, .product-btn");
      if (!clickable || !grid.contains(clickable)) return;

      const id = clickable.getAttribute("data-product-id");
      if (!id) return;

      e.preventDefault();
      openProductModal(id);
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", e => {
      if (e.target === backdrop) closeProductModal();
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", closeProductModal);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeProductModal();
  });
}

/* ------------------------------------------------------------------ */
/*  PAGE HEADER (title + breadcrumb)                                  */
/* ------------------------------------------------------------------ */

function updatePageHeader() {
  const titleEl = document.querySelector("[data-role='page-title']");
  const breadcrumbEl = document.querySelector("[data-role='breadcrumb']");
  if (!titleEl || !breadcrumbEl) return;

  const catTitle = state.category
    ? getCategoryLabel(state.category)
    : "Продукти";

  let title = catTitle || "Продукти";
  let breadcrumb = "Начало / Продукти";

  if (state.category) {
    breadcrumb += " / " + (catTitle || state.category);
  }

  if (state.subcategory) {
    const subTitle =
      getSubcategoryLabel(state.subcategory) || state.subcategory;
    title = `${catTitle} / ${subTitle}`;
    breadcrumb += " / " + subTitle;
  }

  if (state.subsubcategory) {
    const ssTitle =
      getSubSubcategoryLabel(state.subsubcategory) || state.subsubcategory;
    title += " / " + ssTitle;
    breadcrumb += " / " + ssTitle;
  }

  titleEl.textContent = title.toUpperCase();
  breadcrumbEl.textContent = breadcrumb;
}



/* ------------------------------------------------------------------ */
/*  Инициализация на филтрите                                         */
/* ------------------------------------------------------------------ */

function initManufacturerFilters() {
  const checkboxes = document.querySelectorAll("input[name='manufacturer']");
  if (!checkboxes.length) return;

  checkboxes.forEach(cb => {
    if (state.manufacturers.includes(cb.value)) cb.checked = true;

    cb.addEventListener("change", () => {
      const value = cb.value;

      if (cb.checked) {
        if (!state.manufacturers.includes(value)) {
          state.manufacturers.push(value);
        }
      } else {
        state.manufacturers = state.manufacturers.filter(m => m !== value);
      }

      state.currentPage = 1;
      updateUrlFromState();
      renderProducts();
    });
  });
}

function initSearchBar() {
  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");
  if (!form || !input) return;

  input.value = state.search;

  form.addEventListener("submit", e => {
    e.preventDefault();
    state.search = input.value || "";
    state.currentPage = 1;
    updateUrlFromState();
    renderProducts();
  });

  input.addEventListener("input", () => {
    if (input.value === "" && state.search !== "") {
      state.search = "";
      state.currentPage = 1;
      updateUrlFromState();
      renderProducts();
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Рендер на категориите в сайдбара                                  */
/* ------------------------------------------------------------------ */

function renderCategoriesSidebar() {
  const container = document.getElementById("filters-categories");
  if (!container) return;

  const { categories, subcategories, subsubcategories } = categoriesState;

  // групиране подкатегории по категория
  const subsByCategory = {};
  subcategories.forEach((sub) => {
    if (!subsByCategory[sub.categoryId]) {
      subsByCategory[sub.categoryId] = [];
    }
    subsByCategory[sub.categoryId].push(sub);
  });

  // групиране под-подкатегории по подкатегория
  const subSubBySub = {};
  categoriesState.subsubcategories.forEach((ss) => {
    if (!subSubBySub[ss.subcategoryId]) {
      subSubBySub[ss.subcategoryId] = [];
    }
    subSubBySub[ss.subcategoryId].push(ss);
  });

  // Състояние на отворени/затворени групи (localStorage)
  let sidebarState = {};
  try {
    sidebarState = JSON.parse(localStorage.getItem("sidebarState_v1")) || {};
  } catch (e) { sidebarState = {}; }

  function isOpen(key, def = true) {
    return sidebarState[key] !== undefined ? sidebarState[key] : def;
  }

  function setOpen(key, val) {
    sidebarState[key] = val;
    localStorage.setItem("sidebarState_v1", JSON.stringify(sidebarState));
  }

  let html = `
    <button 
      class="filter-pill filter-pill--full ${!state.category ? "filter-pill--active" : ""}"
      data-filter-type="category"
      data-cat-id="">
      Всички продукти
    </button>
    <div class="filters-categories-list">
  `;

  categories.forEach((cat) => {
    const catActive = state.category === cat.id;
    const catKey = `cat_${cat.id}`;
    const catOpen = isOpen(catKey, true);
    html += `
      <div class="filters-category-group" data-cat="${cat.id}">
        <div class="filters-category-row">
          <button
            class="filter-pill filters-category-pill ${catActive && !state.subcategory ? "filter-pill--active" : ""}"
            data-filter-type="category"
            data-cat-id="${cat.id}">
            ${cat.name || cat.id}
          </button>
          <button class="sidebar-toggle-btn" data-toggle-group="${catKey}" aria-label="Покажи/скрий подкатегории">
            <span class="sidebar-toggle-icon" style="transform:rotate(${catOpen ? 0 : -90}deg)">▶</span>
          </button>
        </div>
    `;
    const subs = subsByCategory[cat.id] || [];
    if (subs.length > 0 && catOpen) {
      html += `<div class="filters-subcategory-list">`;
      subs.forEach((sub) => {
        const subActive = state.subcategory === sub.id && !state.subsubcategory;
        const subKey = `sub_${sub.id}`;
        const subOpen = isOpen(subKey, true);
        html += `
          <div class="filters-subcategory-group" data-subcat="${sub.id}">
            <div class="filters-subcategory-row">
              <button
                class="filter-pill filters-subcategory-pill ${subActive ? "filter-pill--active" : ""}"
                data-filter-type="subcategory"
                data-cat-id="${cat.id}"
                data-subcat-id="${sub.id}">
                ${sub.name || sub.id}
              </button>
              <button class="sidebar-toggle-btn" data-toggle-group="${subKey}" aria-label="Покажи/скрий подподкатегории">
                <span class="sidebar-toggle-icon" style="transform:rotate(${subOpen ? 0 : -90}deg)">▶</span>
              </button>
            </div>
        `;
        const subSubs = subSubBySub[sub.id] || [];
        if (subSubs.length > 0 && subOpen) {
          html += `<div class="filters-subsubcategory-list">`;
          subSubs.forEach((ss) => {
            const ssActive = state.subsubcategory === ss.id;
            html += `
              <button
                class="filter-pill filters-subsubcategory-pill ${ssActive ? "filter-pill--active" : ""}"
                data-filter-type="subsubcategory"
                data-cat-id="${cat.id}"
                data-subcat-id="${sub.id}"
                data-subsubcat-id="${ss.id}">
                ${ss.name || ss.id}
              </button>
            `;
          });
          html += `</div>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
  });

  html += `</div>`;
  container.innerHTML = html;

  // делегирани кликове за филтри
  container.onclick = (e) => {
    const btn = e.target.closest("button[data-filter-type]");
    if (!btn) return;
    const type = btn.dataset.filterType;
    if (type === "category") {
      const catId = btn.dataset.catId || "";
      state.category = catId;
      state.subcategory = "";
      state.subsubcategory = "";
    } else if (type === "subcategory") {
      state.category = btn.dataset.catId || "";
      state.subcategory = btn.dataset.subcatId || "";
      state.subsubcategory = "";
    } else if (type === "subsubcategory") {
      state.category = btn.dataset.catId || "";
      state.subcategory = btn.dataset.subcatId || "";
      state.subsubcategory = btn.dataset.subsubcatId || "";
    }
    state.currentPage = 1;
    renderCategoriesSidebar();
    updateUrlFromState();
    updatePageHeader();
    renderManufacturers();
    renderProducts();
  };

  // делегирани кликове за скриване/показване
  container.querySelectorAll(".sidebar-toggle-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const group = btn.getAttribute("data-toggle-group");
      setOpen(group, !isOpen(group));
      renderCategoriesSidebar();
    };
  });
}



function getFilteredProducts() {
  let result = allProducts.slice();

  if (state.category) {
    result = result.filter(p => p.category === state.category);
  }

  if (state.subcategory) {
    result = result.filter(p => (p.subcategory || "") === state.subcategory);
  }

  if (state.subsubcategory) {
    result = result.filter(p => (p.subsubcategory || "") === state.subsubcategory);
  }

  // ... тук останалите филтри – manufacturer, search, цена и т.н.

  return result;
}

/* ----------------------- MAIN INIT ----------------------- */

async function initProductsPage() {
  // четем state от URL (?cat=...&sub=...)
  initStateFromUrl();

  // синхронизираме текущите ID-та
  currentCategoryId = state.category || null;
  currentSubcategoryId = state.subcategory || null;
  currentSubsubcategoryId = state.subsubcategory || null;

  // 1) categories.json
  await ensureCategoriesLoaded();
  // 2) products.json
  const loaded = await loadProducts();
  allProducts = Array.isArray(loaded) ? loaded : [];

  // проверяваме дали има логнат потребител (за цените)
  await checkUserLogin();

  // sidebar и филтри
  renderCategoriesSidebar();   // строи бутоните от categoriesState
  renderManufacturers();       // производители според филтъра

  initSearchBar();
  initPagination();

  updateUrlFromState();
  updatePageHeader();          // заглавие + breadcrumb от categories.json
  renderProducts();
  initProductModal();
  
}



document.addEventListener("DOMContentLoaded", initProductsPage);
