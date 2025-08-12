// js/app.js
import { loadHeaderFooter } from "./utils.mjs";
import { initHeaderNav } from "./features/nav.mjs";
import { initQuiz } from "./quiz.mjs"; 
import { displayQuizHistory } from "./dashboard.js"; // <-- Importa la nueva función

async function main() {
  await loadHeaderFooter();
  initHeaderNav();

  if (document.querySelector(".quiz-wrapper")) {
    initQuiz();
  }

  // Si estamos en el dashboard, muestra el historial.
  if (document.getElementById("history-table-body")) {
    displayQuizHistory();
  }
}

main();