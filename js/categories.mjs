// File: /js/categories.mjs
// --- Categories Page Logic ---
import { resolveAbs, $, $$ } from "./utils.mjs";

const SUBJECTS = [
  { id: 17, name: "Science", desc: "10-question quiz" },
  { id: 19, name: "Math", desc: "10-question quiz" },
  { id: 23, name: "History", desc: "10-question quiz" },
  { id: 27, name: "Animals", desc: "10-question quiz" },
  { id: 22, name: "Geography", desc: "10-question quiz" },
  { id: 9, name: "General Knowledge", desc: "10-question quiz" }
];

const IDIGBIO_ITEMS = [
  { slug: "nature-lab", title: "Guess the Animal", desc: "Look at the image and choose the correct answer.", img: "../public/images/home/nature-guess.jpg" },
  { slug: "nature-cards", title: "Creature Cards", desc: "Collect cards with photo, name, and discovery location.", img: "../public/images/home/nature-cards.jpg" }
];

const WIKI_TOPICS = [
  { topic: "dinosaur", title: "Dinosaurs", desc: "Read a friendly summary with an image and keep learning.", img: "../public/images/home/wiki-dino.jpg" },
  { topic: "computer", title: "Computers", desc: "Discover how they work and their history.", img: "../public/images/home/wiki-computers.jpg" }
];

/**
 * renderCardsList
 * @description Renders a list of items into a container using an HTML template.
 */
function renderCardsList({ listEl, tplEl, items, buildHref, fields }) {
  if (!listEl || !Array.isArray(items)) { return; }
  listEl.innerHTML = "";
  items.forEach(item => {
    const { title, desc, img } = fields(item);
    const href = buildHref(item);
    if (tplEl) {
      const node = tplEl.content.cloneNode(true);
      if ($("img", node)) { $("img", node).src = img; $("img", node).alt = title; }
      if ($("h3, .category-name", node)) { $("h3, .category-name", node).textContent = title; }
      if ($("p, .category-desc", node)) { $("p, .category-desc", node).textContent = desc; }
      if ($("a.activity-card", node)) { $("a.activity-card", node).href = href; }
      listEl.appendChild(node);
    }
  });
}

/**
 * initCategories
 * @description Initializes the categories page by rendering all activity sections and setting up the search filter.
 */
export function initCategories() {
  const quizList = $("#categories-list"), quizTpl = $("#tpl-category-card"), quizForm = $("#category-search-form");
  const idbList = $("#idigbio-list"), idbTpl = $("#tpl-idigbio-card");
  const wikiList = $("#wiki-list"), wikiTpl = $("#tpl-wiki-card");

  const buildQuizHref = (cat) => resolveAbs(`pages/quiz.html?category=${cat.id}&name=${encodeURIComponent(cat.name)}`);

  const renderQuizCards = (subjects) => {
    renderCardsList({
      listEl: quizList, tplEl: quizTpl, items: subjects,
      buildHref: buildQuizHref,
      fields: (s) => ({ title: s.name, desc: s.desc, img: resolveAbs(`public/images/categories/${s.name.toLowerCase().replace(/\s/g, "-")}.jpg`) })
    });
  };

  if (quizList) { renderQuizCards(SUBJECTS); }

  if (quizForm) {
    quizForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = new FormData(quizForm).get("q")?.toString().toLowerCase().trim() || "";
      renderQuizCards(SUBJECTS.filter(s => s.name.toLowerCase().includes(q)));
    });
  }

  if (idbList) {
    renderCardsList({
      listEl: idbList, tplEl: idbTpl, items: IDIGBIO_ITEMS,
      buildHref: (item) => resolveAbs(`pages/${item.slug}.html`),
      fields: (item) => ({ title: item.title, desc: item.desc, img: resolveAbs(item.img.replace("../", "")) })
    });
  }

  if (wikiList) {
    renderCardsList({
      listEl: wikiList, tplEl: wikiTpl, items: WIKI_TOPICS,
      buildHref: (item) => resolveAbs(`pages/wiki-explorer.html?topic=${item.topic}`),
      fields: (item) => ({ title: item.title, desc: item.desc, img: resolveAbs(item.img.replace("../", "")) })
    });
  }
}