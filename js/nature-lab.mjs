// js/nature-lab.mjs
// Guess the Animal — 2 opciones, imágenes locales desde JSON y facts vía proxy secreto (/api/animals)

import { $, resolveAbs, safeInit } from "./utils.mjs";
import { makeCountdown, shuffle, sampleDistinct } from "./gametools.mjs";

// ---------- Config ----------
const SECS_PER_ROUND = 20;

/*
 FACTS_ENDPOINT dinámico y seguro:
 - Si agregas <meta name="facts-endpoint" content="https://tu-dominio/api/animals">, lo usa.
 - Si NO hay meta:
     • En producción (pages.dev / dominio propio con Functions): usa "/api/animals".
     • En dev simple (:5500): DESACTIVA facts para evitar errores de red.
   (Si quieres facts en dev, agrega el <meta> apuntando a tu endpoint local o prod.)
*/
const FACTS_ENDPOINT = (() => {
  const meta = document.querySelector("meta[name=\"facts-endpoint\"]")?.content?.trim();
  if (meta === "none") {return null;} // permitir desactivar explícitamente
  if (meta) {return meta;}

  const host = location.hostname;
  const isCFHosted =
    host.endsWith(".pages.dev") ||
    host.endsWith(".workers.dev") ||
    // Si ya mapeaste dominio propio, este check no sirve, pero igual el endpoint relativo funciona
    (!["localhost", "127.0.0.1"].includes(host) && location.protocol.startsWith("http"));

  if (isCFHosted) {return "/api/animals";}

  // Dev simple (Live Server, :5500) sin meta => no intentamos facts
  return null;
})();

// ---------- Carga del dataset (JSON) ----------
async function loadAnimalsPool() {
  // We will try the two most common paths for local development.
  const candidates = [
    "/public/data/animals.json",      // Works if server root is /src
    "/src/public/data/animals.json"   // Works if server root is the project folder
  ];
  let data = null;

  // This loop now fetches the absolute paths directly.
  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        data = await res.json();
        console.log(`Successfully loaded animals.json from: ${url}`);
        break; // Stop looking once the file is found
      }
    } catch (e) {
      // Ignore fetch errors (like network issues) and try the next candidate
      console.warn(`Could not fetch from ${url}, trying next...`);
    }
  }

  if (!Array.isArray(data)) {
    throw new Error("Animals JSON not found in expected paths");
  }

  // The rest of the function remains the same
  // Normaliza y vuelve absolutas las rutas de imagen
  return data
    .filter(x => x && x.title && x.img)
    .map(x => ({
      title: x.title,
      api: x.api || x.title,
      img: resolveAbs(x.img)
    }));
}

// ---------- Facts (API Ninjas vía proxy secreto) ----------
async function fetchFactsViaProxy(commonName) {
  if (!FACTS_ENDPOINT) {return null;} // facts desactivados (p.ej. dev :5500 sin meta)
  const res = await fetch(`${FACTS_ENDPOINT}?name=${encodeURIComponent(commonName)}`);
  if (!res.ok) {throw new Error(`Proxy HTTP ${res.status}`);}
  const data = await res.json();
  return Array.isArray(data) && data.length ? data[0] : null;
}

function formatFacts(animal) {
  if (!animal) {return "";}
  const tx = animal.taxonomy || {};
  const ch = animal.characteristics || {};
  const locs = Array.isArray(animal.locations) ? animal.locations : [];

  const lines = [];
  if (ch.slogan)          {lines.push(`Fun fact: ${ch.slogan}.`);}
  if (ch.habitat)         {lines.push(`Habitat: ${ch.habitat}.`);}
  if (ch.diet)            {lines.push(`Diet: ${ch.diet}.`);}
  if (locs.length)        {lines.push(`Where: ${locs.join(", ")}.`);}
  if (ch.top_speed)       {lines.push(`Top speed: ${ch.top_speed}.`);}
  if (ch.lifespan)        {lines.push(`Lifespan: ${ch.lifespan}.`);}
  if (tx.scientific_name) {lines.push(`Scientific name: ${tx.scientific_name}.`);}

  if (!lines.length) {return "";}
  return `
    <div class="fact-card">
      <h3>About this animal</h3>
      <ul class="fact-list">
        ${lines.map(li => `<li>${li}</li>`).join("")}
      </ul>
    </div>
  `;
}

// ---------- Estado ----------
let containerRef = null;
let POOL = [];
let countdown = null;

// ---------- Render ----------
function renderRound({ specimen, options }) {
  containerRef.innerHTML = `
    <div class="quiz-header">
      <div class="quiz-status">Round</div>
      <div class="quiz-timer" aria-live="polite"><span id="nl-timer">${SECS_PER_ROUND}</span>s</div>
    </div>

    <div class="quiz-body">
      <h2>What animal is this?</h2>
      <div class="animal-image">
        <img src="${specimen.img}" alt="Specimen: ${specimen.title}" loading="lazy">
      </div>
      <div class="quiz-options" id="options"></div>
    </div>

    <div class="quiz-footer" id="feedback"></div>
  `;

  const optsEl = $("#options", containerRef);
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.type = "button";
    btn.textContent = opt.title;
    btn.addEventListener("click", () => onAnswer(btn, opt.correct, specimen));
    optsEl.appendChild(btn);
  });

  const timerSpan = $("#nl-timer", containerRef);
  countdown = makeCountdown({
    seconds: SECS_PER_ROUND,
    onTick: (s) => { if (timerSpan) {timerSpan.textContent = String(s);} },
    onDone: () => timeUp(specimen)
  }).start();
}

async function onAnswer(btn, correct, specimen) {
  containerRef.querySelectorAll(".quiz-option-btn").forEach(b => (b.disabled = true));
  if (countdown) { countdown.stop(); countdown = null; }

  const fb = $("#feedback", containerRef);

  if (correct) {
    btn.classList.add("correct");
    fb.innerHTML = `<p><strong>✅ Correct!</strong> ${specimen.title}</p>`;
  } else {
    btn.classList.add("incorrect");
    // marca la correcta
    containerRef.querySelectorAll(".quiz-option-btn").forEach(b => {
      if (b.textContent === specimen.title) {b.classList.add("correct");}
    });
    fb.innerHTML = `<p><strong>❌ Oops!</strong> The correct answer was: <em>${specimen.title}</em>.</p>`;
  }

  await appendFactsAndAgain(fb, specimen, correct);
}

function timeUp(specimen) {
  containerRef.querySelectorAll(".quiz-option-btn").forEach(b => (b.disabled = true));
  const fb = $("#feedback", containerRef);
  // marca correcta
  containerRef.querySelectorAll(".quiz-option-btn").forEach(b => {
    if (b.textContent === specimen.title) {b.classList.add("correct");}
  });
  fb.innerHTML = `<p>⏰ Time's up! Correct answer: <strong>${specimen.title}</strong></p>`;
  appendFactsAndAgain(fb, specimen, false);
}

async function appendFactsAndAgain(fb, specimen, correct) {
  const factsBox = document.createElement("div");
  factsBox.className = "fact-card";
  factsBox.textContent = FACTS_ENDPOINT
    ? "Fetching facts…"
    : "Facts are disabled in local dev. Add <meta name='facts-endpoint' ...> or run Cloudflare dev.";
  fb.appendChild(factsBox);

  const again = document.createElement("button");
  again.id = "play-again-btn";
  again.className = "btn";
  again.style.marginTop = ".5rem";
  again.textContent = correct ? "Play again" : "Try another";
  again.addEventListener("click", newRound, { once: true });
  fb.appendChild(again);

  if (!FACTS_ENDPOINT) {return;} // no intentamos fetch si no hay endpoint

  try {
    const apiName = specimen.api || specimen.title;
    const animal = await fetchFactsViaProxy(apiName);
    const html = formatFacts(animal);
    factsBox.innerHTML = html || "No extra facts available for this animal.";
  } catch (err) {
    console.warn("Animals proxy error:", err);
    factsBox.textContent = "We couldn't fetch facts right now.";
  }
}

// ---------- Lógica de ronda ----------
function newRound() {
  if (!POOL || POOL.length < 2) {
    containerRef.innerHTML = "<p>We couldn't load enough animals. Please add more images.</p>";
    return;
  }

  // Solo 2 opciones: 1 correcta + 1 distractor
  const two = sampleDistinct(POOL, 2);
  const specimen = two[0];
  const distractor = two[1];
  const options = shuffle([
    { title: specimen.title,   correct: true  },
    { title: distractor.title, correct: false }
  ]);

  renderRound({ specimen, options });
}

// ---------- Init ----------
export async function initNatureLab() {
  containerRef = document.getElementById("game-area");
  if (!containerRef) {return;}

  try {
    POOL = await loadAnimalsPool();
  } catch (e) {
    console.error("Failed to load animals.json:", e);
    containerRef.innerHTML = "<p>We couldn't load the animal list. Please try again later.</p>";
    return;
  }

  newRound();
}

// Auto-init (utilidad compartida)
safeInit(initNatureLab, () => {
  const c = document.getElementById("game-area");
  if (c) {c.innerHTML = "<p>We couldn't load the game right now. Please try again later.</p>";}
});
