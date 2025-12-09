let categoriesState = {
  categories: [],
  subcategories: [],
  subsubcategories: []
};
  
  async function loadCategoriesData() {
  try {
    const res = await fetch("../data/categories.json?ts=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);

  const data = await res.json();

  categoriesState = {
    categories: Array.isArray(data.categories) ? data.categories : [],
    subcategories: Array.isArray(data.subcategories) ? data.subcategories : [],
    subsubcategories: Array.isArray(data.subsubcategories)
      ? data.subsubcategories
      : (Array.isArray(data.subsubcategories) ? data.subsubcategories : []),
  };
  } catch (err) {
    console.error("Грешка при зареждане на категориите:", err);
    alert("Не успях да заредя categories.json. Виж конзолата.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCategoriesData();
  fillCategorySelect();
  const tbody = document.getElementById("admin-products-tbody");
  const searchInput = document.getElementById("admin-products-search");
  const exportBtn = document.getElementById("admin-products-export");
  const addBtn = document.getElementById("admin-products-add");
  
  const modalBackdrop = document.getElementById("admin-product-modal-backdrop");
  const modalTitle = document.getElementById("admin-product-modal-title");
  const modalCloseBtn = document.getElementById("admin-product-modal-close");
  const modalCancelBtn = document.getElementById("admin-product-cancel");
  const form = document.getElementById("admin-product-form");

  const idInput = document.getElementById("admin-product-id");
  const codeInput = document.getElementById("admin-product-code");
  const nameInput = document.getElementById("admin-product-name");
// при смяна на категория → презареждаме подкатегории + под-подкатегории
  const catInput = document.getElementById("admin-product-category");
  const subInput = document.getElementById("admin-product-subcategory");

  

  if (catInput) {
    catInput.addEventListener("change", () => {
      fillSubcategorySelect();
    });
  }

  if (subInput) {
    subInput.addEventListener("change", () => {
      fillSubSubcategorySelect();
    });
  }
  const subsubInput = document.getElementById("admin-product-subsubcategory");
  const manInput = document.getElementById("admin-product-manufacturer");
  const unitInput = document.getElementById("admin-product-unit");
  const priceBgnInput = document.getElementById("admin-product-price-bgn");
  const priceEurInput = document.getElementById("admin-product-price-eur");
  const imageInput = document.getElementById("admin-product-image");
  const descInput = document.getElementById("admin-product-description");
  const featuredInput = document.getElementById("admin-product-featured");
  const isNewInput = document.getElementById("admin-product-is-new");
  

  

  if (!tbody) return;

  let products = await adminLoadProducts();
  // Показвай всички продукти, дори без снимка или име
  let filtered = [...products];
  let editingId = null; // null = нов продукт





  /* ------------ РЕНДЕР НА ТАБЛИЦАТА ------------ */

  function renderTable(rows) {
    if (!rows || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10">Няма продукти</td></tr>`;
      return;
    }
    tbody.innerHTML = rows
      .map((p) => {
        return `<tr>
          <td>${p.id || ''}</td>
          <td>${p.code || ''}</td>
          <td>${p.name || ''}</td>
          <td><img src="${p.image || ''}" alt="" style="max-width:60px;max-height:60px;"></td>
          <td>${p.category || ''}</td>
          <td>${p.subcategory || ''}</td>
          <td>${p.subsubcategory || ''}</td>
          <td>${p.price_bgn || ''}</td>
          <td>${p.price_eur || ''}</td>
          <td>
            <button data-edit="${p.id}">✏️</button>
            <button data-delete="${p.id}">🗑️</button>
          </td>
        </tr>`;
      })
      .join("");
  }

function fillCategorySelect() {
  const catInput = document.getElementById("admin-product-category");
  const subcatInput = document.getElementById("admin-product-subcategory");
  const subSubcatInput = document.getElementById("admin-product-subsubcategory");

  if (!catInput || !subcatInput || !subSubcatInput) {
    console.warn("Липсват селекти за категории в модала.");
    return;
  }

  const { categories = [], subcategories = [], subsubcategories = [] } = categoriesState;

  // 1) Пълним категориите
  const activeCats = categories
    .filter(c => c.active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  catInput.innerHTML =
    '<option value="">(без категория)</option>' +
    activeCats.map(c => `<option value="${c.id}">${c.name}</option>`).join("");

  // helper – зарежда подкатегории и под-подкатегории
  function reloadSubcats(catId, selectedSubId = "", selectedSubSubId = "") {
    // подкатегории за избраната категория
    const subs = subcategories
      .filter(s => s.categoryId === catId && s.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    subcatInput.innerHTML =
      '<option value="">(без подкатегория)</option>' +
      subs.map(s => `<option value="${s.id}">${s.name}</option>`).join("");

    subcatInput.value = selectedSubId || "";

    // под-подкатегории за избраната подкатегория
    const subSubs = subsubcategories
      .filter(ss => ss.subcategoryId === (selectedSubId || "") && ss.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    subSubcatInput.innerHTML =
      '<option value="">(без под-подкатегория)</option>' +
      subSubs.map(ss => `<option value="${ss.id}">${ss.name}</option>`).join("");

    subSubcatInput.value = selectedSubSubId || "";
  }

  // 2) При промяна на категория – зареждаме подкатегориите и чистим под-подкатегорията
  catInput.onchange = () => {
    const catId = catInput.value || "";
    reloadSubcats(catId, "", "");
  };

  // 3) При промяна на подкатегория – зареждаме САМО под-подкатегориите
  subcatInput.onchange = () => {
    const subId = subcatInput.value || "";

    const subSubs = subsubcategories
      .filter(ss => ss.subcategoryId === subId && ss.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    subSubcatInput.innerHTML =
      '<option value="">(без под-подкатегория)</option>' +
      subSubs.map(ss => `<option value="${ss.id}">${ss.name}</option>`).join("");

    subSubcatInput.value = "";
  };
}


function fillSubcategorySelect(categoryId, selectedSubId) {
  if (!subcatInput) return;
  subcatInput.innerHTML = `<option value="">— без подкатегория —</option>`;

  const subs = categoriesState.subcategories
    .filter(s => s.categoryId === categoryId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  subs.forEach(sub => {
    const opt = document.createElement("option");
    opt.value = sub.id;
    opt.textContent = sub.name || sub.id;
    if (selectedSubId && selectedSubId === sub.id) opt.selected = true;
    subcatInput.appendChild(opt);
  });
}

function fillSubSubcategorySelect(subcategoryId, selectedSubSubId) {
  if (!subsubInput) return;
  subsubInput.innerHTML = `<option value="">— без под-подкатегория —</option>`;

  const subSubs = categoriesState.subsubcategories
    .filter(ss => ss.subcategoryId === subcategoryId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  subSubs.forEach(ss => {
    const opt = document.createElement("option");
    opt.value = ss.id;
    opt.textContent = ss.name || ss.id;
    if (selectedSubSubId && selectedSubSubId === ss.id) opt.selected = true;
    subsubInput.appendChild(opt);
  });
}

  /* ------------ ТЪРСАЧКА ------------ */

  function applySearch() {
    const q = (searchInput?.value || "").trim().toLowerCase();
    if (!q) {
      filtered = [...products];
    } else {
      filtered = products.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const code = (p.code || "").toLowerCase();
        return name.includes(q) || code.includes(q);
      });
    }
    renderTable(filtered);
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applySearch();
    });
  }

  /* ------------ ЕКСПОРТ НА JSON ------------ */

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(products, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products-export.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  /* ------------ МОДАЛ: ОТВАРЯНЕ / ЗАТВАРЯНЕ ------------ */

  function openModalForCreate() {
    editingId = null;
    if (!form) return;
    form.reset();
    idInput.value = "";
    featuredInput.checked = false;
    isNewInput.checked = false;
    modalTitle.textContent = "Нов продукт";

    modalBackdrop.classList.add("is-visible");
  }

  function openModalForEdit(productId) {
    const p = products.find((x) => String(x.id) === String(productId));
    if (!p || !form) return;

    editingId = p.id;

    idInput.value = p.id;
    codeInput.value = p.code || "";
    nameInput.value = p.name || "";
    catInput.value = p.category || "";
    fillSubSubcategorySelect(p.subcategory || "", p.subsubcategory || "");
    manInput.value = p.manufacturer || "";
    unitInput.value = p.unit || "СТК.";
    priceBgnInput.value = p.price_bgn != null ? String(p.price_bgn) : "";
    priceEurInput.value = p.price_eur != null ? String(p.price_eur) : "";
    imageInput.value = p.image || "";
    descInput.value = p.description || "";
    featuredInput.checked = p.featured === true;
    isNewInput.checked = p.is_new === true;

    modalTitle.textContent = "Редакция на продукт";

    modalBackdrop.classList.add("is-visible");
  }

  function closeModal() {
    modalBackdrop.classList.remove("is-visible");
  }

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      openModalForCreate();
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeModal);
  }

  if (modalCancelBtn) {
    modalCancelBtn.addEventListener("click", closeModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    });
  }

  /* ------------ КЛИК ПО ТАБЛИЦАТА: EDIT / DELETE ------------ */

  tbody.addEventListener("click", async (e) => {
    const editBtn = e.target.closest("button[data-edit]");
    const deleteBtn = e.target.closest("button[data-delete]");
    if (editBtn) {
      const id = editBtn.getAttribute("data-edit");
      openModalForEdit(id);
      return;
    }
    if (deleteBtn) {
      const id = deleteBtn.getAttribute("data-delete");
      if (confirm("Сигурни ли сте, че искате да изтриете този продукт?")) {
        products = products.filter((p) => String(p.id) !== String(id));
        await adminSaveProducts(products);
        applySearch();
      }
      return;
    }
  });

/* ------------ SUBMIT НА ФОРМАТА (CREATE / UPDATE) ------------ */

if (!form) {
  console.warn("Липсва форма за продуктите.");
  return;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const idRaw = idInput.value.trim();
  const code = codeInput.value.trim();
  const name = nameInput.value.trim();

  // ВЗИМАМЕ СЕЛЕКТИТЕ ЛОКАЛНО, ЗА ДА НЯМА ПРОБЛЕМИ СЪС SCOPE / СТАР СКРИПТ
  const catSelect = document.getElementById("admin-product-category");
  const subcatSelect = document.getElementById("admin-product-subcategory");
  const subSubcatSelect = document.getElementById("admin-product-subsubcategory");

  const category = catSelect ? catSelect.value.trim() : "";
  const subcategory = subcatSelect ? subcatSelect.value.trim() : "";
  const subsubcategory = subSubcatSelect ? subSubcatSelect.value.trim() : "";

  const manufacturer = manInput.value.trim();
  const unit = unitInput.value.trim();
  const priceBgn = Number(priceBgnInput.value.replace(",", ".") || 0);
  const priceEur = Number(priceEurInput.value.replace(",", ".") || 0);
  const image = imageInput.value.trim();
  const description = descInput.value.trim();
  const featured = featuredInput.checked;
  const isNew = isNewInput.checked;

  if (!code || !name) {
    alert("Кодът и името на продукта са задължителни.");
    return;
  }

  const editingId = idRaw ? Number(idRaw) : null;

  if (editingId == null) {
    // НОВ продукт
    const maxId =
      products.length > 0
        ? Math.max(...products.map((p) => Number(p.id) || 0))
        : 0;

    const newId = maxId + 1;

    const newProduct = {
      id: newId,
      code,
      name,
      category,
      subcategory,
      subsubcategory,
      manufacturer,
      unit,
      price_bgn: priceBgn,
      price_eur: priceEur,
      image,
      description,
      featured,
      is_new: isNew,
    };

    products.push(newProduct);
  } else {
    // РЕДАКЦИЯ
    products = products.map((p) => {
      if (Number(p.id) !== editingId) return p;
      return {
        ...p,
        code,
        name,
        category,
        subcategory,
        subsubcategory,
        manufacturer,
        unit,
        price_bgn: priceBgn,
        price_eur: priceEur,
        image,
        description,
        featured,
        is_new: isNew,
      };
    });
  }

  await adminSaveProducts(products);
  applySearch();
  closeModal();
});

  /* ------------ ПЪРВОНАЧАЛЕН РЕНДЕР ------------ */

  renderTable(filtered);
});
