// js/nature-lab.mjs
import { fetchIdigbioMedia } from "./api.mjs";

const $ = (sel, ctx = document) => ctx.querySelector(sel);

// Barajar (Fisher–Yates)
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderRound({ container, specimen, options }) {
  container.innerHTML = `
    <div class="quiz-header">
      <div class="quiz-status">Round</div>
      <div class="quiz-timer" aria-live="polite">No timer</div>
    </div>
    <div class="quiz-body">
      <h2>What animal is this?</h2>
      <div style="display:flex;justify-content:center;margin-bottom:1rem;">
        <img src="${specimen.img}" alt="Specimen image" style="max-height:300px;max-width:100%;border-radius:8px;">
      </div>
      <div class="quiz-options" id="options"></div>
    </div>
    <div class="quiz-footer" id="feedback"></div>
  `;

  const optsEl = $("#options", container);
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.type = "button";
    btn.textContent = opt.title;
    btn.addEventListener("click", () => onAnswer(btn, opt.correct, container, specimen));
    optsEl.appendChild(btn);
  });
}

function onAnswer(btn, correct, container, specimen) {
  const all = container.querySelectorAll(".quiz-option-btn");
  all.forEach(b => (b.disabled = true));

  if (correct) {
    btn.classList.add("correct");
    $("#feedback", container).innerHTML = `
      <p><strong>Correct!</strong> ${specimen.title}${specimen.country ? " — " + specimen.country : ""}</p>
      <a class="btn" style="display:inline-block;margin-top:.5rem;" href="" onclick="location.reload();return false;">Play again</a>
    `;
  } else {
    btn.classList.add("incorrect");
    $("#feedback", container).innerHTML = `
      <p><strong>Oops!</strong> The correct answer was: <em>${specimen.title}</em>.</p>
      <a class="btn" style="display:inline-block;margin-top:.5rem;" href="" onclick="location.reload();return false;">Try another</a>
    `;
  }
}

export async function initNatureLab() {
  const container = document.getElementById("game-area");
  if (!container) {return;}

  // Carga algunos especímenes (puedes cambiar 'Mammalia' por otro taxón).
  const pool = await fetchIdigbioMedia({ taxon: "Mammalia", limit: 12 });
  const items = pool.filter(x => x.img).slice(0, 8);
  if (items.length < 4) {
    container.innerHTML = "<p>We couldn't load enough specimens. Please try again later.</p>";
    return;
  }

  // Elige 1 correcta y 3 distractores
  const shuffled = shuffle(items);
  const specimen = shuffled[0];
  const distractors = shuffled.slice(1, 4);

  const options = shuffle([
    { title: specimen.title, correct: true },
    ...distractors.map(d => ({ title: d.title, correct: false }))
  ]);

  renderRound({ container, specimen, options });
}
