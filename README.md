# Practical Prompt Engineering Course

This is a companion repository for the [Practical Prompt Engineering](https://frontendmasters.com/courses/prompt-engineering/) course on Frontend Masters.

## About this Repo

This repo contains the final code for the **Prompt Library** application built in the course. The `reference-project` branch is the application demonstrated at the beginning of the course. The commits on the `main` branch are the progress checks for the application build during the course.

## Prompt Library Application

A web-based application for saving, organizing, and managing AI prompts locally in your browser.

### Features

#### 📝 Prompt Management
- **Create prompts**: Save prompts with a title, model name (e.g., gpt-4, claude-3-opus), and content
- **Edit & delete**: Modify or remove saved prompts as needed
- **Content preview**: See a preview of each prompt's content in the list view

#### ⭐ Rating System
- Rate each prompt with a 5-star rating system
- Track which prompts work best for you

#### 🗒️ Notes
- Add unlimited notes to any prompt
- Edit notes in place with a simple text editor
- Delete notes when no longer needed
- Character limit: 500 characters per note

#### 📊 Metadata Tracking
Each prompt automatically tracks:
- **Model name**: The AI model associated with the prompt
- **Created timestamp**: When the prompt was first saved
- **Updated timestamp**: Last modification time (updates when notes are added/edited)
- **Token estimates**: Approximate token count range (min-max) with confidence level (high/medium/low)
- **Relative time display**: "Just now", "5m ago", "2h ago", etc.

#### 💾 Export & Import
- **Export**: Download all prompts as a JSON file with statistics
  - Includes total prompts, average rating, most used model, and total notes count
  - Automatic backup before import operations
  - Timestamped filenames for easy organization
- **Import**: Import prompts from JSON files
  - Validates file structure and data integrity
  - **Conflict resolution**: Choose how to handle duplicate prompts:
    - Replace All: Import file, discard existing prompts
    - Keep Both: Merge imported prompts with existing ones
    - Skip Duplicates: Only import new prompts
    - Cancel: Abort import and restore backup

#### 🔒 Data Storage
- All data stored locally in browser localStorage
- No external servers or cloud storage
- Your prompts remain private and secure

### Tech Stack
- **HTML5**: Semantic markup
- **CSS3**: Custom styling with CSS variables
- **Vanilla JavaScript**: No frameworks, pure ES6+ JavaScript
- **LocalStorage API**: Client-side data persistence
- **File API**: Import/export functionality

### Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd practical-prompt-engineering-code-exercise
   ```

2. Open `index.html` in your web browser:
   ```bash
   open index.html
   # or
   python -m http.server 8000
   # then visit http://localhost:8000
   ```

3. Start saving your prompts!

### Project Structure

```
├── index.html          # Main application HTML
├── styles.css          # Application styles
├── script.js           # Main application logic
├── export-import.js    # Export/import functionality
├── metadata.js         # Metadata tracking utilities
└── README.md           # This file
```

### Browser Compatibility

Works in modern browsers that support:
- ES6+ JavaScript
- LocalStorage API
- File API
- Crypto.randomUUID()

### Development

To contribute or modify:

1. Make changes to the relevant files
2. Refresh your browser to see changes
3. Test export/import functionality with sample JSON files

### License

This project is part of the Frontend Masters Practical Prompt Engineering course.
