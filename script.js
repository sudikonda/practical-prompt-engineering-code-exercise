const form = document.getElementById('promptForm');
const promptsContainer = document.getElementById('promptsContainer');

function loadPrompts() {
    const prompts = JSON.parse(localStorage.getItem('prompts')) || [];
    renderPrompts(prompts);
}

function savePrompts(prompts) {
    localStorage.setItem('prompts', JSON.stringify(prompts));
}

function renderPrompts(prompts) {
    if (prompts.length === 0) {
        promptsContainer.innerHTML = '<p class="empty-state">No prompts saved yet. Add one above!</p>';
        return;
    }

    promptsContainer.innerHTML = prompts.map((prompt, index) => `
        <div class="prompt-card">
            <h3>${escapeHtml(prompt.title)}</h3>
            <p>${escapeHtml(prompt.content)}</p>
            <button class="btn-delete" onclick="deletePrompt(${index})">Delete</button>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();

    if (!title || !content) return;

    const prompts = JSON.parse(localStorage.getItem('prompts')) || [];
    prompts.unshift({ title, content });
    savePrompts(prompts);
    renderPrompts(prompts);

    form.reset();
});

function deletePrompt(index) {
    const prompts = JSON.parse(localStorage.getItem('prompts')) || [];
    prompts.splice(index, 1);
    savePrompts(prompts);
    renderPrompts(prompts);
}

loadPrompts();
