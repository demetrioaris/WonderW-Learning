// File: /js/nature-cards.mjs
// --- Nature Cards Page Logic ---
import { fetchIdigbioMedia } from "./api.mjs";

const $ = (sel, ctx = document) => ctx.querySelector(sel);

/**
 * cardTemplate
 * @description Generates the HTML string for a single nature card.
 */
function cardTemplate(item) {
  const subtitle = [item.country, item.locality].filter(Boolean).join(" • ");
  return `
    <a class="activity-card" href="${item.img}" target="_blank" rel="noopener noreferrer">
      <img src="${item.img}" alt="${item.title}">
      <h3>${item.title}</h3>
      <p>${subtitle || "Click to view full image"}</p>
      <span class="btn">Open</span>
    </a>
  `;
}

/**
 * initNatureCards
 * @description Main function to initialize the nature cards page by fetching and rendering data from the iDigBio API.
 */
export async function initNatureCards() {
  const wrap = $("#cards-container");
  if (!wrap) { return; }

  const items = await fetchIdigbioMedia({ taxon: "Aves", limit: 12 });
  if (!items.length) {
    wrap.innerHTML = "<p>We couldn't load cards right now. Please try again later.</p>";
    return;
  }

  wrap.innerHTML = items.map(cardTemplate).join("");
}