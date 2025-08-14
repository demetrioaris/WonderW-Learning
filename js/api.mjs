/**
 * Fetches 10 quiz questions from the Open Trivia API for a specific category.
 * @param {string | number} categoryId - The ID of the category to fetch. Defaults to 9 (General Knowledge).
 * @returns {Promise<Array>} A promise that resolves with an array of question objects.
 */
export async function fetchQuizData(categoryId = 9) { // Default to General Knowledge if no ID is provided
  const apiUrl = `https://opentdb.com/api.php?amount=10&type=multiple&difficulty=easy&category=${categoryId}`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`);}
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Could not fetch quiz data:", error);
    return [];
  }
}

/**
 * Looks up an article in the Wikipedia API and returns it in #wiki-content.
 * @param {string} topic - The topic to search for.
 */
export function fetchAndDisplayWikipediaArticle(topic) {
  const contentContainer = document.getElementById("wiki-content");
  if (!contentContainer) {return;}

  const url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&prop=extracts&exintro&titles=${topic}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      const article = pages[pageId];

      if (article.extract) {
        contentContainer.innerHTML = `
          <h3>About: ${article.title}</h3>
          ${article.extract}
          <a href="https://en.wikipedia.org/wiki/${article.title}" target="_blank" rel="noopener noreferrer">Read more on Wikipedia</a>
        `;
      } else {
        contentContainer.innerHTML = `<p>Could not find an article for "${topic}".</p>`;
      }
    })
    .catch(error => {
      console.error("Wikipedia error:", error);
      contentContainer.innerHTML = "<p>Oops! There was a problem loading the content.</p>";
    });
}

/**
 * Wikipedia REST Summary (normalized data for own UI).
 * @param {string} topic
 * @returns {Promise<{title:string, extract:string, image?:string, url:string}>}
 */
export async function getWikipediaSummary(topic) {
  const title = encodeURIComponent(topic);
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) {throw new Error("Wikipedia request failed");}
  const data = await res.json();
  return {
    title: data.title,
    extract: data.extract || "",
    image: data.thumbnail?.source || data.originalimage?.source || "",
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`
  };
}

// Animals API (Ninjas API): https://api.api-ninjas.com/v1/animals
// Requires X-Api-Key header and ?name= parameter (returns up to 10 matches)
export async function fetchNinjaAnimalByName(name, apiKey) {
  if (!apiKey) {throw new Error("Missing API Ninjas key");}
  const url = `https://api.api-ninjas.com/v1/animals?name=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: { "X-Api-Key": apiKey } });
  if (!res.ok) {throw new Error(`API Ninjas HTTP ${res.status}`);}
  const data = await res.json();
  return Array.isArray(data) && data.length ? data[0] : null;
}