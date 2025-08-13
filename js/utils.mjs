// js/utils.mjs

// ---------------------------
// Parámetros de URL
// ---------------------------
export const getParam = (k) => new URLSearchParams(location.search).get(k) ?? "";

// ---------------------------
// Render helpers
// ---------------------------
export function renderListWithTemplate(tpl, parent, list, position = "afterbegin", clear = false) {
  if (!Array.isArray(list)) {return;}
  if (clear) {parent.innerHTML = "";}
  parent.insertAdjacentHTML(position, list.map(tpl).join(""));
}

export function renderWithTemplate(html, el, data, cb) {
  el.innerHTML = html;
  if (cb) {cb(data);}
}

async function loadTemplate(path) {
  const res = await fetch(path);
  if (!res.ok) {throw new Error(`HTTP ${res.status} - ${path}`);}
  return res.text();
}

export async function loadHeaderFooter() {
  // Mantengo tu lógica de rutas relativas (funciona bien)
  const inPages = location.pathname.includes("/pages/");
  const BASE = inPages ? "../" : "./";

  const [header, footer] = await Promise.all([
    loadTemplate(`${BASE}public/partials/header.html`),
    loadTemplate(`${BASE}public/partials/footer.html`)
  ]);

  const $header = document.querySelector("#main-header");
  const $footer = document.querySelector("#main-footer");

  renderWithTemplate(header, $header);
  renderWithTemplate(footer, $footer);

  const $logo = $header.querySelector("[data-logo]");
  if ($logo) {$logo.src = `${BASE}public/images/logo-modified.png`;}

  const current = location.pathname.split("/").pop() || "index.html";
  $header.querySelectorAll("nav a[href]").forEach(a => {
    const end = (a.getAttribute("href") || "").split("/").pop();
    a.toggleAttribute("aria-current", end === current);
  });
}

// ---------------------------
// NUEVO: DOM helper
// ---------------------------
/** Selección corta de elementos (con contexto opcional) */
export const $ = (selector, ctx = document) => ctx.querySelector(selector);

// ---------------------------
// NUEVO: Rutas robustas (GitHub Pages / local)
// ---------------------------
/** Devuelve la base del sitio ("/<repo>/" en GitHub Pages o "/" en local). */
export function siteBase() {
  // Si agregas <html data-repo="WonderW-Learning">, lo respetamos.
  const repo = document.documentElement.getAttribute("data-repo");
  if (repo) {return `/${repo.replace(/^\/|\/$/g, "")}/`;}

  // En GitHub Pages: usuario.github.io/<repo>/...
  if (location.hostname.endsWith("github.io")) {
    const first = location.pathname.split("/").filter(Boolean)[0];
    return first ? `/${first}/` : "/";
  }
  // Local dev (ej. 127.0.0.1:5500)
  return "/";
}

/** Resuelve una ruta relativa a una URL absoluta, respetando siteBase(). */
export const resolveAbs = (path) => new URL(path, `${location.origin}${siteBase()}`).toString();

// ---------------------------
// NUEVO: Init reutilizable
// ---------------------------
/**
 * Ejecuta una función de inicialización una única vez cuando el DOM esté listo.
 * - initFn puede ser async; cualquier error se captura y se envía a onError.
 * - onError(err) es opcional; útil para poner un mensaje en la UI.
 */
export function safeInit(initFn, onError) {
  const run = () => {
    Promise.resolve()
      .then(() => initFn())
      .catch((err) => {
        console.error("Init error:", err);
        try { onError && onError(err); } catch {}
      });
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
}
