/* Quiz module: OpenTDB multiple choice
   - Lee ?category=<id>&name=<display>
   - Carga 10 preguntas de Open Trivia DB
   - Timer por pregunta, score, feedback y resumen final
*/
import { makeCountdown, shuffle } from "./gametools.mjs";
import { safeInit, addQuizResult } from "./utils.mjs";

// ---------- Helpers ----------
const $ = (sel, parent = document) => parent.querySelector(sel);

// --- Resolución robusta de rutas (local y GitHub Pages) ---
function siteBase() {
  const dataRepo = document.documentElement.getAttribute("data-repo");
  if (dataRepo) {return `/${dataRepo.replace(/^\/|\/$/g, "")}/`;}
  if (location.hostname.endsWith("github.io")) {
    const first = location.pathname.split("/").filter(Boolean)[0];
    return first ? `/${first}/` : "/";
  }
  return "/";
}
const resolve = (path) => new URL(path, `${location.origin}${siteBase()}`).toString();

const decode = (str) => { const txt = document.createElement("textarea"); txt.innerHTML = str; return txt.value; };

// ---------- DOM refs ----------
const categoryNameEl = $("#category-name");
const questionTextEl = $("#question-text");
const optionsEl = $("#options");
const nextButtonEl = $("#next-question-btn");
const timerEl = $("#timer");
const scoreValueEl = $("#score-value");
const qIndexEl = $("#question-index");
const qTotalEl = $("#question-total");
const feedbackEl = $("#feedback");

// ---------- State ----------
let questions = [];
let current = 0;
let score = 0;
let countdown = null; // timer compartido
const SECS_PER_Q = 30;

// ---------- API ----------
async function fetchQuizData(categoryId) {
  const url = `https://opentdb.com/api.php?amount=10&category=${encodeURIComponent(categoryId)}&type=multiple&encode=url3986`;
  const res = await fetch(url);
  if (!res.ok) {throw new Error(`HTTP ${res.status}`);}
  const data = await res.json();
  if (!data || !Array.isArray(data.results)) {return [];}
  return data.results.map((q) => {
    const question = decode(decodeURIComponent(q.question));
    const correct = decode(decodeURIComponent(q.correct_answer));
    const incorrects = q.incorrect_answers.map((a) => decode(decodeURIComponent(a)));
    const all = shuffle([correct, ...incorrects]);
    return { question, correct, answers: all };
  });
}

// ---------- UI ----------
function resetState() {
  if (countdown) { countdown.stop(); countdown = null; }
  optionsEl.innerHTML = "";
  feedbackEl.innerHTML = "";
  nextButtonEl.style.display = "none";
  nextButtonEl.onclick = null;
}

function renderQuestion() {
  resetState();
  const q = questions[current];
  if (!q) {return;}

  qIndexEl.textContent = String(current + 1);
  qTotalEl.textContent = String(questions.length);
  questionTextEl.textContent = q.question;

  q.answers.forEach((text) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.type = "button";
    btn.textContent = text;
    btn.addEventListener("click", () => selectAnswer(btn, q.correct));
    optionsEl.appendChild(btn);
  });

  // Inicia cuenta regresiva compartida
  countdown = makeCountdown({
    seconds: SECS_PER_Q,
    onTick: (s) => { if (timerEl) {timerEl.textContent = String(s);} },
    onDone: () => autoRevealAndNext()
  }).start();
}

function selectAnswer(btn, correctText) {
  optionsEl.querySelectorAll(".quiz-option-btn").forEach((b) => (b.disabled = true));

  const isCorrect = btn.textContent === correctText;
  if (isCorrect) {
    btn.classList.add("correct");
    score++;
    if (scoreValueEl) {scoreValueEl.textContent = String(score);}
    feedbackEl.innerHTML = "<p>✅ Correct!</p>";
  } else {
    btn.classList.add("incorrect");
    optionsEl.querySelectorAll(".quiz-option-btn").forEach((b) => {
      if (b.textContent === correctText) {b.classList.add("correct");}
    });
    feedbackEl.innerHTML = `<p>❌ Not quite. The correct answer is: <strong>${correctText}</strong></p>`;
  }

  if (countdown) { countdown.stop(); countdown = null; }

  nextButtonEl.textContent = current < questions.length - 1 ? "Next" : "See Results";
  nextButtonEl.style.display = "inline-block";
  nextButtonEl.onclick = nextQuestion;
}

function autoRevealAndNext() {
  const q = questions[current];
  const buttons = optionsEl.querySelectorAll(".quiz-option-btn");
  buttons.forEach((b) => {
    b.disabled = true;
    if (b.textContent === q.correct) {b.classList.add("correct");}
  });
  feedbackEl.innerHTML = `<p>⏰ Time's up! Correct answer: <strong>${q.correct}</strong></p>`;
  nextButtonEl.textContent = current < questions.length - 1 ? "Next" : "See Results";
  nextButtonEl.style.display = "inline-block";
  nextButtonEl.onclick = nextQuestion;
}

function nextQuestion() {
  current += 1;
  if (current < questions.length) {renderQuestion();}
  else {showSummary();}
}

function gotoCategories() { location.assign(resolve("pages/categories.html")); }

function showSummary() {
  resetState();
  const total = questions.length;
  const percent = Math.round((score / total) * 100);
  
  // Guardar resultado en Local Storage (esta parte se mantiene)
  const categoryName = new URLSearchParams(location.search).get("name") || "Quiz";
  const resultData = {
    type: "Category Quiz",
    category: decodeURIComponent(categoryName),
    score: score,
    total: total,
    date: new Date().toISOString()
  };
  addQuizResult(resultData);
  
  questionTextEl.textContent = "Great job! Here are your results:";
  const summary = document.createElement("div");

  // MODIFICADO: Se ha eliminado el botón "View Dashboard"
  summary.innerHTML = `
    <div class="fact-card">
      <p><strong>Final Score:</strong> ${score}/${total} (${percent}%)</p>
    </div>
    <div style="margin-top: 1.5rem; text-align: center;">
      <a href="${resolve("pages/categories.html")}" class="btn">Try Another Category</a>
    </div>
  `;
  feedbackEl.appendChild(summary);
}

// ---------- Init ----------
async function initQuiz() {
  const params = new URLSearchParams(location.search);
  const categoryId = params.get("category");
  const categoryName = params.get("name");
  categoryNameEl.textContent = categoryName ? decodeURIComponent(categoryName) : "Quiz";

  if (!categoryId) {
    questionTextEl.textContent = "Pick a category first.";
    const header = document.querySelector(".quiz-header");
    if (header) {header.style.display = "none";}
    nextButtonEl.textContent = "Go to Categories";
    nextButtonEl.style.display = "inline-block";
    nextButtonEl.onclick = gotoCategories;
    return;
  }

  try { questions = await fetchQuizData(categoryId); }
  catch (e) { console.error("fetchQuizData failed:", e); questions = []; }

  if (!questions.length) {
    questionTextEl.textContent = "Failed to load questions. Please try another category.";
    const header = document.querySelector(".quiz-header");
    if (header) {header.style.display = "none";}
    nextButtonEl.textContent = "Go to Categories";
    nextButtonEl.style.display = "inline-block";
    nextButtonEl.onclick = gotoCategories;
    return;
  }

  current = 0;
  score = 0;
  if (scoreValueEl) {scoreValueEl.textContent = "0";}
  qTotalEl.textContent = String(questions.length);
  renderQuestion();
}

// ---- Auto-init (una sola vez) ----
safeInit(initQuiz, () => {
  const el = document.getElementById("question-text");
  if (el) {el.textContent = "We couldn't load the quiz right now. Please try again.";}
  document.querySelector(".quiz-header")?.style && (document.querySelector(".quiz-header").style.display = "none");
});