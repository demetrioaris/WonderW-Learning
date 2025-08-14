// File: /js/api.mjs
// --- External API Fetching Logic ---

/**
 * fetchQuizData
 * @description Fetches 10 quiz questions from the Open Trivia API for a specific category.
 */
export async function fetchQuizData(categoryId = 9) {
  const apiUrl = `https://opentdb.com/api.php?amount=10&type=multiple&difficulty=easy&category=${categoryId}`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Could not fetch quiz data:", error);
    return [];
  }
}

/**
 * getWikipediaSummary
 * @description Fetches a normalized summary of a Wikipedia article, including title, extract, and image.
 */
export async function getWikipediaSummary(topic) {
  const title = encodeURIComponent(topic);
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) { throw new Error("Wikipedia request failed"); }
  const data = await res.json();
  return {
    title: data.title,
    extract: data.extract || "",
    image: data.thumbnail?.source || data.originalimage?.source || "",
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`
  };
}

/**
 * fetchNinjaAnimalByName
 * @description Fetches data for a specific animal from the API Ninjas service. Requires an API key.
 */
export async function fetchNinjaAnimalByName(name, apiKey) {
  if (!apiKey) { throw new Error("Missing API Ninjas key"); }
  const url = `https://api.api-ninjas.com/v1/animals?name=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: { "X-Api-Key": apiKey } });
  if (!res.ok) { throw new Error(`API Ninjas HTTP ${res.status}`); }
  const data = await res.json();
  return Array.isArray(data) && data.length ? data[0] : null;
}