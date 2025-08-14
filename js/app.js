// File: /js/app.js
// --- Global Application Setup ---
import { loadHeaderFooter } from "./utils.mjs";
import { initHeaderNav } from "./features/nav.mjs";

/**
 * Main listener to set up the global layout.
 * @description Initializes the header, footer, and navigation for all pages.
 */
document.addEventListener("DOMContentLoaded", async () => {
  await loadHeaderFooter();
  initHeaderNav();
});