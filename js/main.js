// main.js

document.addEventListener("DOMContentLoaded", () => {
  /* --------- MOBILE NAV --------- */
  const navToggle = document.getElementById("nav-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const navBackdrop = document.getElementById("nav-backdrop");

  if (navToggle && mobileNav && navBackdrop) {
    function closeNav() {
      mobileNav.classList.remove("is-open");
      navBackdrop.classList.remove("is-visible");
      navToggle.classList.remove("is-open");
    }

    navToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("is-open");
      navBackdrop.classList.toggle("is-visible", isOpen);
      navToggle.classList.toggle("is-open", isOpen);
    });

    navBackdrop.addEventListener("click", closeNav);

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });
  }

  /* --------- MOBILE FILTERS (SIDEBAR) --------- */
  const filtersToggle = document.getElementById("filters-toggle");
  const sidebar = document.querySelector(".sidebar");
  const globalBackdrop = document.getElementById("nav-backdrop"); // използваме същия

  if (filtersToggle && sidebar && globalBackdrop) {
    function closeFilters() {
      sidebar.classList.remove("is-open");
      globalBackdrop.classList.remove("is-visible");
    }

    filtersToggle.addEventListener("click", () => {
      const isOpen = sidebar.classList.toggle("is-open");
      globalBackdrop.classList.toggle("is-visible", isOpen);
    });

    globalBackdrop.addEventListener("click", () => {
      // ако sidebar е отворен – затваряме и него
      if (sidebar.classList.contains("is-open")) {
        closeFilters();
      }
      // ако mobile nav е отворен – затваряме и него (от горната логика)
    });
  }
});
