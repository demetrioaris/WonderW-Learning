// js/app.js
import { loadHeaderFooter } from "./utils.mjs";
import { initHeaderNav } from "./features/nav.mjs";
import { initQuiz } from "./quiz.mjs";
import { displayQuizHistory } from "./dashboard.js";

async function main() {
  await loadHeaderFooter();
  initHeaderNav();

  // QUIZ: solo si existe el wrapper
  if (document.querySelector(".quiz-wrapper")) {
    initQuiz();
  }

  // DASHBOARD: solo si existe la tabla
  if (document.getElementById("history-table-body")) {
    displayQuizHistory();
  }

  // CATEGORIES: carga condicional del módulo y ejecútalo
  if (document.getElementById("categories-list")) {
    const { initCategories } = await import("./categories.mjs");
    initCategories();
  }
}

main();
