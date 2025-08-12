// js/dashboard.js (Versión Completa)

export function displayQuizHistory() {
  const history = JSON.parse(localStorage.getItem("quizHistory")) || [];
  const tableBody = document.getElementById("history-table-body");
  
  if (!tableBody) {return;}

  if (history.length === 0) {
    document.getElementById("no-history-msg").style.display = "block";
    return;
  }
  
  // --- 1. LLAMAR A LAS FUNCIONES NUEVAS ---
  calculateAndDisplayStats(history);
  checkAndDisplayBadges(history);
  createCategoryChart(history);

  // --- 2. CONSTRUIR TABLA DE HISTORIAL ---
  tableBody.innerHTML = "";
  history.reverse().forEach(result => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${result.categoryName}</td>
      <td>${result.score} / ${result.totalQuestions} (${result.percentage}%)</td>
      <td>${result.date}</td>
    `;
    tableBody.appendChild(row);
  });
}

function calculateAndDisplayStats(history) {
  // (Pega aquí la lógica de cálculo de estadísticas que ya tenías)
  const totalQuizzes = history.length;
  const totalPercentage = history.reduce((sum, result) => sum + result.percentage, 0);
  const averageScore = totalQuizzes > 0 ? Math.round(totalPercentage / totalQuizzes) : 0;
  // ...lógica para bestCategory...
  let bestCategory = "N/A"; // Asegúrate de tener toda la lógica aquí
  
  document.getElementById("total-quizzes").textContent = totalQuizzes;
  document.getElementById("average-score").textContent = `${averageScore}%`;
  document.getElementById("best-category").textContent = bestCategory; // Asegúrate de calcular 'bestCategory'
}

function checkAndDisplayBadges(history) {
  // (Pega aquí la función de insignias completa)
  const hasPerfectScore = history.some(result => result.percentage === 100);
  if (hasPerfectScore) {
    document.getElementById("badge-gold-medal").classList.remove("locked");
  }
  const scienceQuizzes = history.filter(result => result.categoryName === "Science & Nature");
  if (scienceQuizzes.length >= 5) {
    document.getElementById("badge-scientist").classList.remove("locked");
  }
  const completedCategories = new Set(history.map(result => result.categoryName));
  if (completedCategories.size >= 3) {
    document.getElementById("badge-mastermind").classList.remove("locked");
  }
}

function createCategoryChart(history) {
  // (Pega aquí la función de gráfico completa)
  const ctx = document.getElementById("category-chart");
  if (!ctx) {return;}
  const categoryStats = {};
  history.forEach(result => {
    if (!categoryStats[result.categoryName]) {
      categoryStats[result.categoryName] = { total: 0, count: 0 };
    }
    categoryStats[result.categoryName].total += result.percentage;
    categoryStats[result.categoryName].count++;
  });
  const labels = Object.keys(categoryStats);
  const data = labels.map(label => {
    const stat = categoryStats[label];
    return Math.round(stat.total / stat.count);
  });
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Average Score (%)",
        data: data,
        backgroundColor: "rgba(52, 152, 219, 0.5)",
        borderColor: "rgba(52, 152, 219, 1)",
        borderWidth: 1
      }]
    },
    options: {
      scales: { y: { beginAtZero: true, max: 100 } },
      responsive: true
    }
  });
}
