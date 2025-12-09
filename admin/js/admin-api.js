const ADMIN_PRODUCTS_KEY = "drustur_products_v1";

/* Зареждане на продукти */
async function adminLoadProducts() {
  // 1) Опит от localStorage
  try {
    const cached = localStorage.getItem(ADMIN_PRODUCTS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Admin: проблем с кеша", e);
  }

  // 2) Ако няма кеш – зареждаме от /data/products.json
  try {
    const res = await fetch("../data/products.json");
    if (!res.ok) throw new Error("HTTP error " + res.status);
    const data = await res.json();
    if (Array.isArray(data)) {
      localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(data));
      return data;
    }
    return [];
  } catch (e) {
    console.error("Admin: грешка при зареждане на products.json", e);
    return [];
  }
}

/* Пращане към PHP за записване в products.json */
async function adminSaveProductsRemote(products) {
  try {
    const res = await fetch("save-products.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(products),
    });

    if (!res.ok) {
      console.error("Admin: save-products.php върна грешка", res.status);
      return false;
    }

    const data = await res.json().catch(() => null);
    if (!data || !data.ok) {
      console.error("Admin: save-products.php не върна ok", data);
      return false;
    }

    return true;
  } catch (e) {
    console.error("Admin: грешка при извикване на save-products.php", e);
    return false;
  }
}

/* Главна функция за запис – localStorage + PHP */
async function adminSaveProducts(products) {
  // 1) Локален кеш, за да работи админът веднага
  try {
    localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error("Admin: грешка при запис в localStorage", e);
  }

  // 2) Обновяваме products.json на сървъра
  const ok = await adminSaveProductsRemote(products);
  if (!ok) {
    alert(
      "⚠ Продуктите са записани локално, но не успя да се обнови products.json на сървъра."
    );
  }
}
