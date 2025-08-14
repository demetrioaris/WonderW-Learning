import { $, $$, resolveAbs, safeInit, addQuizResult } from "./utils.mjs";
import { makeCountdown, shuffle, sampleDistinct } from "./gametools.mjs";

const SECS_PER_ROUND = 20;
const TOTAL_ROUNDS = 5;

const FACTS_ENDPOINT = (() => {
  const meta = document.querySelector("meta[name=\"facts-endpoint\"]")?.content?.trim();
  if (meta === "none") {return null;}
  if (meta) {return meta;}
  const host = location.hostname;
  const isCFHosted = host.endsWith(".pages.dev") || host.endsWith(".workers.dev") || (!["localhost", "127.0.0.1"].includes(host) && location.protocol.startsWith("http"));
  if (isCFHosted) {return "/api/animals";}
  return null; 
})();

async function loadAnimalsPool() {
  const url = resolveAbs("public/data/animals.json");
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {throw new Error(`Could not fetch ${url}`);}
  const data = await res.json();
  if (!Array.isArray(data)) {throw new Error("Invalid animals data");}
  return data
    .filter(x => x && x.title && x.img)
    .map(x => ({ title: x.title, api: x.api || x.title, img: resolveAbs(x.img) }));
}

async function fetchFactsViaProxy(commonName) {
  if (!FACTS_ENDPOINT) {return null;}
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
  if (ch.slogan) {lines.push(`<li>Fun fact: ${ch.slogan}.</li>`);}
  if (ch.habitat) {lines.push(`<li>Habitat: ${ch.habitat}.</li>`);}
  if (ch.diet) {lines.push(`<li>Diet: ${ch.diet}.</li>`);}
  if (locs.length) {lines.push(`<li>Where: ${locs.join(", ")}.</li>`);}
  if (!lines.length) {return "No extra facts available for this animal.";}
  return `<h3>About this animal</h3><ul class="fact-list">${lines.join("")}</ul>`;
}

let containerRef, POOL, countdown, questions, currentRound, score;
resetGameState();

function resetGameState() {
  questions = [];
  currentRound = 0;
  score = 0;
}

function startQuiz() {
  resetGameState();
  if (POOL.length < TOTAL_ROUNDS * 2) {
    containerRef.innerHTML = "<p>Not enough animals to start a new game.</p>";
    return;
  }
  const roundAnimals = sampleDistinct(POOL, TOTAL_ROUNDS * 2);
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const specimen = roundAnimals[i * 2];
    const distractor = roundAnimals[i * 2 + 1];
    const options = shuffle([{ title: specimen.title, correct: true }, { title: distractor.title, correct: false }]);
    questions.push({ specimen, options });
  }
  nextRound();
}

function nextRound() {
  if (currentRound < TOTAL_ROUNDS) {
    renderRound();
  } else {
    showSummary();
  }
}

async function handleResult(isCorrect, specimen) {
  if (countdown) { countdown.stop(); countdown = null; }
  $$(".quiz-option-btn", containerRef).forEach(b => { b.disabled = true; });

  const fb = $("#feedback", containerRef);
  if (isCorrect) {
    score++;
    fb.innerHTML = "<p><strong>✅ Correct!</strong></p>";
  } else {
    fb.innerHTML = `<p><strong>❌ Oops!</strong> The correct answer was: <em>${specimen.title}</em>.</p>`;
  }
  
  const factsBox = document.createElement("div");
  factsBox.className = "fact-card";
  factsBox.style.marginTop = "1rem";
  factsBox.innerHTML = FACTS_ENDPOINT ? "<em>Fetching facts…</em>" : "<em>Facts are disabled in this environment.</em>";
  fb.appendChild(factsBox);
  
  const nextButton = document.createElement("button");
  nextButton.id = "play-again-btn";
  nextButton.textContent = currentRound < TOTAL_ROUNDS - 1 ? "Next Round" : "See Results";
  nextButton.addEventListener("click", () => {
    currentRound++;
    nextRound();
  }, { once: true });
  fb.appendChild(nextButton);

  if (FACTS_ENDPOINT) {
    try {
      const animalData = await fetchFactsViaProxy(specimen.api || specimen.title);
      factsBox.innerHTML = formatFacts(animalData);
    } catch (err) {
      factsBox.innerHTML = "<em>Could not fetch facts at this time.</em>";
    }
  }
}

async function onAnswer(btn, correct, specimen) {
  if (correct) {
    btn.classList.add("correct");
  } else {
    btn.classList.add("incorrect");
    $$(".quiz-option-btn", containerRef).forEach(b => {
      if (b.textContent === specimen.title) {b.classList.add("correct");}
    });
  }
  await handleResult(correct, specimen);
}

async function timeUp(specimen) {
  $$(".quiz-option-btn", containerRef).forEach(b => {
    if (b.textContent === specimen.title) {b.classList.add("correct");}
  });
  await handleResult(false, specimen);
}

function showSummary() {
  const resultData = {
    type: "Nature Lab", category: "Animals", score, total: TOTAL_ROUNDS, date: new Date().toISOString(),
  };
  addQuizResult(resultData);

  containerRef.innerHTML = `
    <div class="quiz-body" style="text-align: center;">
      <h2>Quiz Complete!</h2>
      <div class="fact-card">
        <p style="font-size: 1.5rem; margin: 1rem 0;">
          Your final score is: <strong>${score} / ${TOTAL_ROUNDS}</strong>
        </p>
      </div>
      <div style="margin-top: 2rem;">
        <button id="play-again-btn">Play Again</button>
      </div>
    </div>`;
  $("#play-again-btn", containerRef).addEventListener("click", startQuiz, { once: true });
}

function renderRound() {
  const { specimen, options } = questions[currentRound];
  containerRef.innerHTML = `
    <div class="quiz-header">
      <div class="quiz-status">Round ${currentRound + 1} / ${TOTAL_ROUNDS}</div>
      <div class="quiz-timer" aria-live="polite"><span id="nl-timer">${SECS_PER_ROUND}</span>s</div>
    </div>
    <div class="quiz-body">
      <h2>What animal is this?</h2>
      <div class="animal-image"><img src="${specimen.img}" alt="A ${specimen.title}" loading="lazy"></div>
      <div class="quiz-options" id="options"></div>
    </div>
    <div class="quiz-footer" id="feedback"></div>`;
  const optsEl = $("#options", containerRef);
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.type = "button";
    btn.textContent = opt.title;
    btn.addEventListener("click", () => onAnswer(btn, opt.correct, specimen));
    optsEl.appendChild(btn);
  });
  countdown = makeCountdown({
    seconds: SECS_PER_ROUND,
    onTick: s => { $("#nl-timer", containerRef).textContent = String(s); },
    onDone: () => timeUp(specimen),
  }).start();
}

async function initNatureLab() {
  containerRef = $("#game-area");
  if (!containerRef) {return;}
  try {
    POOL = await loadAnimalsPool();
    startQuiz();
  } catch (e) {
    console.error("Failed to load Nature Lab:", e);
    containerRef.innerHTML = "<p class=\"error-message\">We couldn't load the animal list. Please try again later.</p>";
  }
}

safeInit(initNatureLab);