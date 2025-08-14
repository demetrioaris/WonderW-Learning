// Archivo: src/js/dashboard.mjs (versión sin gráfico)

import { getLocalStorage, safeInit } from "./utils.mjs";

/**
 * Procesa el historial para calcular estadísticas agregadas.
 */
function calculateStats(history) {
  const totalQuizzes = history.length;
  
  const totalPercentageSum = history.reduce((sum, item) => sum + (item.score / item.total) * 100, 0);
  const averageScore = totalQuizzes > 0 ? Math.round(totalPercentageSum / totalQuizzes) : 0;

  const categoryData = history.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { totalScore: 0, count: 0 };
    }
    acc[item.category].totalScore += (item.score / item.total);
    acc[item.category].count++;
    return acc;
  }, {});

  let bestCategory = { name: "—", score: -1 };
  for (const category in categoryData) {
    const avg = (categoryData[category].totalScore / categoryData[category].count);
    if (avg > bestCategory.score) {
      bestCategory = { name: category, score: avg };
    }
  }

  return { totalQuizzes, averageScore, bestCategoryName: bestCategory.name, categoryData };
}

/**
 * Muestra las métricas principales en las tarjetas del dashboard.
 */
function displayMetrics(stats) {
  document.getElementById("total-quizzes").textContent = stats.totalQuizzes;
  document.getElementById("average-score").textContent = `${stats.averageScore}%`;
  document.getElementById("best-category").textContent = stats.bestCategoryName;
}

/**
 * Rellena la tabla con el historial de quizzes.
 */
function displayHistoryTable(history) {
  const tableBody = document.getElementById("history-table-body");
  tableBody.innerHTML = history.map(item => {
    const scorePercentage = Math.round((item.score / item.total) * 100);
    const friendlyDate = new Date(item.date).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    });
    return `
      <tr>
        <td>${item.category}</td>
        <td>${item.score}/${item.total} (${scorePercentage}%)</td>
        <td>${friendlyDate}</td>
      </tr>
    `;
  }).join("");
}

/**
 * NUEVO: Crea y muestra el desglose de resultados por tipo de actividad.
 * @param {Array} history - El array de resultados del quiz.
 */
function displayActivityBreakdown(history) {
  const container = document.getElementById("breakdown-container");
  if (!container) {return;}

  // 1. Agrupar resultados por tipo de actividad (ej. "Nature Lab", "Category Quiz")
  const activities = history.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {});

  let html = "";
  // 2. Crear una tarjeta para cada tipo de actividad
  for (const type in activities) {
    const activityHistory = activities[type];
        
    // Calcular estadísticas por categoría dentro de esta actividad
    const categoryStats = activityHistory.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { score: 0, total: 0 };
      }
      acc[item.category].score += item.score;
      acc[item.category].total += item.total;
      return acc;
    }, {});

    // 3. Generar el HTML para la lista de categorías
    const categoryListHtml = Object.entries(categoryStats).map(([name, data]) => {
      const percentage = Math.round((data.score / data.total) * 100);
      return `
                <li>
                    <span class="category-name">${name}</span>
                    <span class="category-score">${data.score}/${data.total} (${percentage}%)</span>
                </li>
            `;
    }).join("");
        
    // 4. Construir la tarjeta completa
    html += `
            <div class="breakdown-card">
                <h3>${type}</h3>
                <ul>
                    ${categoryListHtml}
                </ul>
            </div>
        `;
  }

  container.innerHTML = html;
}

/**
 * Función principal que inicializa todo el dashboard.
 */
function initDashboard() {
  const history = getLocalStorage("quizHistory") || [];
  const noHistoryMsg = document.getElementById("no-history-msg");
  
  if (history.length === 0) {
    if (noHistoryMsg) {noHistoryMsg.style.display = "block";}
    document.querySelectorAll(".dashboard-grid, .table-wrapper, .activity-breakdown").forEach(el => el.style.display = "none");
    return;
  }

  const stats = calculateStats(history);
  
  displayMetrics(stats);
  displayHistoryTable(history);
  displayActivityBreakdown(history); // Llamamos a la nueva función
}

// Inicializa el dashboard de forma segura.
safeInit(initDashboard);