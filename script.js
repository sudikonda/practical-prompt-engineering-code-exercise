const form = document.getElementById('promptForm');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const titleError = document.getElementById('titleError');
const contentError = document.getElementById('contentError');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');
const promptsContainer = document.getElementById('promptsContainer');

function validateForm() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const isValid = title !== '' && content !== '';
    
    saveBtn.disabled = !isValid;
    
    if (title === '') {
        titleInput.classList.add('error');
        titleError.classList.add('visible');
    } else {
        titleInput.classList.remove('error');
        titleError.classList.remove('visible');
    }
    
    if (content === '') {
        contentInput.classList.add('error');
        contentError.classList.add('visible');
    } else {
        contentInput.classList.remove('error');
        contentError.classList.remove('visible');
    }
    
    return isValid;
}

function clearValidation() {
    titleInput.classList.remove('error');
    contentInput.classList.remove('error');
    titleError.classList.remove('visible');
    contentError.classList.remove('visible');
}

titleInput.addEventListener('input', validateForm);
contentInput.addEventListener('input', validateForm);

titleInput.addEventListener('blur', () => {
    if (titleInput.value.trim() === '') {
        titleInput.classList.add('error');
        titleError.classList.add('visible');
    }
});

contentInput.addEventListener('blur', () => {
    if (contentInput.value.trim() === '') {
        contentInput.classList.add('error');
        contentError.classList.add('visible');
    }
});

function loadPrompts() {
    const prompts = JSON.parse(localStorage.getItem('prompts')) || [];
    renderPrompts(prompts);
}

function savePrompts(prompts) {
    localStorage.setItem('prompts', JSON.stringify(prompts));
}

function renderPrompts(prompts, searchTerm = '') {
    let filteredPrompts = prompts;
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredPrompts = prompts.filter(p => 
            p.title.toLowerCase().includes(term) || 
            p.content.toLowerCase().includes(term)
        );
    }
    
    if (filteredPrompts.length === 0) {
        if (searchTerm) {
            promptsContainer.innerHTML = '<div class="empty-state"><p>No prompts found.</p></div>';
        } else {
            promptsContainer.innerHTML = `
                <div class="empty-state">
                    <p>No prompts saved yet.</p>
                    <p class="empty-hint">Add your first prompt using the form on the left.</p>
                </div>
            `;
        }
        return;
    }

    promptsContainer.innerHTML = filteredPrompts.map((prompt, index) => `
        <div class="prompt-card">
            <div class="prompt-card-header">
                <h3>${escapeHtml(prompt.title)}</h3>
                <div class="card-actions">
                    <button class="btn-copy" onclick="copyPrompt(${index})">Copy</button>
                    <button class="btn-delete" onclick="deletePrompt(${index})">Delete</button>
                </div>
            </div>
            <p>${escapeHtml(prompt.content)}</p>
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
    
    if (!validateForm()) return;
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    const prompts = JSON.parse(localStorage.getItem('prompts')) || [];
    prompts.unshift({ title, content, id: Date.now() });
    savePrompts(prompts);
    renderPrompts(prompts, searchInput.value);

    form.reset();
    clearValidation();
    saveBtn.disabled = true;
});

resetBtn.addEventListener('click', () => {
    form.reset();
    clearValidation();
    saveBtn.disabled = true;
});

searchInput.addEventListener('input', (e) => {
    const prompts = JSON.parse(localStorage.getItem('prompts')) || [];
    renderPrompts(prompts, e.target.value);
});

function copyPrompt(index) {
    const prompts = JSON.parse(localStorage.getItem('prompts')) || [];
    const searchTerm = searchInput.value;
    let filteredPrompts = prompts;
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredPrompts = prompts.filter(p => 
            p.title.toLowerCase().includes(term) || 
            p.content.toLowerCase().includes(term)
        );
    }
    
    if (filteredPrompts[index]) {
        navigator.clipboard.writeText(filteredPrompts[index].content).then(() => {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 1500);
        });
    }
}

function deletePrompt(index) {
    const prompts = JSON.parse(localStorage.getItem('prompts')) || [];
    const searchTerm = searchInput.value;
    let filteredPrompts = prompts;
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredPrompts = prompts.filter(p => 
            p.title.toLowerCase().includes(term) || 
            p.content.toLowerCase().includes(term)
        );
    }
    
    const promptToDelete = filteredPrompts[index];
    const actualIndex = prompts.findIndex(p => p.id === promptToDelete.id || 
        (p.title === promptToDelete.title && p.content === promptToDelete.content));
    
    if (actualIndex > -1) {
        prompts.splice(actualIndex, 1);
        savePrompts(prompts);
        renderPrompts(prompts, searchTerm);
    }
}

exportBtn.addEventListener('click', () => {
    const prompts = JSON.parse(localStorage.getItem('prompts')) || [];
    if (prompts.length === 0) {
        alert('No prompts to export!');
        return;
    }
    
    const dataStr = JSON.stringify(prompts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prompts.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

loadPrompts();
