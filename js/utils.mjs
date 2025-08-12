// js/untils.mjs

export const getParam = (k) => new URLSearchParams(location.search).get(k) ?? "";

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
