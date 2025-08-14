/** * utils.mjs 
 * Caja de herramientas con funciones de ayuda reutilizables para el proyecto.
 */

/**
 * Calcula la ruta base del sitio de forma inteligente.
 * @returns {string} La ruta base a usar (p. ej., "/src/", "/repo/", "/").
 */
export function siteBase() {
  const host = location.hostname;

  // 1. Lógica para desarrollo local que funcionaba para tus imágenes y archivos.
  if (host === "127.0.0.1" || host === "localhost") {
    return "/src/";
  }
  
  // 2. Si no es local, revisa si hay un `data-repo` para forzar la base.
  const attr = document.documentElement.getAttribute("data-repo");
  if (attr) {
    return `/${attr.replace(/^\/|\/$/g, "")}/`;
  }

  // 3. Detección automática para GitHub Pages.
  if (host.endsWith("github.io")) {
    const segs = location.pathname.split("/").filter(Boolean);
    return segs.length ? `/${segs[0]}/` : "/";
  }
  
  // 4. Para cualquier otro caso (dominio propio en producción), la base es "/".
  return "/";
}

/** * Resuelve una ruta relativa para que sea absoluta respecto a la base del sitio.
 * @param {string} path - La ruta a resolver (p. ej., "images/pic.png").
 * @returns {string} La URL absoluta completa.
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

/* --------- Helpers para seleccionar elementos del DOM --------- */
export function qs(selector, ctx = document) { return ctx.querySelector(selector); }
export function qsa(selector, ctx = document) { return [...ctx.querySelectorAll(selector)]; }
export const $ = (selector, ctx = document) => ctx.querySelector(selector);
export const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

/* --------- Helpers para Local Storage y Parámetros de URL --------- */
export function getLocalStorage(key) { return JSON.parse(localStorage.getItem(key)); }
export function setLocalStorage(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
export function getParam(param) { return new URLSearchParams(location.search).get(param); }

/**
 * Añade el resultado de un quiz al historial en localStorage de forma segura.
 * @param {object} result - El objeto con los datos del quiz finalizado.
 */
export function addQuizResult(result) {
  const history = getLocalStorage("quizHistory") || [];
  history.unshift(result);
  setLocalStorage("quizHistory", history);
}

/* --------- Helpers para renderizar plantillas HTML --------- */
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

/**
 * Carga el header y footer desde parciales HTML y ajusta las rutas.
 */
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
 * Ejecuta una función de inicialización de forma segura, esperando a que el DOM esté listo.
 * @param {Function} initFn - La función (puede ser async) a ejecutar.
 * @param {Function} [onError] - Callback opcional en caso de error.
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