// File: /js/features/nav.mjs
// --- Header Navigation Logic ---

/**
 * initHeaderNav
 * @description Initializes all interactive elements in the site header, including mobile menu, dropdowns, and dynamic height variables.
 */
export function initHeaderNav() {
  const header = document.querySelector("header");
  const headerBar = document.querySelector(".header-bar");
  const menuBtn = document.getElementById("menu-toggle");
  const mobilePanel = document.getElementById("mobile-nav");
  const dropdown = document.querySelector(".dropdown");
  const dropdownBtn = document.querySelector(".dropdown-btn");

  if (!header || !headerBar) { return; }

  const mobileGroup = mobilePanel?.querySelector(".mobile-group");
  const mobileAccordion = mobilePanel?.querySelector(".mobile-accordion");
  if (mobileGroup && mobileAccordion) {
    mobileAccordion.addEventListener("click", () => {
      const isOpen = mobileGroup.classList.toggle("open");
      mobileAccordion.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const setHeaderHeightVar = () => {
    const h = header.getBoundingClientRect().height || 64;
    document.documentElement.style.setProperty("--header-h", `${h}px`);
  };
  setHeaderHeightVar();
  window.addEventListener("load", setHeaderHeightVar);
  window.addEventListener("resize", setHeaderHeightVar);

  if (menuBtn && mobilePanel) {
    const closeMobile = () => {
      menuBtn.classList.remove("is-active");
      header.classList.remove("nav-open");
      menuBtn.setAttribute("aria-expanded", "false");
      mobilePanel.setAttribute("aria-hidden", "true");
    };
    menuBtn.addEventListener("click", () => {
      const active = menuBtn.classList.toggle("is-active");
      header.classList.toggle("nav-open", active);
      menuBtn.setAttribute("aria-expanded", String(active));
      mobilePanel.setAttribute("aria-hidden", String(!active));
    });
    mobilePanel.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (link) { closeMobile(); }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && header.classList.contains("nav-open")) {
        closeMobile();
      }
    });
    const mq = window.matchMedia("(min-width: 901px)");
    const handleMQ = (ev) => {
      if (ev.matches) { closeMobile(); }
    };
    mq.addEventListener ? mq.addEventListener("change", handleMQ) : mq.addListener(handleMQ);
  }

  if (dropdown && dropdownBtn) {
    const toggleDd = (open) => {
      dropdown.classList.toggle("open", open);
      dropdownBtn.setAttribute("aria-expanded", String(open));
    };
    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDd(!dropdown.classList.contains("open"));
    });
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) { toggleDd(false); }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { toggleDd(false); }
    });
  }

  (function () {
    const isGh = location.hostname.endsWith("github.io");
    const repo = "WonderW-Learning/";
    if (isGh) {
      const base = document.createElement("base");
      base.href = `/${repo}`;
      const existing = document.querySelector("head base");
      if (existing) { existing.replaceWith(base); } else { document.head.prepend(base); }
    }
  })();
}