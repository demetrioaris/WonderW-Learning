// js/categories.mjs
// Three-section renderer for the Categories page:
// 1) Quiz by Category (OpenTDB)
// 2) Species Safari (iDigBio)
// 3) Explore with Wikipedia

// --- QUIZ (OpenTDB) ---
const SUBJECTS = [
  { id: 17, name: "Science", desc: "10-question quiz" },
  { id: 19, name: "Math", desc: "10-question quiz" },
  { id: 23, name: "History", desc: "10-question quiz" },
  { id: 27, name: "Animals", desc: "10-question quiz" },
  { id: 22, name: "Geography", desc: "10-question quiz" },
  { id: 9,  name: "General Knowledge", desc: "10-question quiz" }
];

// --- IDIGBIO (cards estáticas que llevan a páginas de juego) ---
const IDIGBIO_ITEMS = [
  {
    slug: "nature-lab",
    title: "Guess the Animal",
    desc: "Look at the image and choose the correct answer.",
    img: "../public/images/home/nature-guess.jpg"
  },
  {
    slug: "nature-cards",
    title: "Creature Cards",
    desc: "Collect cards with photo, name, and discovery location.",
    img: "../public/images/home/nature-cards.jpg"
  }
];

// --- WIKIPEDIA (temas sugeridos para explorar resúmenes) ---
const WIKI_TOPICS = [
  {
    topic: "dinosaur",
    title: "Dinosaurs",
    desc: "Read a friendly summary with an image and keep learning.",
    img: "../public/images/home/wiki-dino.jpg"
  },
  {
    topic: "computer",
    title: "Computers",
    desc: "Discover how they work and their history.",
    img: "../public/images/home/wiki-computers.jpg"
  }
];

function getBase() {
  // Detecta repo en GitHub Pages: usuario.github.io/<repo>/...
  const isGh = location.hostname.endsWith("github.io");
  const parts = location.pathname.split("/").filter(Boolean); // ["<repo>", "pages", ...]
  const repo = isGh ? (parts[0] || "") : "";
  return repo ? `/${repo}/` : "/";
}

const $  = (sel, p = document) => p.querySelector(sel);

function buildQuizHref(base, id, name) {
  // categories vive en /pages/, pero construimos absoluto relativo al repo para evitar 404.
  return `${base}pages/quiz.html?category=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
}

function buildIdigbioHref(base, slug) {
  return `${base}pages/${slug}.html`;
}

function buildWikiHref(base, topic) {
  return `${base}pages/wiki-explorer.html?topic=${encodeURIComponent(topic)}`;
}

function renderCardsList({ listEl, tplEl, items, buildHref, fields }) {
  if (!listEl || !Array.isArray(items)) {return;}
  listEl.innerHTML = "";

  items.forEach(item => {
    const { title, desc, img } = fields(item);
    const href = buildHref(item);

    if (tplEl) {
      const node = tplEl.content.cloneNode(true);
      const imgEl = node.querySelector("img");
      const h3El  = node.querySelector("h3, .category-name");
      const pEl   = node.querySelector("p, .category-desc");
      const btn   = node.querySelector(".btn, .play-btn, a");

      if (imgEl) { imgEl.src = img; imgEl.alt = title; }
      if (h3El)  {h3El.textContent = title;}
      if (pEl)   {pEl.textContent = desc;}
      if (btn)   {btn.href = href;}

      listEl.appendChild(node);
    } else {
      // Fallback sin template
      const a = document.createElement("a");
      a.className = "activity-card";
      a.href = href;
      a.innerHTML = `
        <img src="${img}" alt="${title}">
        <h3>${title}</h3>
        <p>${desc}</p>
        <span class="btn">Open</span>
      `;
      listEl.appendChild(a);
    }
  });
}

export function initCategories() {
  const BASE = getBase();

  // --- Section 1: QUIZ ---
  const quizList = $("#categories-list");
  const quizTpl  = $("#tpl-category-card");
  const quizForm = $("#category-search-form");

  const quizFields = (cat) => ({
    title: cat.name,
    desc:  cat.desc,
    img:   `../public/images/home/${slugify(cat.name)}.jpg` // opcional si tienes imágenes por categoría
  });
  const quizHref = (cat) => buildQuizHref(BASE, cat.id, cat.name);

  // Render inicial Quiz
  if (quizList) {
    // Si no tienes imágenes por categoría, podemos render sin imagen:
    renderCardsList({
      listEl: quizList,
      tplEl:  quizTpl,
      items:  SUBJECTS.map(s => ({ ...s, img: quizFields(s).img })),
      buildHref: quizHref,
      fields: (s) => ({
        title: s.name,
        desc:  s.desc,
        img:   quizFields(s).img || "../public/images/home/science.jpg"
      })
    });
  }

  // Buscador (solo filtra QUIZ)
  if (quizForm && quizList) {
    quizForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = new FormData(quizForm).get("q")?.toString().toLowerCase().trim() || "";
      const filtered = SUBJECTS.filter(s => s.name.toLowerCase().includes(q));
      renderCardsList({
        listEl: quizList,
        tplEl:  quizTpl,
        items:  filtered.map(s => ({ ...s, img: quizFields(s).img })),
        buildHref: quizHref,
        fields: (s) => ({
          title: s.name,
          desc:  s.desc,
          img:   quizFields(s).img || "../public/images/home/science.jpg"
        })
      });
    });
  }

  // --- Section 2: IDIGBIO ---
  const idbList = $("#idigbio-list");
  const idbTpl  = $("#tpl-idigbio-card");
  if (idbList) {
    renderCardsList({
      listEl: idbList,
      tplEl:  idbTpl,
      items:  IDIGBIO_ITEMS,
      buildHref: (item) => buildIdigbioHref(BASE, item.slug),
      fields: (item) => ({ title: item.title, desc: item.desc, img: item.img })
    });
  }

  // --- Section 3: WIKIPEDIA ---
  const wikiList = $("#wiki-list");
  const wikiTpl  = $("#tpl-wiki-card");
  if (wikiList) {
    renderCardsList({
      listEl: wikiList,
      tplEl:  wikiTpl,
      items:  WIKI_TOPICS,
      buildHref: (item) => buildWikiHref(BASE, item.topic),
      fields: (item) => ({ title: item.title, desc: item.desc, img: item.img })
    });
  }

  // Pequeña mejora UX: aplicar animación 'reveal' si existe (IntersectionObserver)
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add("is-visible"));
  }
}

// Util para construir rutas de imagen por nombre (opcional)
function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
