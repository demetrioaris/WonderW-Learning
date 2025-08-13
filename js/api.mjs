// js/api.mjs

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
 * Busca un artículo en la API de Wikipedia y lo muestra en #wiki-content.
 * @param {string} topic - El tema a buscar.
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
 * Wikipedia REST Summary (datos normalizados para UI propia).
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

/**
 * iDigBio v2 Search Media (POST). Devuelve una lista simple de objetos con imagen y metadatos.
 * @param {Object} opts
 * @param {string} [opts.taxon="Mammalia"] - Filtro por táxon (ej. "Aves", "Reptilia")
 * @param {number} [opts.limit=8] - Límite de resultados
 * @returns {Promise<Array<{id:string, img:string, title:string, country?:string, locality?:string}>>}
 */
export async function fetchIdigbioMedia({ taxon = "Mammalia", limit = 8 } = {}) {
  const endpoint = "https://search.idigbio.org/v2/search/media";
  const body = {
    rq: { "scientificname": taxon },
    limit,
    // Solo media con URL
    // (idb a veces devuelve sin mediarecords. Filtraremos luego en cliente también)
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {throw new Error(`iDigBio HTTP ${res.status}`);}
    const json = await res.json();

    const items = Array.isArray(json.items) ? json.items : [];
    return items
      .map((it) => {
        const media = it?.media?.[0] || {};
        const rec   = it?.indexTerms || {};
        const img   = media?.accessuri || media?.thumbnailuri || "";
        return {
          id: it.uuid || media?.uuid || "",
          img,
          title: rec.scientificname || rec.family || "Unknown specimen",
          country: rec.country || "",
          locality: rec.locality || ""
        };
      })
      .filter((x) => x.img);
  } catch (err) {
    console.error("iDigBio error:", err);
    return [];
  }
}
