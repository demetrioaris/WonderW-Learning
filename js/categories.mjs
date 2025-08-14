
const SUBJECTS = [
  { id: 17, name: "Science", desc: "10-question quiz" },
  { id: 19, name: "Math", desc: "10-question quiz" },
  { id: 23, name: "History", desc: "10-question quiz" },
  { id: 27, name: "Animals", desc: "10-question quiz" },
  { id: 22, name: "Geography", desc: "10-question quiz" },
  { id: 9,  name: "General Knowledge", desc: "10-question quiz" }
];

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
  const isGh = location.hostname.endsWith("github.io");
  const parts = location.pathname.split("/").filter(Boolean); 
  const repo = isGh ? (parts[0] || "") : "";
  return repo ? `/${repo}/` : "/";
}

const $  = (sel, p = document) => p.querySelector(sel);

function buildQuizHref(base, id, name) {
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
      const linkEl = node.querySelector("a.activity-card-categ");

      if (imgEl) { imgEl.src = img; imgEl.alt = title; }
      if (h3El)  {h3El.textContent = title;}
      if (pEl)   {pEl.textContent = desc;}
      if (linkEl) {linkEl.href = href;}

      listEl.appendChild(node);
    } else {
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

  const quizList = $("#categories-list");
  const quizTpl  = $("#tpl-category-card");
  const quizForm = $("#category-search-form");

  const quizFields = (cat) => ({
    title: cat.name,
    desc:  cat.desc,
    img:   `../public/images/home/${slugify(cat.name)}.jpg`
  });
  const quizHref = (cat) => buildQuizHref(BASE, cat.id, cat.name);

  if (quizList) {
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

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
