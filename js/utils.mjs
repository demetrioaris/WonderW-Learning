
/**
 * Intelligently calculates the site's base path.
 * @returns {string} The base path to use (e.g., "/src/", "/repo/", "/").
 */
export function siteBase() {
  const host = location.hostname;

  if (host === "127.0.0.1" || host === "localhost") {
    return "/src/";
  }

  const attr = document.documentElement.getAttribute("data-repo");
  if (attr) {
    return `/${attr.replace(/^\/|\/$/g, "")}/`;
  }

  if (host.endsWith("github.io")) {
    const segs = location.pathname.split("/").filter(Boolean);
    return segs.length ? `/${segs[0]}/` : "/";
  }
  
  return "/";
}

/** Resolves a relative path to be absolute with respect to the site base.
 * @param {string} path - The path to resolve (e.g. "images/pic.png").
 * @returns {string} The full absolute URL.
 */
export function resolveAbs(path) {
  const p = String(path || "");
  if (/^https?:\/\//i.test(p)) {
    return p;
  }
  const base = siteBase();
  const normalized = p.startsWith("/") ? p.slice(1) : p;
  return base + normalized;
}

export function qs(selector, ctx = document) { return ctx.querySelector(selector); }
export function qsa(selector, ctx = document) { return [...ctx.querySelectorAll(selector)]; }
export const $ = (selector, ctx = document) => ctx.querySelector(selector);
export const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

export function getLocalStorage(key) { return JSON.parse(localStorage.getItem(key)); }
export function setLocalStorage(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
export function getParam(param) { return new URLSearchParams(location.search).get(param); }

/**
 * Securely add a quiz result to your history in localStorage.
 * @param {object} result - The object with the data from the completed quiz.
 */
export function addQuizResult(result) {
  const history = getLocalStorage("quizHistory") || [];
  history.unshift(result);
  setLocalStorage("quizHistory", history);
}

export function renderListWithTemplate(
  template,
  parent,
  list,
  position = "afterbegin",
  clear = false
) {
  if (!Array.isArray(list)) { return; }
  if (clear) { parent.innerHTML = ""; }
  parent.insertAdjacentHTML(position, list.map(template).join(""));
}

export function renderWithTemplate(template, element) { element.innerHTML = template; }

async function loadTemplate(path) {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} - No se pudo cargar la plantilla: ${path}`);
  }
  return res.text();
}

export async function loadHeaderFooter() {
  const headerTemplate = await loadTemplate(resolveAbs("public/partials/header.html"));
  const footerTemplate = await loadTemplate(resolveAbs("public/partials/footer.html"));

  const headerEl = document.querySelector("#main-header");
  const footerEl = document.querySelector("#main-footer");

  renderWithTemplate(headerTemplate, headerEl);
  renderWithTemplate(footerTemplate, footerEl);

  const logo = headerEl.querySelector("[data-logo]");
  if (logo) {
    logo.src = resolveAbs("public/images/logo-modified.png");
  }

  const rewriteRoutes = (root) => {
    root.querySelectorAll("a[data-route]").forEach((a) => {
      const route = a.getAttribute("data-route") || "";
      a.href = resolveAbs(route);
    });
  };
  rewriteRoutes(headerEl);
  const mobileNav = document.querySelector("#mobile-nav");
  if (mobileNav) {
    rewriteRoutes(mobileNav);
  }

  const currentPage = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  headerEl.querySelectorAll("nav a[href]").forEach((a) => {
    const linkPage = (a.href.split("/").pop() || "index.html").toLowerCase();
    if (linkPage === currentPage) {
      a.setAttribute("aria-current", "page");
    }
  });
}

/**
 * Safely executes an initialization function, waiting for the DOM to be ready.
 * @param {Function} initFn - The function (can be async) to execute.
 * @param {Function} [onError] - Optional callback in case of error.
 */
export function safeInit(initFn, onError) {
  const run = () => {
    Promise.resolve()
      .then(() => initFn())
      .catch((err) => {
        console.error("Error durante la inicialización:", err);
        if (onError) {
          try { onError(err); } catch (e) { console.error("Error en el callback de error:", e); }
        }
      });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
}