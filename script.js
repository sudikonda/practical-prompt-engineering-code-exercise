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

function renderPrompts() {
  const prompts = getPrompts();
  promptList.innerHTML = "";

  prompts.forEach((prompt) => {
    const card = document.createElement("article");
    card.className = "prompt-card";

    const title = document.createElement("h3");
    title.textContent = prompt.title;

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

    card.append(title, preview, deleteBtn);
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
  });

  savePrompts(prompts);
  form.reset();
  titleInput.focus();
  renderPrompts();
});

renderPrompts();
