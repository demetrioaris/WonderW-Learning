// Onboarding modal: shows once on first visit using localStorage flag.

const $ = (sel, p = document) => p.querySelector(sel);
const LS_KEY = "wwl";

function getState() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || { settings: { tutorialSeen: false } }; }
  catch { return { settings: { tutorialSeen: false } }; }
}
function setState(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

const overlay = $("#tour-overlay");
const modal = $("#tour-modal");
const prevBtn = $("#tour-prev");
const nextBtn = $("#tour-next");
const doneBtn = $("#tour-done");

let step = 0;

function open() {
  if (overlay) {overlay.hidden = false;}
  if (modal) {modal.hidden = false;}
  highlightStep(0);
}
function close() {
  if (overlay) {overlay.hidden = true;}
  if (modal) {modal.hidden = true;}
  const s = getState();
  s.settings ||= {};
  s.settings.tutorialSeen = true;
  setState(s);
}
function highlightStep(i) {
  step = Math.max(0, Math.min(2, i));
  const items = modal?.querySelectorAll("#tour-desc li") || [];
  items.forEach((li, idx) => { li.style.fontWeight = idx === step ? "700" : "400"; });
}

prevBtn?.addEventListener("click", () => highlightStep(step - 1));
nextBtn?.addEventListener("click", () => highlightStep(step + 1));
doneBtn?.addEventListener("click", close);

(function init() {
  const s = getState();
  if (!s.settings?.tutorialSeen) {open();}
})();
