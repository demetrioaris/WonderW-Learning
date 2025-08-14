// File: /js/quiz.mjs
// --- Category Quiz Logic (OpenTDB) ---
import { makeCountdown, shuffle } from "./gametools.mjs";
import { safeInit, addQuizResult } from "./utils.mjs";

const $ = (sel, parent = document) => parent.querySelector(sel);

/**
 * siteBase
 * @description Local helper to get the base path for URL construction.
 */
function siteBase() {
  const dataRepo = document.documentElement.getAttribute("data-repo");
  if (dataRepo) { return `/${dataRepo.replace(/^\/|\/$/g, "")}/`; }
  if (location.hostname.endsWith("github.io")) {
    const first = location.pathname.split("/").filter(Boolean)[0];
    return first ? `/${first}/` : "/";
  }
  return "/";
}

/**
 * resolve
 * @description Local helper to resolve a relative path to an absolute URL.
 */
const resolve = (path) => new URL(path, `${location.origin}${siteBase()}`).toString();
const decode = (str) => { const txt = document.createElement("textarea"); txt.innerHTML = str; return txt.value; };

let questions = [], current = 0, score = 0, countdown = null;
const SECS_PER_Q = 30;

/**
 * fetchQuizData
 * @description Fetches question data for a specific category from the Open Trivia DB API.
 */
async function fetchQuizData(categoryId) {
  const url = `https://opentdb.com/api.php?amount=10&category=${encodeURIComponent(categoryId)}&type=multiple&encode=url3986`;
  const res = await fetch(url);
  if (!res.ok) { throw new Error(`HTTP ${res.status}`); }
  const data = await res.json();
  if (!data || !Array.isArray(data.results)) { return []; }
  return data.results.map((q) => {
    const question = decode(decodeURIComponent(q.question));
    const correct = decode(decodeURIComponent(q.correct_answer));
    const incorrects = q.incorrect_answers.map((a) => decode(decodeURIComponent(a)));
    const all = shuffle([correct, ...incorrects]);
    return { question, correct, answers: all };
  });
}

/**
 * renderQuestion
 * @description Renders the current question and its answer options to the UI.
 */
function renderQuestion() {
  if (countdown) { countdown.stop(); }
  $("#options").innerHTML = "";
  $("#feedback").innerHTML = "";
  $("#next-question-btn").style.display = "none";
  $("#next-question-btn").onclick = null;

  const q = questions[current];
  if (!q) { return; }
  $("#question-index").textContent = String(current + 1);
  $("#question-total").textContent = String(questions.length);
  $("#question-text").textContent = q.question;
  q.answers.forEach((text) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.type = "button";
    btn.textContent = text;
    btn.addEventListener("click", () => selectAnswer(btn, q.correct));
    $("#options").appendChild(btn);
  });
  countdown = makeCountdown({
    seconds: SECS_PER_Q,
    onTick: (s) => { if ($("#timer")) { $("#timer").textContent = String(s); } },
    onDone: () => autoRevealAndNext()
  }).start();
}

/**
 * selectAnswer
 * @description Handles the logic when a user clicks an answer button.
 */
function selectAnswer(btn, correctText) {
  $("#options").querySelectorAll(".quiz-option-btn").forEach((b) => (b.disabled = true));
  const isCorrect = btn.textContent === correctText;
  if (isCorrect) {
    btn.classList.add("correct");
    score++;
    if ($("#score-value")) { $("#score-value").textContent = String(score); }
    $("#feedback").innerHTML = "<p>✅ Correct!</p>";
  } else {
    btn.classList.add("incorrect");
    $("#options").querySelectorAll(".quiz-option-btn").forEach((b) => {
      if (b.textContent === correctText) { b.classList.add("correct"); }
    });
    $("#feedback").innerHTML = `<p>❌ Not quite. The correct answer is: <strong>${correctText}</strong></p>`;
  }
  if (countdown) { countdown.stop(); }
  $("#next-question-btn").textContent = current < questions.length - 1 ? "Next" : "See Results";
  $("#next-question-btn").style.display = "inline-block";
  $("#next-question-btn").onclick = nextQuestion;
}

/**
 * autoRevealAndNext
 * @description Handles the case where the timer runs out before an answer is selected.
 */
function autoRevealAndNext() {
  const q = questions[current];
  $("#options").querySelectorAll(".quiz-option-btn").forEach((b) => {
    b.disabled = true;
    if (b.textContent === q.correct) { b.classList.add("correct"); }
  });
  $("#feedback").innerHTML = `<p>⏰ Time's up! Correct answer: <strong>${q.correct}</strong></p>`;
  $("#next-question-btn").textContent = current < questions.length - 1 ? "Next" : "See Results";
  $("#next-question-btn").style.display = "inline-block";
  $("#next-question-btn").onclick = nextQuestion;
}

/**
 * nextQuestion
 * @description Moves the quiz to the next question or shows the summary if finished.
 */
function nextQuestion() {
  current++;
  if (current < questions.length) { renderQuestion(); }
  else { showSummary(); }
}

/**
 * showSummary
 * @description Displays the final quiz results and saves the data to localStorage.
 */
function showSummary() {
  if (countdown) { countdown.stop(); }
  $("#options").innerHTML = "";
  $("#feedback").innerHTML = "";
  $("#next-question-btn").style.display = "none";
  const total = questions.length;
  const percent = Math.round((score / total) * 100);
  const categoryName = new URLSearchParams(location.search).get("name") || "Quiz";
  const resultData = {
    type: "Category Quiz",
    category: decodeURIComponent(categoryName),
    score: score,
    total: total,
    date: new Date().toISOString()
  };
  addQuizResult(resultData);
  $("#question-text").textContent = "Great job! Here are your results:";
  const summary = document.createElement("div");
  summary.innerHTML = `
    <div class="fact-card"><p><strong>Final Score:</strong> ${score}/${total} (${percent}%)</p></div>
    <div style="margin-top: 1.5rem; text-align: center;"><a href="${resolve("pages/categories.html")}" class="btn">Try Another Category</a></div>`;
  $("#feedback").appendChild(summary);
}

/**
 * initQuiz
 * @description Main function to initialize the category quiz.
 */
async function initQuiz() {
  const params = new URLSearchParams(location.search);
  const categoryId = params.get("category");
  const categoryName = params.get("name");
  $("#category-name").textContent = categoryName ? decodeURIComponent(categoryName) : "Quiz";
  if (!categoryId) {
    $("#question-text").textContent = "Pick a category first.";
    if ($(".quiz-header")) { $(".quiz-header").style.display = "none"; }
    $("#next-question-btn").textContent = "Go to Categories";
    $("#next-question-btn").style.display = "inline-block";
    $("#next-question-btn").onclick = () => location.assign(resolve("pages/categories.html"));
    return;
  }
  try { questions = await fetchQuizData(categoryId); }
  catch (e) { console.error("fetchQuizData failed:", e); questions = []; }
  if (!questions.length) {
    $("#question-text").textContent = "Failed to load questions. Please try another category.";
    if ($(".quiz-header")) { $(".quiz-header").style.display = "none"; }
    $("#next-question-btn").textContent = "Go to Categories";
    $("#next-question-btn").style.display = "inline-block";
    $("#next-question-btn").onclick = () => location.assign(resolve("pages/categories.html"));
    return;
  }
  current = 0; score = 0;
  if ($("#score-value")) { $("#score-value").textContent = "0"; }
  $("#question-total").textContent = String(questions.length);
  renderQuestion();
}

safeInit(initQuiz, () => {
  if ($("#question-text")) { $("#question-text").textContent = "We couldn't load the quiz right now. Please try again."; }
  if ($(".quiz-header")) { $(".quiz-header").style.display = "none"; }
});