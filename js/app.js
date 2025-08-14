// js/app.js
import { loadHeaderFooter } from "./utils.mjs";
import { initHeaderNav } from "./features/nav.mjs";

// Solo responsabilidades globales del layout
document.addEventListener("DOMContentLoaded", async () => {
  await loadHeaderFooter();   // inyecta header/footer desde /public/partials
  initHeaderNav();            // activa nav y dropdowns
});
