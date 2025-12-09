// js/index.js



let homeAllProducts = [];

/* --------- ЗАРЕЖДАНЕ НА ДАННИТЕ --------- */
async function loadProductsForHome() {
  try {
    const res = await fetch("data/products.json?ts=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.error("Home: грешка при зареждане на products.json", err);
    return [];
  }
}

/* --------- HELPER ЗА ЦЕНА --------- */
function formatHomePrice(value) {
  return (Number(value) || 0).toFixed(2).replace(".", ",");
}

/* --------- CARD TEMPLATE – същия стил като в каталога --------- */
function homeProductCardTemplate(p) {
  const priceBgn = formatHomePrice(p.price_bgn);
  const priceEur = formatHomePrice(p.price_eur);

  return `
    <article class="product-card" data-product-id="${p.id}">
      <img src="${p.image}" alt="${p.name}" class="product-image">

      <div class="product-code">Код: ${p.code || "—"}</div>

      <h3 class="product-name">
        ${p.name}
      </h3>

      <div class="product-unit">${p.unit || "СТК."}</div>

      <div class="product-price">
        ${priceBgn} лв. / ${priceEur} € / стк
      </div>

      <button type="button"
              class="btn-primary product-btn"
              data-product-id="${p.id}">
        ВИЖ ДЕТАЙЛИ
      </button>
    </article>
  `;
}

/* --------- МОДАЛ ЗА ПРОДУКТ --------- */
function fillHomeProductModal(p) {
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
  if (title) {
    title.textContent = p.name;
  }
  if (code) {
    code.textContent = "Код: " + (p.code || "—");
  }
  if (cat) {
    const label = p.category || "";
    cat.textContent = "Категория: " + label;
  }
  if (man) {
    const label = p.manufacturer || "";
    man.textContent = "Производител: " + label;
  }
  if (priceBgnEl) {
    priceBgnEl.textContent = formatHomePrice(p.price_bgn) + " лв.";
  }
  if (priceEurEl) {
    priceEurEl.textContent = formatHomePrice(p.price_eur) + " €";
  }
  if (desc) {
    desc.textContent =
      p.description ||
      "За този продукт все още няма въведено подробно описание.";
  }
}

function openHomeProductModal(id) {
  const product = homeAllProducts.find((p) => String(p.id) === String(id));
  if (!product) return;

  const backdrop = document.getElementById("product-backdrop");
  const modal = document.getElementById("product-modal");
  if (!backdrop || !modal) return;

  fillHomeProductModal(product);

  backdrop.classList.add("is-visible");
  modal.classList.add("is-open");
  document.body.classList.add("no-scroll");
}

function closeHomeProductModal() {
  const backdrop = document.getElementById("product-backdrop");
  const modal = document.getElementById("product-modal");
  if (!backdrop || !modal) return;

  backdrop.classList.remove("is-visible");
  modal.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
}

function initHomeProductModalEvents() {
  const backdrop = document.getElementById("product-backdrop");
  const closeBtn = document.getElementById("product-modal-close");

  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        closeHomeProductModal();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeHomeProductModal);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeHomeProductModal();
    }
  });
}

/* --------- ГЕНЕРИЧЕН СЛАЙДЕР ЗА СЕКЦИЯ --------- */
function initHomeProductsSectionSlider(config) {
  const {
    trackId,
    prevId,
    nextId,
    filterFn,
    maxItems = 12,
    perPage = 4
  } = config;

  const track = document.getElementById(trackId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);

  if (!track || !prevBtn || !nextBtn) return;

  // Филтрираме продуктите за конкретната секция
  let items = homeAllProducts.filter(filterFn);

  if (items.length === 0) {
    track.innerHTML = `
      <p style="grid-column:1/-1;text-align:center;color:#6B7280;">
        Няма продукти за показване в тази секция.
      </p>
    `;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  if (items.length > maxItems) {
    items = items.slice(0, maxItems);
  }

  let currentPage = 0;
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));

  function render() {
    if (currentPage < 0) currentPage = 0;
    if (currentPage > totalPages - 1) {
      currentPage = totalPages - 1;
    }

    const start = currentPage * perPage;
    const end = start + perPage;
    const slice = items.slice(start, end);

    track.innerHTML = slice.map(homeProductCardTemplate).join("");

    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
  }

  // стрелки
  prevBtn.addEventListener("click", () => {
    if (currentPage > 0) {
      currentPage--;
      render();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages - 1) {
      currentPage++;
      render();
    }
  });

  // клик на карта или бутон "ВИЖ ДЕТАЙЛИ"
  track.addEventListener("click", (e) => {
    const clickable = e.target.closest(".product-card, .product-btn");
    if (!clickable || !track.contains(clickable)) return;

    const id = clickable.getAttribute("data-product-id");
    if (!id) return;

    e.preventDefault();
    openHomeProductModal(id);
  });

  render();
}

/* --------- ИНИЦИАЛИЗАЦИЯ --------- */
async function initHomeProductsAll() {
  await loadHomeProductsData();
  initHomeProductModalEvents();

  // Секция 1: Най-поръчвани (featured: true)
  initHomeProductsSectionSlider({
    trackId: "home-products-track",
    prevId: "home-products-prev",
    nextId: "home-products-next",
    filterFn: (p) => p.featured === true,
    maxItems: 12,
    perPage: 4
  });

  // Секция 2: Нови продукти (is_new: true)
  initHomeProductsSectionSlider({
    trackId: "new-products-track",
    prevId: "new-products-prev",
    nextId: "new-products-next",
    filterFn: (p) => p.is_new === true,
    maxItems: 12,
    perPage: 4
  });
}

async function loadHomeProductsData() {
  homeAllProducts = await loadProductsForHome();
}

document.addEventListener("DOMContentLoaded", initHomeProductsAll);


 // 🟦 1) Spotlight ефект, който следва мишката
    const hero = document.querySelector('.hero');

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty('--mx', `${x}%`);
      hero.style.setProperty('--my', `${y}%`);
    });

    hero.addEventListener('mouseleave', () => {
      hero.style.setProperty('--mx', `50%`);
      hero.style.setProperty('--my', `0%`);
    });

    // Анимира числата при първо появяване на секцията
const aboutSection = document.querySelector(".about-section");
const statElements = document.querySelectorAll(".about-stat-value");

let statsAnimated = false;

function animateStats() {
  statElements.forEach((el) => {
    const target = parseInt(el.parentElement.getAttribute("data-target"), 10);
    const duration = 1200; // ms
    const startTime = performance.now();

    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Math.floor(progress * target);
      el.textContent = value;
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target; // финална стойност
    }

    requestAnimationFrame(update);
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !statsAnimated) {
        statsAnimated = true;
        animateStats();
      }
    });
  },
  { threshold: 0.3 }
);

if (aboutSection) {
  observer.observe(aboutSection);
}