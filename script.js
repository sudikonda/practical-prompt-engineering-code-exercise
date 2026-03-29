const STORAGE_KEY = "promptLibraryItems";

const form = document.getElementById("prompt-form");
const titleInput = document.getElementById("title");
const modelInput = document.getElementById("model");
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

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function addNote(promptId) {
  const prompts = getPrompts();
  const prompt = prompts.find((p) => p.id === promptId);
  if (!prompt) return;

  if (!prompt.notes) prompt.notes = [];

  prompt.notes.unshift({
    id: crypto.randomUUID(),
    text: "",
    createdAt: Date.now(),
  });

  savePrompts(prompts);
  renderPrompts();
}

function saveNote(promptId, noteId, text) {
  const prompts = getPrompts();
  const prompt = prompts.find((p) => p.id === promptId);
  if (!prompt || !prompt.notes) return;

  const note = prompt.notes.find((n) => n.id === noteId);
  if (note) {
    note.text = text.trim();
  }

  if (prompt.metadata) {
    try {
      prompt.metadata = MetadataTracker.updateTimestamps(prompt.metadata);
    } catch (error) {
      console.error('Failed to update metadata timestamp:', error.message);
    }
  }

  savePrompts(prompts);
}

function deleteNote(promptId, noteId) {
  const prompts = getPrompts();
  const prompt = prompts.find((p) => p.id === promptId);
  if (!prompt || !prompt.notes) return;

  prompt.notes = prompt.notes.filter((n) => n.id !== noteId);
  savePrompts(prompts);
  renderPrompts();
}

function renderNotesSection(prompt) {
  const notesSection = document.createElement("div");
  notesSection.className = "notes-section";

  const notesHeader = document.createElement("div");
  notesHeader.className = "notes-header";

  const headerLeft = document.createElement("div");
  headerLeft.style.display = "flex";
  headerLeft.style.alignItems = "center";
  headerLeft.style.gap = "8px";

  const notesTitle = document.createElement("h4");
  notesTitle.textContent = "Notes";

  const notesCount = document.createElement("span");
  notesCount.className = "notes-count";
  notesCount.textContent = prompt.notes ? prompt.notes.length : 0;

  headerLeft.append(notesTitle, notesCount);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn-add-note";
  addBtn.textContent = "+ Add Note";
  addBtn.addEventListener("click", () => addNote(prompt.id));

  notesHeader.append(headerLeft, addBtn);

  const notesContainer = document.createElement("div");
  notesContainer.className = "notes-container";

  if (prompt.notes && prompt.notes.length > 0) {
    prompt.notes.forEach((note) => {
      const noteEl = document.createElement("div");
      noteEl.className = "note";

      const noteText = document.createElement("p");
      noteText.className = "note-text";
      noteText.textContent = note.text || "(empty note)";

      const noteMeta = document.createElement("div");
      noteMeta.className = "note-meta";

      const timestamp = document.createElement("span");
      timestamp.textContent = formatTimestamp(note.createdAt);

      const noteActions = document.createElement("div");
      noteActions.className = "note-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn-edit-note";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        const editor = document.createElement("div");
        editor.className = "note-editor";

        const textarea = document.createElement("textarea");
        textarea.value = note.text;
        textarea.maxLength = 500;

        const charCount = document.createElement("div");
        charCount.className = "char-count";
        charCount.textContent = `${note.text.length}/500`;

        textarea.addEventListener("input", () => {
          charCount.textContent = `${textarea.value.length}/500`;
          charCount.classList.toggle("over-limit", textarea.value.length >= 500);
        });

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "btn-save";
        saveBtn.textContent = "Save";
        saveBtn.style.marginTop = "8px";
        saveBtn.addEventListener("click", () => {
          saveNote(prompt.id, note.id, textarea.value);
          renderPrompts();
        });

        textarea.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && e.ctrlKey) {
            saveNote(prompt.id, note.id, textarea.value);
            renderPrompts();
          }
        });

        editor.append(textarea, charCount, saveBtn);
        noteEl.innerHTML = "";
        noteEl.appendChild(editor);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-delete-note";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteNote(prompt.id, note.id));

      noteActions.append(editBtn, deleteBtn);
      noteMeta.append(timestamp, noteActions);
      noteEl.append(noteText, noteMeta);
      notesContainer.appendChild(noteEl);
    });
  }

  notesSection.append(notesHeader, notesContainer);
  return notesSection;
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
  let prompts = getPrompts();
  prompts = MetadataTracker.sortMetadataByCreatedAt(prompts, true);
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

    const notesSection = renderNotesSection(prompt);
    const metadataSection = MetadataTracker.renderMetadataSection(prompt.metadata);

    if (metadataSection) {
      card.append(title, stars, preview, metadataSection, deleteBtn, notesSection);
    } else {
      card.append(title, stars, preview, deleteBtn, notesSection);
    }
    promptList.appendChild(card);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const modelName = modelInput.value.trim() || 'unknown';
  const content = contentInput.value.trim();
  if (!title || !content) return;

  try {
    const metadata = MetadataTracker.trackModel(modelName, content);
    const prompts = getPrompts();
    prompts.unshift({
      id: crypto.randomUUID(),
      title,
      content,
      userRating: 0,
      notes: [],
      metadata,
    });

    savePrompts(prompts);
    form.reset();
    titleInput.focus();
    renderPrompts();
  } catch (error) {
    console.error('Failed to save prompt:', error.message);
    alert(`Error: ${error.message}`);
  }
});

renderPrompts();
