export function initHeaderNav() {
  const header = document.querySelector("header");
  const headerBar = document.querySelector(".header-bar");
  const menuBtn = document.getElementById("menu-toggle");
  const mobilePanel = document.getElementById("mobile-nav");
  const dropdown = document.querySelector(".dropdown");
  const dropdownBtn = document.querySelector(".dropdown-btn");

  if (!header || !headerBar) {return;}

  // --- Acordeón móvil (Learning Hub)
  const mobileGroup = mobilePanel?.querySelector(".mobile-group");
  const mobileAccordion = mobilePanel?.querySelector(".mobile-accordion");
  if (mobileGroup && mobileAccordion) {
    mobileAccordion.addEventListener("click", () => {
      const isOpen = mobileGroup.classList.toggle("open");
      mobileAccordion.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // --- CSS var de altura del header
  const setHeaderHeightVar = () => {
    const h = header.getBoundingClientRect().height || 64;
    document.documentElement.style.setProperty("--header-h", `${h}px`);
  };
  setHeaderHeightVar();
  window.addEventListener("load", setHeaderHeightVar);
  window.addEventListener("resize", setHeaderHeightVar);

  // --- Toggle móvil + icono hamburguesa (NUEVO)
  if (menuBtn && mobilePanel) {
    const closeMobile = () => {
      menuBtn.classList.remove("is-active");
      header.classList.remove("nav-open");
      menuBtn.setAttribute("aria-expanded", "false");
      mobilePanel.setAttribute("aria-hidden", "true");
    };

    menuBtn.addEventListener("click", () => {
      const active = menuBtn.classList.toggle("is-active"); // animación icono
      header.classList.toggle("nav-open", active); // muestra/oculta panel
      menuBtn.setAttribute("aria-expanded", String(active));
      mobilePanel.setAttribute("aria-hidden", String(!active));
    });

    // Cerrar al hacer clic en cualquier link del panel móvil
    mobilePanel.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (link) {closeMobile();}
    });

    // Cerrar con Escape cuando el foco está en el panel móvil
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && header.classList.contains("nav-open")) {
        closeMobile();
      }
    });

    // Reset al pasar a desktop (coincide con tu @media 901px)
    const mq = window.matchMedia("(min-width: 901px)");
    const handleMQ = (ev) => {
      if (ev.matches) {closeMobile();}
    };
    mq.addEventListener
      ? mq.addEventListener("change", handleMQ)
      : mq.addListener(handleMQ);
  }

  // --- Dropdown desktop accesible
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
      if (!dropdown.contains(e.target)) {toggleDd(false);}
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {toggleDd(false);}
    });
  }

  // --- <base> para GitHub Pages (opcional). Si deployas en Cloudflare con ruta raíz, no afecta.
  (function () {
    const isGh = location.hostname.endsWith("github.io");
    const repo = "WonderW-Learning/"; // ajusta si cambia el nombre del repo
    if (isGh) {
      const base = document.createElement("base");
      base.href = `/${repo}`;
      // Evita duplicar <base> si ya existe
      const existing = document.querySelector("head base");
      if (existing) {existing.replaceWith(base);}
      else {document.head.prepend(base);}
    }
  })();
}
