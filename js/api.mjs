// js/api.mjs

/**
 * Fetches 10 quiz questions from the Open Trivia API for a specific category.
 * @param {string | number} categoryId - The ID of the category to fetch. Defaults to 9 (General Knowledge).
 * @returns {Promise<Array>} A promise that resolves with an array of question objects.
 */
export async function fetchQuizData(categoryId = 9) { // Default to General Knowledge if no ID is provided
  // Construct the API URL dynamically.
  const apiUrl = `https://opentdb.com/api.php?amount=10&type=multiple&difficulty=easy&category=${categoryId}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Could not fetch quiz data:", error);
    return [];
  }
}

/**
 * Busca un artículo en la API de Wikipedia y lo muestra.
 * @param {string} topic - El tema a buscar.
 */
export function fetchAndDisplayWikipediaArticle(topic) {
  const contentContainer = document.getElementById("wiki-content");
  // Si no estamos en una página con este contenedor, no hace nada.
  if (!contentContainer) {
    return;
  }

  const url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&prop=extracts&exintro&titles=${topic}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      const article = pages[pageId];

      if (article.extract) {
        // Inserta el resumen del artículo en el HTML.
        contentContainer.innerHTML = `
          <h3>Sobre: ${article.title}</h3>
          ${article.extract}
          <a href="https://en.wikipedia.org/wiki/${article.title}" target="_blank" rel="noopener noreferrer">Leer más en Wikipedia</a>
        `;
      } else {
        contentContainer.innerHTML = `<p>No se pudo encontrar un artículo para "${topic}".</p>`;
      }
    })
    .catch(error => {
      console.error("Error al obtener el artículo de Wikipedia:", error);
      contentContainer.innerHTML = "<p>¡Ups! Hubo un problema al cargar el contenido.</p>";
    });
}
