/* Quiz module: OpenTDB multiple choice
   - Lee ?category=<id>&name=<display>
   - Carga 10 preguntas de Open Trivia DB
   - Timer por pregunta, score, feedback y resumen final
*/

// ---------- Helpers ----------
const $ = (sel, parent = document) => parent.querySelector(sel);

// --- Resolución robusta de rutas (local y GitHub Pages) ---
function siteBase() {
  // Si defines <html data-repo="WonderW-Learning"> lo respetamos
  const dataRepo = document.documentElement.getAttribute("data-repo");
  if (dataRepo) {return `/${dataRepo.replace(/^\/|\/$/g, "")}/`;}

  // En GitHub Pages: usuario.github.io/<repo>/
  if (location.hostname.endsWith("github.io")) {
    const first = location.pathname.split("/").filter(Boolean)[0];
    return first ? `/${first}/` : "/";
  }
  // En local (ej. 127.0.0.1:5500)
  return "/";
}
const resolve = (path) => new URL(path, `${location.origin}${siteBase()}`).toString();

const decode = (str) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
};

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

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
let timer = null;
const SECS_PER_Q = 30;

// ---------- API ----------
async function fetchQuizData(categoryId) {
  // 10 preguntas, tipo multiple choice
  const url = `https://opentdb.com/api.php?amount=10&category=${encodeURIComponent(
    categoryId
  )}&type=multiple&encode=url3986`;
  const res = await fetch(url);
  if (!res.ok) {throw new Error(`HTTP ${res.status}`);}
  const data = await res.json();
  if (!data || !Array.isArray(data.results)) {return [];}
  return data.results.map((q) => {
    const question = decode(decodeURIComponent(q.question));
    const correct = decode(decodeURIComponent(q.correct_answer));
    const incorrects = q.incorrect_answers.map((a) =>
      decode(decodeURIComponent(a))
    );
    const all = shuffle([correct, ...incorrects]);
    return { question, correct, answers: all };
  });
}

// ---------- UI ----------
function resetState() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  optionsEl.innerHTML = "";
  feedbackEl.innerHTML = "";
  nextButtonEl.style.display = "none";
  // evitar handlers duplicados si se reutiliza el botón
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

  startTimer(SECS_PER_Q);
}

function selectAnswer(btn, correctText) {
  const buttons = optionsEl.querySelectorAll(".quiz-option-btn");
  buttons.forEach((b) => (b.disabled = true));

  const isCorrect = btn.textContent === correctText;
  if (isCorrect) {
    btn.classList.add("correct");
    score++;
    if (scoreValueEl) {scoreValueEl.textContent = String(score);}
    feedbackEl.innerHTML = "<p>✅ Correct!</p>";
  } else {
    btn.classList.add("incorrect");
    buttons.forEach((b) => {
      if (b.textContent === correctText) {b.classList.add("correct");}
    });
    feedbackEl.innerHTML = `<p>❌ Not quite. The correct answer is: <strong>${correctText}</strong></p>`;
  }

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  nextButtonEl.textContent = current < questions.length - 1 ? "Next" : "See Results";
  nextButtonEl.style.display = "inline-block";
  nextButtonEl.onclick = nextQuestion;
}

function startTimer(seconds) {
  let remain = seconds;
  timerEl.textContent = String(remain);
  if (timer) {clearInterval(timer);}
  timer = setInterval(() => {
    remain -= 1;
    timerEl.textContent = String(remain);
    if (remain <= 0) {
      clearInterval(timer);
      timer = null;
      autoRevealAndNext();
    }
  }, 1000);
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
  if (current < questions.length) {
    renderQuestion();
  } else {
    showSummary();
  }
}

function gotoCategories() {
  // redirección segura (no concatena a la URL actual)
  location.assign(resolve("pages/categories.html"));
}

function showSummary() {
  resetState();
  const total = questions.length;
  const percent = Math.round((score / total) * 100);
  questionTextEl.textContent = "Great job! Here are your results:";

  const summary = document.createElement("div");
  summary.innerHTML = `
    <p><strong>Correct:</strong> ${score}/${total} (${percent}%)</p>
    <p>Want to try another category?</p>
  `;
  const link = document.createElement("a");
  link.className = "btn";
  link.href = resolve("pages/categories.html");
  link.textContent = "Go to Categories";

  summary.appendChild(link);
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

  try {
    questions = await fetchQuizData(categoryId);
  } catch (e) {
    console.error("fetchQuizData failed:", e);
    questions = [];
  }

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
function safeInit() {
  initQuiz().catch((err) => {
    console.error("Quiz init error:", err);
    if (questionTextEl) {questionTextEl.textContent = "We couldn't load the quiz right now. Please try again.";}
    const header = document.querySelector(".quiz-header");
    if (header) {header.style.display = "none";}
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", safeInit, { once: true });
} else {
  safeInit();
}
