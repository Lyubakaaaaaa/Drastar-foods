// js/admin-categories.js
console.log("admin-categories.js loaded");

// PHP API-то, което записва и връща categories.json
const CATEGORIES_API = "/admin/api/save_categories.php"; // или "/admin/api/save_categories.php" ако искаш абсолютен път

const CATEGORIES_LOAD_URL = `${CATEGORIES_API}?action=load`;
const CATEGORIES_SAVE_URL = `${CATEGORIES_API}?action=save`;

// Данни
let categories = [];
let subcategories = [];
let subsubcategories = [];

// Текущи селекции
let selectedCategoryId = null;
let selectedSubcategoryId = null;

// Търсене
let categorySearch = "";
let subcategorySearch = "";
let subsubSearch = "";

// Режим за модали
let editingCategoryId = null;
let editingSubcategoryId = null;
let editingSubsubId = null;

// ---------------------- INIT ----------------------

async function initAdminCategoriesPage() {
  await fetchCategoriesFromServer();
  renderCategoriesTable();
  renderSubcategoriesTable();
  renderSubsubcategoriesTable();
  initAdminCategoriesEvents();
}

// ---------------------- FETCH / SAVE ----------------------

// зареждане
async function fetchCategoriesFromServer() {
  try {
    const res = await fetch(CATEGORIES_LOAD_URL + "&ts=" + Date.now());
    if (!res.ok) throw new Error("Грешка при зареждане на категориите");
    const data = await res.json();
    // Попълваме масивите
    categories = Array.isArray(data.categories) ? data.categories : [];
    subcategories = Array.isArray(data.subcategories) ? data.subcategories : [];
    subsubcategories = Array.isArray(data.subsubcategories) ? data.subsubcategories : [];
    sortAllCollections();
  } catch (err) {
    showAdminToast("Грешка при зареждане на категориите: " + err.message);
    categories = [];
    subcategories = [];
    subsubcategories = [];
  }
}

// запис
async function saveCategoriesToServer() {
  try {
    const payload = { categories, subcategories, subsubcategories };

    const res = await fetch(CATEGORIES_SAVE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json().catch(() => null);
    console.log("Резултат от save_categories.php:", data);

    await fetchCategoriesFromServer(); // презареждаме след запис
  } catch (err) {
    console.error("Грешка при запис на категориите:", err);
    alert("Грешка при запис (виж Console / Network)");
  }
}

// ---------------------- HELPERИ ----------------------

function sortAllCollections() {
  categories.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name, "bg"));
  subcategories.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name, "bg"));
  subsubcategories.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name, "bg"));
}

function getCategoryNameById(id) {
  const c = categories.find((cat) => cat.id === id);
  return c ? c.name : id || "—";
}

function getSubcategoryNameById(id) {
  const s = subcategories.find((sub) => sub.id === id);
  return s ? s.name : id || "—";
}

function showAdminToast(msg) {
  // много прост toast – ако имаш готов, може да го замениш
  console.log("[ADMIN]", msg);
}

// ---------------------- РЕНДЕР: КАТЕГОРИИ ----------------------

function renderCategoriesTable() {
  const tbody = document.getElementById("admin-categories-tbody");
  const countEl = document.getElementById("admin-categories-count");
  if (!tbody) return;

  let list = categories.slice();
  if (categorySearch.trim() !== "") {
    const q = categorySearch.trim().toLowerCase();
    list = list.filter((c) => (c.name || "").toLowerCase().includes(q) || (c.id || "").toLowerCase().includes(q));
  }

  countEl && (countEl.textContent = list.length.toString());

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="admin-empty">
          Няма категории.
        </td>
      </tr>
    `;
    return;
  }

tbody.innerHTML = list
    .map((cat) => {
      const isSelected = cat.id === selectedCategoryId;
      // Определяме кой бадж да използваме
      const activeBadge = cat.active
        ? '<span class="admin-category-active-badge">Да</span>'
        : '<span class="admin-category-inactive-badge">Не</span>';

      return `
        <tr 
          data-cat-id="${cat.id}"
          class="${isSelected ? "admin-row--selected" : ""}"
        >
          <td>${cat.id}</td>
          <td>${cat.name}</td>
          <td>${cat.order ?? ""}</td>
          
          <td style="width: 110px;">${activeBadge}</td>

          <td class="admin-actions">
            <button 
              type="button" 
              class="admin-action-btn"
              data-edit-category-id="${cat.id}">
              ✏
            </button>
            <button 
              type="button" 
              class="admin-action-btn admin-action-btn--danger"
              data-delete-category-id="${cat.id}">
              🗑
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ---------------------- РЕНДЕР: ПОДКАТЕГОРИИ ----------------------

function renderSubcategoriesTable() {
  const tbody = document.getElementById("admin-subcategories-tbody");
  const countEl = document.getElementById("admin-subcategories-count");
  const forEl = document.getElementById("admin-subcategories-for");
  if (!tbody) return;

  let list = subcategories.slice();

  if (selectedCategoryId) {
    list = list.filter((s) => s.categoryId === selectedCategoryId);
    if (forEl) {
      forEl.textContent = "за: " + getCategoryNameById(selectedCategoryId);
    }
  } else {
    if (forEl) {
      forEl.textContent = "(избери категория отляво)";
    }
  }

  if (subcategorySearch.trim() !== "") {
    const q = subcategorySearch.trim().toLowerCase();
    list = list.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.id || "").toLowerCase().includes(q)
    );
  }

  countEl && (countEl.textContent = list.length.toString());

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="admin-empty">
          ${selectedCategoryId ? "Няма подкатегории за тази категория." : "Избери категория отляво."}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list
    .map((sub) => {
      const isSelected = sub.id === selectedSubcategoryId;
      return `
        <tr 
          data-subcat-id="${sub.id}"
          class="${isSelected ? "admin-row--selected" : ""}"
        >
          <td>${sub.id}</td>
          <td>${sub.name}</td>
          <td>${getCategoryNameById(sub.categoryId)}</td>
          <td>${sub.order ?? ""}</td>
          <td class="admin-actions">
            <button 
              type="button" 
              class="admin-action-btn"
              data-edit-subcategory-id="${sub.id}">
              ✏
            </button>
            <button 
              type="button" 
              class="admin-action-btn admin-action-btn--danger"
              data-delete-subcategory-id="${sub.id}">
              🗑
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ---------------------- РЕНДЕР: ПОД-ПОДКАТЕГОРИИ ----------------------

function renderSubsubcategoriesTable() {
  const tbody = document.getElementById("admin-subsubcategories-tbody");
  const countEl = document.getElementById("admin-subsubcategories-count");
  const forEl = document.getElementById("admin-subsubcategories-for");
  if (!tbody) return;

  let list = subsubcategories.slice();

  if (selectedSubcategoryId) {
    list = list.filter((x) => x.subcategoryId === selectedSubcategoryId);
    if (forEl) {
      forEl.textContent = "за: " + getSubcategoryNameById(selectedSubcategoryId);
    }
  } else {
    if (forEl) {
      forEl.textContent = "(избери подкатегория от средната таблица)";
    }
  }

  if (subsubSearch.trim() !== "") {
    const q = subsubSearch.trim().toLowerCase();
    list = list.filter(
      (x) =>
        (x.name || "").toLowerCase().includes(q) ||
        (x.id || "").toLowerCase().includes(q)
    );
  }

  countEl && (countEl.textContent = list.length.toString());

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="admin-empty">
          ${
            selectedSubcategoryId
              ? "Няма под-подкатегории за тази подкатегория."
              : "Избери подкатегория от средната таблица."
          }
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list
    .map((item) => {
      return `
        <tr data-subsub-id="${item.id}">
          <td>${item.id}</td>
          <td>${item.name}</td>
          <td>${getSubcategoryNameById(item.subcategoryId)}</td>
          <td>${item.order ?? ""}</td>
          <td class="admin-actions">
            <button 
              type="button" 
              class="admin-action-btn"
              data-edit-subsub-id="${item.id}">
              ✏
            </button>
            <button 
              type="button" 
              class="admin-action-btn admin-action-btn--danger"
              data-delete-subsub-id="${item.id}">
              🗑
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ---------------------- МОДАЛИ: КАТЕГОРИЯ ----------------------

function openCategoryModal(mode, cat) {
  editingCategoryId = mode === "edit" && cat ? cat.id : null;

  const backdrop = document.getElementById("admin-category-modal-backdrop");
  const titleEl = document.getElementById("admin-category-modal-title");
  const idInput = document.getElementById("admin-category-id");
  const nameInput = document.getElementById("category-name");
  const orderInput = document.getElementById("category-order");
  const activeInput = document.getElementById("category-active");

  if (!backdrop) return;

  if (mode === "edit" && cat) {
    titleEl && (titleEl.textContent = "Редакция на категория");
    idInput && (idInput.value = cat.id || "");
    idInput && (idInput.disabled = false); // Allow editing ID
    nameInput && (nameInput.value = cat.name || "");
    orderInput && (orderInput.value = cat.order ?? "");
    if (activeInput) activeInput.value = cat.active ? "true" : "false";
  } else {
    titleEl && (titleEl.textContent = "Нова категория");
    idInput && ((idInput.value = ""), (idInput.disabled = false));
    nameInput && (nameInput.value = "");
    orderInput && (orderInput.value = "");
    if (activeInput) activeInput.value = "true";
  }

  backdrop.classList.add("is-visible");
}

function closeCategoryModal() {
  const backdrop = document.getElementById("admin-category-modal-backdrop");
  if (backdrop) backdrop.classList.remove("is-visible");
  editingCategoryId = null;
}

// ---------------------- МОДАЛИ: ПОДКАТЕГОРИЯ ----------------------

function openSubcategoryModal(mode, sub) {
  editingSubcategoryId = mode === "edit" && sub ? sub.id : null;

  const backdrop = document.getElementById("admin-subcategory-modal-backdrop");
  const titleEl = document.getElementById("admin-subcategory-modal-title");
  const idInput = document.getElementById("subcat-id");
  const nameInput = document.getElementById("subcat-name");
  const orderInput = document.getElementById("subcat-order");
  const parentSelect = document.getElementById("subcat-categoryId");

  if (!backdrop) return;

  // пълним падащия списък с категории
  if (parentSelect) {
    parentSelect.innerHTML = categories
      .map(
        (c) => `<option value="${c.id}" ${selectedCategoryId === c.id ? "selected" : ""}>${c.name}</option>`
      )
      .join("");
  }

  if (mode === "edit" && sub) {
    titleEl && (titleEl.textContent = "Редакция на подкатегория");
    idInput && (idInput.value = sub.id || "");
    idInput && (idInput.disabled = false); // Allow editing ID
    nameInput && (nameInput.value = sub.name || "");
    orderInput && (orderInput.value = sub.order ?? "");
    if (parentSelect) parentSelect.value = sub.categoryId || "";
  } else {
    titleEl && (titleEl.textContent = "Нова подкатегория");
    idInput && ((idInput.value = ""), (idInput.disabled = false));
    nameInput && (nameInput.value = "");
    orderInput && (orderInput.value = "");
    if (parentSelect && selectedCategoryId) {
      parentSelect.value = selectedCategoryId;
    }
  }

  backdrop.classList.add("is-visible");
}

function closeSubcategoryModal() {
  const backdrop = document.getElementById("admin-subcategory-modal-backdrop");
  if (backdrop) backdrop.classList.remove("is-visible");
  editingSubcategoryId = null;
}

// ---------------------- МОДАЛИ: ПОД-ПОДКАТЕГОРИЯ ----------------------

function openSubsubModal(mode, item) {
  editingSubsubId = mode === "edit" && item ? item.id : null;

  const backdrop = document.getElementById("admin-subsubcategory-modal-backdrop");
  const titleEl = document.getElementById("admin-subsubcategory-modal-title");
  const idInput = document.getElementById("admin-subsubcategory-id");
  const nameInput = document.getElementById("subsub-name");
  const orderInput = document.getElementById("subsub-order");
  const parentSelect = document.getElementById("subsub-parent");

  if (!backdrop) return;

  // падащ списък с подкатегории
  if (parentSelect) {
    parentSelect.innerHTML = subcategories
      .map(
        (s) => `<option value="${s.id}" ${selectedSubcategoryId === s.id ? "selected" : ""}>${s.name}</option>`
      )
      .join("");
  }

  if (mode === "edit" && item) {
    titleEl && (titleEl.textContent = "Редакция на под-подкатегория");
    idInput && (idInput.value = item.id || "");
    idInput && (idInput.disabled = false); // Allow editing ID
    nameInput && (nameInput.value = item.name || "");
    orderInput && (orderInput.value = item.order ?? "");
    if (parentSelect) parentSelect.value = item.subcategoryId || "";
  } else {
    titleEl && (titleEl.textContent = "Нова под-подкатегория");
    idInput && ((idInput.value = ""), (idInput.disabled = false));
    nameInput && (nameInput.value = "");
    orderInput && (orderInput.value = "");
    if (parentSelect && selectedSubcategoryId) {
      parentSelect.value = selectedSubcategoryId;
    }
  }

  backdrop.classList.add("is-visible");
}

function closeSubsubModal() {
  const backdrop = document.getElementById("admin-subsubcategory-modal-backdrop");
  if (backdrop) backdrop.classList.remove("is-visible");
  editingSubsubId = null;
}

// ---------------------- EVENTS ----------------------

function initAdminCategoriesEvents() {
  // --- Търсене
  const catSearchInput = document.getElementById("admin-categories-search");
  const subSearchInput = document.getElementById("admin-subcategories-search");
  const subsubSearchInput = document.getElementById("admin-subsubcategories-search");

  if (catSearchInput) {
    catSearchInput.addEventListener("input", () => {
      categorySearch = catSearchInput.value || "";
      renderCategoriesTable();
    });
  }

  if (subSearchInput) {
    subSearchInput.addEventListener("input", () => {
      subcategorySearch = subSearchInput.value || "";
      renderSubcategoriesTable();
    });
  }

  if (subsubSearchInput) {
    subsubSearchInput.addEventListener("input", () => {
      subsubSearch = subsubSearchInput.value || "";
      renderSubsubcategoriesTable();
    });
  }

  // --- Категории: избор, редакция, изтриване
  const catTbody = document.getElementById("admin-categories-tbody");
  if (catTbody) {
    catTbody.addEventListener("click", (e) => {
      const tr = e.target.closest("tr[data-cat-id]");
      if (!tr) return;
      const id = tr.getAttribute("data-cat-id");

      // Изтриване
      const delBtn = e.target.closest("[data-delete-category-id]");
      if (delBtn) {
        if (confirm("Сигурен ли си, че искаш да изтриеш тази категория?")) {
          categories = categories.filter((c) => c.id !== id);
          subcategories = subcategories.filter((s) => s.categoryId !== id);
          subsubcategories = subsubcategories.filter((x) => {
            const parentSub = subcategories.find((s) => s.id === x.subcategoryId);
            return parentSub && parentSub.categoryId !== id;
          });
          if (selectedCategoryId === id) {
            selectedCategoryId = null;
            selectedSubcategoryId = null;
          }
          sortAllCollections();
          renderCategoriesTable();
          renderSubcategoriesTable();
          renderSubsubcategoriesTable();
          saveCategoriesToServer();
        }
        return;
      }

      // Редакция
      const editBtn = e.target.closest("[data-edit-category-id]");
      if (editBtn) {
        const cat = categories.find((c) => c.id === id);
        if (cat) {
          openCategoryModal("edit", cat);
          return;
        }
      }

      // Просто избор на ред
      if (!e.target.closest("[data-edit-category-id]")) {
        selectedCategoryId = id;
        selectedSubcategoryId = null;
        renderCategoriesTable();
        renderSubcategoriesTable();
        renderSubsubcategoriesTable();
      }
    });
  }

  // --- Подкатегории: избор, редакция, изтриване
  const subTbody = document.getElementById("admin-subcategories-tbody");
  if (subTbody) {
    subTbody.addEventListener("click", (e) => {
      const tr = e.target.closest("tr[data-subcat-id]");
      if (!tr) return;
      const id = tr.getAttribute("data-subcat-id");

      const delBtn = e.target.closest("[data-delete-subcategory-id]");
      if (delBtn) {
        if (confirm("Да изтрием ли тази подкатегория?")) {
          subcategories = subcategories.filter((s) => s.id !== id);
          subsubcategories = subsubcategories.filter(
            (x) => x.subcategoryId !== id
          );
          if (selectedSubcategoryId === id) {
            selectedSubcategoryId = null;
          }
          sortAllCollections();
          renderSubcategoriesTable();
          renderSubsubcategoriesTable();
          saveCategoriesToServer();
        }
        return;
      }

      const editBtn = e.target.closest("[data-edit-subcategory-id]");
      if (editBtn) {
        const sub = subcategories.find((s) => s.id === id);
        if (sub) {
          openSubcategoryModal("edit", sub);
          return;
        }
      }

      // избор на подкатегория → зареждаме под-подкатегориите
      if (!e.target.closest("[data-edit-subcategory-id]")) {
        selectedSubcategoryId = id;
        renderSubcategoriesTable();
        renderSubsubcategoriesTable();
      }
    });
  }

  // --- Под-подкатегории: редакция / изтриване
  const subsubTbody = document.getElementById("admin-subsubcategories-tbody");
  if (subsubTbody) {
    subsubTbody.addEventListener("click", (e) => {
      const tr = e.target.closest("tr[data-subsub-id]");
      if (!tr) return;
      const id = tr.getAttribute("data-subsub-id");

      const delBtn = e.target.closest("[data-delete-subsub-id]");
      if (delBtn) {
        if (confirm("Да изтрием ли тази под-подкатегория?")) {
          subsubcategories = subsubcategories.filter((x) => x.id !== id);
          sortAllCollections();
          renderSubsubcategoriesTable();
          saveCategoriesToServer();
        }
        return;
      }

      const editBtn = e.target.closest("[data-edit-subsub-id]");
      if (editBtn) {
        const item = subsubcategories.find((x) => x.id === id);
        if (item) {
          openSubsubModal("edit", item);
          return;
        }
      }
    });
  }

  // --- Бутоните за "Нова ..."

  const addCatBtn = document.getElementById("admin-add-category-btn");
  if (addCatBtn) {
    addCatBtn.addEventListener("click", () => openCategoryModal("create"));
  }

  const addSubBtn = document.getElementById("admin-add-subcategory-btn");
  if (addSubBtn) {
    addSubBtn.addEventListener("click", () => {
      if (!categories.length) {
        alert("Първо създай поне една категория.");
        return;
      }
      openSubcategoryModal("create");
    });
  }

  const addSubsubBtn = document.getElementById("admin-add-subsubcategory-btn");
  if (addSubsubBtn) {
    addSubsubBtn.addEventListener("click", () => {
      if (!subcategories.length) {
        alert("Първо създай поне една подкатегория.");
        return;
      }
      openSubsubModal("create");
    });
  }

  // --- Формата за категория

  const catForm = document.getElementById("admin-category-form");
  if (catForm) {
    catForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("admin-category-id").value.trim();
      const name = document.getElementById("category-name").value.trim();
      const orderVal = document.getElementById("category-order").value;
      const order = orderVal === "" ? null : Number(orderVal);
      const activeVal = document.getElementById("category-active").value;
      const active = activeVal === "true";

      if (!id || !name) {
        alert("ID и име са задължителни за категория.");
        return;
      }

      if (editingCategoryId) {
        const idx = categories.findIndex((c) => c.id === editingCategoryId);
        if (idx !== -1) {
          // Update the ID if changed
          categories[idx] = { ...categories[idx], id, name, order, active };
          // Update all subcategories and subsubcategories with the new categoryId if ID changed
          if (categories[idx].id !== editingCategoryId) {
            subcategories.forEach((s) => {
              if (s.categoryId === editingCategoryId) s.categoryId = id;
            });
          }
        }
      } else {
        if (categories.some((c) => c.id === id)) {
          alert("Има вече категория с такова ID.");
          return;
        }
        categories.push({ id, name, order, active });
      }

      sortAllCollections();
      renderCategoriesTable();
      closeCategoryModal();
      saveCategoriesToServer();
    });
  }

  document
    .querySelectorAll("[data-close-category-modal]")
    .forEach((btn) => btn.addEventListener("click", closeCategoryModal));

  // --- Формата за подкатегория

  const subForm = document.getElementById("admin-subcategory-form");
  if (subForm) {
    subForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const id = document.getElementById("subcat-id").value.trim();
      const name = document.getElementById("subcat-name").value.trim();
      const orderVal = document.getElementById("subcat-order").value;
      const order = orderVal === "" ? null : Number(orderVal);
      const parentSelect = document.getElementById("subcat-categoryId");
      const categoryId = parentSelect ? parentSelect.value : "";

      if (!id || !name || !categoryId) {
        alert("ID, име и категория са задължителни за подкатегория.");
        return;
      }

      if (editingSubcategoryId) {
        const idx = subcategories.findIndex((s) => s.id === editingSubcategoryId);
        if (idx !== -1) {
          // Update the ID if changed
          subcategories[idx] = { ...subcategories[idx], id, name, order, categoryId };
          // Update all subsubcategories with the new subcategoryId if ID changed
          if (subcategories[idx].id !== editingSubcategoryId) {
            subsubcategories.forEach((x) => {
              if (x.subcategoryId === editingSubcategoryId) x.subcategoryId = id;
            });
          }
        }
      } else {
        if (subcategories.some((s) => s.id === id)) {
          alert("Има вече подкатегория с такова ID.");
          return;
        }
        subcategories.push({ id, name, order, categoryId });
      }

      sortAllCollections();
      renderSubcategoriesTable();
      renderSubsubcategoriesTable();
      closeSubcategoryModal();
      saveCategoriesToServer();
    });
  }

  document
    .querySelectorAll("[data-close-subcategory-modal]")
    .forEach((btn) => btn.addEventListener("click", closeSubcategoryModal));

  // --- Формата за под-подкатегория

  const subsubForm = document.getElementById("admin-subsubcategory-form");
  if (subsubForm) {
    subsubForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const id = document.getElementById("admin-subsubcategory-id").value.trim();
      const name = document.getElementById("subsub-name").value.trim();
      const orderVal = document.getElementById("subsub-order").value;
      const order = orderVal === "" ? null : Number(orderVal);
      const parentSelect = document.getElementById("subsub-parent");
      const subcategoryId = parentSelect ? parentSelect.value : "";

      if (!id || !name || !subcategoryId) {
        alert("ID, име и подкатегория са задължителни за под-подкатегория.");
        return;
      }

      if (editingSubsubId) {
        const idx = subsubcategories.findIndex((x) => x.id === editingSubsubId);
        if (idx !== -1) {
          // Update the ID if changed
          subsubcategories[idx] = { ...subsubcategories[idx], id, name, order, subcategoryId };
        }
      } else {
        if (subsubcategories.some((x) => x.id === id)) {
          alert("Има вече под-подкатегория с такова ID.");
          return;
        }
        subsubcategories.push({ id, name, order, subcategoryId });
      }

      sortAllCollections();
      renderSubsubcategoriesTable();
      closeSubsubModal();
      saveCategoriesToServer();
    });
  }

  document
    .querySelectorAll("[data-close-subsubcategory-modal]")
    .forEach((btn) => btn.addEventListener("click", closeSubsubModal));
}
document.addEventListener("DOMContentLoaded", initAdminCategoriesPage);