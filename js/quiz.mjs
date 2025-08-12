import { fetchQuizData } from "./api.mjs";

// DOM Elements
let questionTextEl, optionsEl, feedbackTextEl, nextButtonEl;
let currentQuestionEl, totalQuestionsEl, scoreValueEl, timerEl;

// Quiz State
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer;

/**
 * Initializes the quiz, fetches data based on URL category, and starts the first question.
 */
export async function initQuiz() {
  // Find all necessary DOM elements once
  questionTextEl = document.getElementById("question-text");
  optionsEl = document.getElementById("quiz-options");
  feedbackTextEl = document.getElementById("feedback-text");
  nextButtonEl = document.getElementById("next-question-btn");
  currentQuestionEl = document.getElementById("question-current");
  totalQuestionsEl = document.getElementById("question-total");
  scoreValueEl = document.getElementById("score-value");
  const timerContainer = document.getElementById("quiz-timer");

  // Safety check to ensure all elements exist before proceeding
  if (!questionTextEl || !optionsEl || !nextButtonEl || !timerContainer) {
    console.error("Quiz initialization failed: One or more essential HTML elements are missing.");
    return;
  }
  
  timerEl = timerContainer.querySelector("span");
  nextButtonEl.addEventListener("click", () => displayNextQuestion());
    
  // Get the category ID from the current URL
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get("category");
  
  // Fetch data from the API, passing the selected category ID
  const rawQuestions = await fetchQuizData(categoryId);
  
  if (rawQuestions.length === 0) {
    questionTextEl.textContent = "Failed to load questions for this category. Please try another one.";
    document.querySelector(".quiz-header").style.display = "none";
    return;
  }
  
  questions = rawQuestions;
  totalQuestionsEl.textContent = questions.length;

  // Start the quiz
  displayNextQuestion();
}

/**
 * Displays the current question and its options.
 */
function displayNextQuestion() {
  resetState();
  if (currentQuestionIndex >= questions.length) {
    showFinalScore();
    return;
  }

  const question = questions[currentQuestionIndex];
  const options = [...question.incorrect_answers, question.correct_answer];
    
  // Update question text and status
  questionTextEl.innerHTML = question.question;
  currentQuestionEl.textContent = currentQuestionIndex + 1;

  // Create and display answer buttons
  options.sort(() => Math.random() - 0.5); // Shuffle options
  options.forEach(option => {
    const button = document.createElement("button");
    button.innerHTML = option;
    button.className = "quiz-option-btn";
    button.addEventListener("click", () => selectAnswer(button, option, question.correct_answer));
    optionsEl.appendChild(button);
  });
    
  startTimer(question.correct_answer);
}

/**
 * Resets the UI state for the next question.
 */
function resetState() {
  clearTimeout(timer);
  optionsEl.innerHTML = "";
  feedbackTextEl.textContent = "";
  nextButtonEl.style.display = "none";
}

/**
 * Handles the user's answer selection.
 */
function selectAnswer(buttonEl, selectedOption, correctAnswer) {
  clearTimeout(timer);
  // Disable all buttons after an answer is selected
  Array.from(optionsEl.children).forEach(button => button.disabled = true);
    
  if (selectedOption === correctAnswer) {
    score++;
    scoreValueEl.textContent = score;
    buttonEl.classList.add("correct");
    feedbackTextEl.textContent = "Correct!";
  } else {
    buttonEl.classList.add("incorrect");
    feedbackTextEl.textContent = `Sorry, the correct answer was: ${correctAnswer}`;
  }
  
  // Move to the next question index
  currentQuestionIndex++;
  
  // Show the 'Next Question' or 'Show Results' button
  if (currentQuestionIndex < questions.length) {
    nextButtonEl.textContent = "Next Question";
  } else {
    nextButtonEl.textContent = "Show Results";
  }
  nextButtonEl.style.display = "block";
}

/**
 * Shows the final score and saves the result to localStorage.
 */
function showFinalScore() {
  questionTextEl.textContent = "Quiz Complete!";
  optionsEl.innerHTML = "";
  feedbackTextEl.innerHTML = `You scored <strong>${score}</strong> out of <strong>${questions.length}</strong>!`;
  
  // --- LÓGICA PARA GUARDAR ---
  const urlParams = new URLSearchParams(window.location.search);
  const categoryName = urlParams.get("name") || "General Knowledge"; // Obtiene el nombre de la URL

  // 1. Crea el objeto con el resultado del quiz.
  const result = {
    categoryName: categoryName.replace(/%20/g, " "), // Reemplaza %20 con espacios
    score: score,
    totalQuestions: questions.length,
    percentage: Math.round((score / questions.length) * 100),
    date: new Date().toLocaleDateString() // Guarda la fecha actual
  };

  // 2. Obtiene el historial existente o crea un array vacío.
  const history = JSON.parse(localStorage.getItem("quizHistory")) || [];

  // 3. Añade el nuevo resultado al historial.
  history.push(result);

  // 4. Guarda el historial actualizado en localStorage.
  localStorage.setItem("quizHistory", JSON.stringify(history));
  // --- FIN DE LA LÓGICA PARA GUARDAR ---

  nextButtonEl.textContent = "Play Another Category";
  nextButtonEl.style.display = "block";
  nextButtonEl.onclick = () => {
    window.location.href = `${window.location.origin}/WonderW-Learning/pages/categories.html`;
  };
}
/**
 * Starts a 30-second countdown timer for the current question.
 * @param {string} correctAnswer - The correct answer for the current question.
 */
function startTimer(correctAnswer) {
  let timeLeft = 30;
  timerEl.textContent = timeLeft;

  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft < 0) {
      clearTimeout(timer);
      feedbackTextEl.textContent = "Time's up!";
      
      // Find and highlight the correct answer when time runs out
      Array.from(optionsEl.children).forEach(button => {
        button.disabled = true;
        if (button.innerHTML === correctAnswer) {
          button.classList.add("correct");
        }
      });
      
      // Move to the next question index
      currentQuestionIndex++;

      // Show the 'Next Question' or 'Show Results' button
      if (currentQuestionIndex < questions.length) {
        nextButtonEl.textContent = "Next Question";
      } else {
        nextButtonEl.textContent = "Show Results";
      }
      nextButtonEl.style.display = "block";
    }
  }, 1000);
}