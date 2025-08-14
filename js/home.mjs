// File: /js/home.mjs
// --- Home Page Specific Logic ---

const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];

/**
 * loadJSON
 * @description A helper function to fetch and parse a JSON file.
 */
async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) { throw new Error(`Failed to load JSON: ${path}`); }
  return res.json();
}

/**
 * initRevealObserver
 * @description Sets up an IntersectionObserver to trigger slide-up animations on scroll.
 */
function initRevealObserver() {
  const io = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    }
  }, { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.2 });
  $$(".reveal").forEach((el) => io.observe(el));
}

/**
 * applyDelays
 * @description Applies CSS animation delays based on data-delay attributes.
 */
function applyDelays(container) {
  container && $$("[data-delay]", container).forEach((el) => {
    const val = Number(el.getAttribute("data-delay")) || 0;
    el.style.setProperty("--delay", `${val}`);
  });
}

/**
 * initHomeAnimations
 * @description Initializes all animations for the home page.
 */
export function initHomeAnimations() {
  const hero = $(".hero-content");
  if (hero) {
    hero.classList.add("reveal");
    applyDelays(hero);
  }
  initRevealObserver();
}

/**
 * initFeatureRotator
 * @description Initializes the automatic and interactive features rotator component.
 */
export async function initFeatureRotator() {
  const section = $("#features");
  if (!section) { return; }
  const src = section.dataset.src ? new URL(section.dataset.src, document.baseURI).toString() : new URL("./public/data/features.json", document.baseURI).toString();
  const card = $(".feature-item", section);
  const dotsWrap = $(".feature-dots", section);
  let items;
  try { items = await loadJSON(src); }
  catch (e) { console.error(e); return; }
  if (!items?.length || !card) { return; }
  
  const createDots = (container, count) => {
    if (!container) {return;}
    container.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const b = document.createElement("button");
      b.className = "feature-dot";
      b.type = "button";
      b.setAttribute("aria-label", `Show feature ${i + 1}`);
      b.dataset.index = String(i);
      container.appendChild(b);
    }
  };
  
  const setActiveDot = (sec, index) => {
    $$(".feature-dot", sec).forEach((d, i) => d.classList.toggle("active", i === index));
  };
  
  const renderFeature = (root, item) => {
    if (!root) {return;}
    if ($("[data-icon]", root)) {$("[data-icon]", root).textContent = item.icon || "⭐";}
    if ($("[data-title]", root)) {$("[data-title]", root).textContent = item.title || "";}
    if ($("[data-text]", root)) {$("[data-text]", root).textContent = item.text || "";}
    if ($("[data-image]", root)) {
      if (item.image) {
        $("[data-image]", root).src = item.image;
        $("[data-image]", root).alt = item.title || "";
        $("[data-image]", root).style.display = "";
      } else {
        $("[data-image]", root).removeAttribute("src");
        $("[data-image]", root).alt = "";
        $("[data-image]", root).style.display = "none";
      }
    }
  };
  
  const fadeSwap = (el, next) => {
    if (!el) {return;}
    el.classList.add("fade-out");
    setTimeout(() => {
      next?.();
      el.classList.remove("fade-out");
      el.classList.add("fade-in");
      setTimeout(() => el.classList.remove("fade-in"), 300);
    }, 300);
  };
  
  createDots(dotsWrap, items.length);
  let index = 0;
  renderFeature(card, items[index]);
  setActiveDot(section, index);
  
  dotsWrap?.addEventListener("click", (e) => {
    const btn = e.target.closest(".feature-dot");
    if (!btn) {return;}
    const nextIdx = Number(btn.dataset.index);
    if (Number.isNaN(nextIdx) || nextIdx === index) {return;}
    fadeSwap(card, () => {
      index = nextIdx;
      renderFeature(card, items[index]);
      setActiveDot(section, index);
    });
  });
  
  let timer = setInterval(() => {
    const nextIdx = (index + 1) % items.length;
    fadeSwap(card, () => {
      index = nextIdx;
      renderFeature(card, items[index]);
      setActiveDot(section, index);
    });
  }, 10000);
  
  section.addEventListener("mouseenter", () => clearInterval(timer));
  section.addEventListener("mouseleave", () => {
    timer = setInterval(() => {
      const nextIdx = (index + 1) % items.length;
      fadeSwap(card, () => {
        index = nextIdx;
        renderFeature(card, items[index]);
        setActiveDot(section, index);
      });
    }, 10000);
  });
}

let __home_inited = false;
export default async function initHome() {
  if (__home_inited) { return; }
  __home_inited = true;
  initHomeAnimations();
  await initFeatureRotator();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initHome());
} else {
  initHome();
}