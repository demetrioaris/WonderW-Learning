// home.mjs — Home page behaviors: reveal animation + features rotator
// Funcionará tanto si lo importas desde app.js como si lo cargas directo con <script type="module">.

// ---------- Utils ----------
const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) {throw new Error(`Failed to load JSON: ${path}`);}
  return res.json();
}

// ---------- Reveal (slide-up) ----------
function initRevealObserver() {
  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target); // animar una sola vez
        }
      }
    },
    { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.2 }
  );

  $$(".reveal").forEach((el) => io.observe(el));
}

function applyDelays(container) {
  container && $$("[data-delay]", container).forEach((el) => {
    const val = Number(el.getAttribute("data-delay")) || 0;
    el.style.setProperty("--delay", `${val}`);
  });
}

export function initHomeAnimations() {
  const hero = $(".hero-content");
  if (hero) {
    hero.classList.add("reveal");
    applyDelays(hero);
  }
  initRevealObserver();
}

// ---------- Features Rotator ----------
const INTERVAL_MS = 10000; // 10s por requisito

function createDots(container, count) {
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
}

function setActiveDot(section, index) {
  const dots = $$(".feature-dot", section);
  dots.forEach((d, i) => d.classList.toggle("active", i === index));
}

function renderFeature(root, item) {
  if (!root) {return;}
  const iconEl = $("[data-icon]", root);
  const titleEl = $("[data-title]", root);
  const textEl = $("[data-text]", root);
  const imageEl = $("[data-image]", root);

  if (iconEl) {iconEl.textContent = item.icon || "⭐";}
  if (titleEl) {titleEl.textContent = item.title || "";}
  if (textEl) {textEl.textContent = item.text || "";}
  if (imageEl) {
    if (item.image) {
      imageEl.src = item.image;
      imageEl.alt = item.title || "";
      imageEl.style.display = ""; // por si antes estaba oculto
    } else {
      imageEl.removeAttribute("src");
      imageEl.alt = "";
      imageEl.style.display = "none";
    }
  }
}

function fadeSwap(cardEl, next) {
  if (!cardEl) {return;}
  cardEl.classList.add("fade-out");
  setTimeout(() => {
    next && next();
    cardEl.classList.remove("fade-out");
    cardEl.classList.add("fade-in");
    setTimeout(() => cardEl.classList.remove("fade-in"), 300);
  }, 300);
}

export async function initFeatureRotator() {
  const section = $("#features");
  if (!section) {return;}

  const src = section.dataset.src || "./public/data/features.json";
  const card = $(".feature-item", section);
  const dotsWrap = $(".feature-dots", section);

  let items;
  try {
    items = await loadJSON(src);
  } catch (e) {
    // Silencioso en UI; evita romper Home si el JSON falla
    console.error(e);
    return;
  }
  if (!items?.length || !card) {return;}

  createDots(dotsWrap, items.length);
  let index = 0;
  renderFeature(card, items[index]);
  setActiveDot(section, index);

  // Navegación por dots
  dotsWrap && dotsWrap.addEventListener("click", (e) => {
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

  // Rotación automática
  let timer = setInterval(() => {
    const nextIdx = (index + 1) % items.length;
    fadeSwap(card, () => {
      index = nextIdx;
      renderFeature(card, items[index]);
      setActiveDot(section, index);
    });
  }, INTERVAL_MS);

  // Pausar al interactuar (UX)
  section.addEventListener("mouseenter", () => clearInterval(timer));
  section.addEventListener("mouseleave", () => {
    timer = setInterval(() => {
      const nextIdx = (index + 1) % items.length;
      fadeSwap(card, () => {
        index = nextIdx;
        renderFeature(card, items[index]);
        setActiveDot(section, index);
      });
    }, INTERVAL_MS);
  });

  // Pausar cuando la pestaña no está visible
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearInterval(timer);
    } else {
      timer = setInterval(() => {
        const nextIdx = (index + 1) % items.length;
        fadeSwap(card, () => {
          index = nextIdx;
          renderFeature(card, items[index]);
          setActiveDot(section, index);
        });
      }, INTERVAL_MS);
    }
  });
}

// ---------- Init combinado ----------
export default async function initHome() {
  initHomeAnimations();
  await initFeatureRotator();
}

// Auto-init si el archivo se carga directamente como módulo en index.html
if (document.currentScript && document.currentScript.type === "module") {
  // Ejecuta cuando el DOM esté listo por si el script va en <head>
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initHome());
  } else {
    initHome();
  }
}
