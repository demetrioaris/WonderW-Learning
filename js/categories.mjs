// Categories: renders subject cards and builds links to quiz.html with category params.
// External API used later in quiz: OpenTDB (category IDs referenced here)

const SUBJECTS = [
  { id: 17, name: "Science", desc: "10-question quiz" },
  { id: 19, name: "Math", desc: "10-question quiz" },
  { id: 23, name: "History", desc: "10-question quiz" },
  { id: 27, name: "Animals", desc: "10-question quiz" },
  { id: 22, name: "Geography", desc: "10-question quiz" },
  { id: 9,  name: "General Knowledge", desc: "10-question quiz" }
];

const $ = (sel, p = document) => p.querySelector(sel);

const list = $("#categories-list");
const tpl = $("#tpl-category-card");
const form = $("#category-search-form");

function render(items) {
  if (!list) {return;}
  list.innerHTML = "";
  items.forEach(cat => {
    if (tpl) {
      const node = tpl.content.cloneNode(true);
      node.querySelector(".category-name").textContent = cat.name;
      node.querySelector(".category-desc").textContent = cat.desc;
      const a = node.querySelector(".play-btn");
      a.href = `${window.location.origin}/WonderW-Learning/pages/quiz.html?category=${encodeURIComponent(cat.id)}&name=${encodeURIComponent(cat.name)}`;
      a.setAttribute("aria-label", `Play quiz in ${cat.name}`);
      list.appendChild(node);
    } else {
      const a = document.createElement("a");
      a.className = "btn";
      a.textContent = `Play ${cat.name}`;
      a.href = `${window.location.origin}/WonderW-Learning/pages/quiz.html?category=${encodeURIComponent(cat.id)}&name=${encodeURIComponent(cat.name)}`;
      list.appendChild(a);
    }
  });
}

render(SUBJECTS);

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = new FormData(form).get("q")?.toString().toLowerCase().trim() || "";
    const filtered = SUBJECTS.filter(s => s.name.toLowerCase().includes(q));
    render(filtered);
  });
}
