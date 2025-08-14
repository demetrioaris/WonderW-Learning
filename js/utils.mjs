// File: /js/utils.mjs
// --- Core Utility Toolkit ---

/**
 * siteBase
 * @description Calculates the base path of the site for local, GitHub Pages, and production environments.
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

/**
 * resolveAbs
 * @description Resolves a relative path to an absolute URL based on the site's base path.
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

/**
 * $ (Query Selector)
 * @description A shorthand for document.querySelector.
 */
export const $ = (selector, ctx = document) => ctx.querySelector(selector);

/**
 * $$ (Query Selector All)
 * @description A shorthand for document.querySelectorAll that returns an array.
 */
export const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

/**
 * getLocalStorage
 * @description Safely retrieves and parses a JSON value from localStorage.
 */
export function getLocalStorage(key) {
  return JSON.parse(localStorage.getItem(key));
}

/**
 * setLocalStorage
 * @description Safely stringifies and saves a value to localStorage.
 */
export function setLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * getParam
 * @description Gets a specific parameter's value from the current URL's query string.
 */
export function getParam(param) {
  return new URLSearchParams(location.search).get(param);
}

/**
 * addQuizResult
 * @description Appends a quiz result object to the history array in localStorage.
 */
export function addQuizResult(result) {
  const history = getLocalStorage("quizHistory") || [];
  history.unshift(result);
  setLocalStorage("quizHistory", history);
}

/**
 * loadHeaderFooter
 * @description Fetches and injects the site's header and footer from partial HTML files.
 */
export async function loadHeaderFooter() {
  const headerTemplate = await fetch(resolveAbs("public/partials/header.html")).then(res => res.text());
  const footerTemplate = await fetch(resolveAbs("public/partials/footer.html")).then(res => res.text());
  document.querySelector("#main-header").innerHTML = headerTemplate;
  document.querySelector("#main-footer").innerHTML = footerTemplate;
}

/**
 * safeInit
 * @description Executes an initialization function safely after the DOM is fully loaded.
 */
export function safeInit(initFn, onError) {
  const run = () => {
    Promise.resolve()
      .then(() => initFn())
      .catch((err) => {
        console.error("Initialization Error:", err);
        if (onError) { try { onError(err); } catch (e) { console.error("Error in error callback:", e); } }
      });
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
}