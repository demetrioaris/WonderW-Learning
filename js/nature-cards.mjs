// js/nature-cards.mjs
import { fetchIdigbioMedia } from "./api.mjs";

const $ = (sel, ctx = document) => ctx.querySelector(sel);

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

export async function initNatureCards() {
  const wrap = $("#cards-container");
  if (!wrap) {return;}

  // Puedes variar el taxón para diversidad (Aves, Reptilia, Amphibia, Insecta, Plantae...)
  const items = await fetchIdigbioMedia({ taxon: "Aves", limit: 12 });
  if (!items.length) {
    wrap.innerHTML = "<p>We couldn't load cards right now. Please try again later.</p>";
    return;
  }

  wrap.innerHTML = items.map(cardTemplate).join("");
}
