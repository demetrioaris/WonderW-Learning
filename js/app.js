import { loadHeaderFooter } from "./utils.mjs";
import { initHeaderNav } from "./features/nav.mjs";

document.addEventListener("DOMContentLoaded", async () => {
  await loadHeaderFooter();  
  initHeaderNav();         
});
