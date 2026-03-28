const STORAGE_KEY = "promptLibraryItems";

const form = document.getElementById("prompt-form");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const promptList = document.getElementById("prompt-list");

function getPrompts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function savePrompts(prompts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

function contentPreview(text, wordCount = 8) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= wordCount) return words.join(" ");
  return `${words.slice(0, wordCount).join(" ")}...`;
}

function setRating(promptId, rating) {
  const prompts = getPrompts();
  const prompt = prompts.find((p) => p.id === promptId);
  if (prompt) {
    prompt.userRating = rating;
    savePrompts(prompts);
    renderPrompts();
  }
}

function renderStars(promptId, currentRating) {
  const container = document.createElement("div");
  container.className = "star-rating";

  for (let star = 1; star <= 5; star++) {
    const starEl = document.createElement("span");
    starEl.className = "star";
    starEl.textContent = "★";
    starEl.dataset.value = star;

    if (star <= currentRating) {
      starEl.classList.add("filled");
    }

    starEl.addEventListener("mouseenter", () => {
      container
        .querySelectorAll(".star")
        .forEach((s, i) => {
          s.classList.toggle("hover-preview", i < star);
        });
    });

    starEl.addEventListener("mouseleave", () => {
      container.querySelectorAll(".star").forEach((s, i) => {
        s.classList.toggle("hover-preview", false);
      });
    });

    starEl.addEventListener("click", () => {
      setRating(promptId, star);
    });

    container.appendChild(starEl);
  }

  return container;
}

function renderPrompts() {
  const prompts = getPrompts();
  promptList.innerHTML = "";

  prompts.forEach((prompt) => {
    const card = document.createElement("article");
    card.className = "prompt-card";

    const title = document.createElement("h3");
    title.textContent = prompt.title;

    const stars = renderStars(prompt.id, prompt.userRating || 0);

    const preview = document.createElement("p");
    preview.className = "prompt-preview";
    preview.textContent = contentPreview(prompt.content);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      const updated = getPrompts().filter((item) => item.id !== prompt.id);
      savePrompts(updated);
      renderPrompts();
    });

    card.append(title, stars, preview, deleteBtn);
    promptList.appendChild(card);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !content) return;

  const prompts = getPrompts();
  prompts.unshift({
    id: crypto.randomUUID(),
    title,
    content,
    userRating: 0,
  });

  savePrompts(prompts);
  form.reset();
  titleInput.focus();
  renderPrompts();
});

renderPrompts();
