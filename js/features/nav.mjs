export function initHeaderNav() {
  const header = document.querySelector("header");
  const headerBar = document.querySelector(".header-bar");
  const menuBtn = document.getElementById("menu-toggle");
  const mobilePanel = document.getElementById("mobile-nav"); // new mobile panel
  const mobileNav = document.getElementById("mobile-nav");
  const mobileGroup = mobileNav?.querySelector(".mobile-group");
  const mobileAccordion = mobileNav?.querySelector(".mobile-accordion");

  if (!header || !headerBar) {
    return;
  }

  if (mobileGroup && mobileAccordion) {
    mobileAccordion.addEventListener("click", () => {
      const isOpen = mobileGroup.classList.toggle("open");
      mobileAccordion.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const setHeaderHeightVar = () => {
    const h =
            document.querySelector("header")?.getBoundingClientRect().height ||
            64;
    document.documentElement.style.setProperty("--header-h", `${h}px`);
  };
  setHeaderHeightVar();
  window.addEventListener("load", setHeaderHeightVar);
  window.addEventListener("resize", setHeaderHeightVar);

  // Toggle mobile panel (full screen below header)
  if (menuBtn && mobilePanel) {
    menuBtn.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      menuBtn.setAttribute("aria-expanded", String(open));
      mobilePanel.setAttribute("aria-hidden", String(!open));
    });
  }

  const dropdown = document.querySelector(".dropdown");
  const dropdownBtn = document.querySelector(".dropdown-btn");
  if (dropdown && dropdownBtn) {
    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle("open");
      dropdownBtn.setAttribute("aria-expanded", String(isOpen));
    });
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("open");
        dropdownBtn.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        dropdown.classList.remove("open");
        dropdownBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  (function () {
    const isGh = location.hostname.endsWith("github.io");
    const repo = "WonderW-Learning/"; // ¡tu nombre de repo!
    const base = document.createElement("base");
    base.href = isGh ? `/${repo}` : "/";
    document.head.prepend(base);
  })();
}
