const ExportImportManager = (function() {
  const EXPORT_VERSION = "1.0.0";
  const BACKUP_KEY = "promptLibraryBackup";

  function calculateStatistics(prompts) {
    const stats = {
      totalPrompts: prompts.length,
      averageRating: 0,
      mostUsedModel: "N/A",
      totalNotes: 0,
      modelsUsed: {}
    };

    if (prompts.length === 0) return stats;

    let totalRating = 0;
    let totalNotes = 0;

    prompts.forEach(prompt => {
      totalRating += prompt.userRating || 0;
      totalNotes += (prompt.notes ? prompt.notes.length : 0);

      const model = prompt.metadata?.model || "unknown";
      stats.modelsUsed[model] = (stats.modelsUsed[model] || 0) + 1;
    });

    stats.averageRating = prompts.length > 0
      ? (totalRating / prompts.length).toFixed(1)
      : 0;
    stats.totalNotes = totalNotes;

    const modelCounts = Object.entries(stats.modelsUsed);
    if (modelCounts.length > 0) {
      stats.mostUsedModel = modelCounts.reduce((a, b) =>
        b[1] > a[1] ? b : a
      )[0];
    }

    return stats;
  }

  function validatePromptStructure(prompt) {
    const errors = [];

    if (!prompt.id || typeof prompt.id !== "string") {
      errors.push("Missing or invalid id");
    }
    if (!prompt.title || typeof prompt.title !== "string") {
      errors.push("Missing or invalid title");
    }
    if (!prompt.content || typeof prompt.content !== "string") {
      errors.push("Missing or invalid content");
    }
    if (prompt.userRating !== undefined &&
        (typeof prompt.userRating !== "number" ||
         prompt.userRating < 0 || prompt.userRating > 5)) {
      errors.push("Invalid userRating (must be 0-5)");
    }
    if (prompt.notes !== undefined && !Array.isArray(prompt.notes)) {
      errors.push("Notes must be an array");
    }
    if (prompt.metadata !== undefined && typeof prompt.metadata !== "object") {
      errors.push("Metadata must be an object");
    }

    return errors;
  }

  function validateExportStructure(data) {
    const errors = [];

    if (!data || typeof data !== "object") {
      errors.push("Invalid data structure");
      return errors;
    }

    if (!data.version || typeof data.version !== "string") {
      errors.push("Missing or invalid version");
    }

    if (!data.exportedAt || typeof data.exportedAt !== "string") {
      errors.push("Missing or invalid export timestamp");
    }

    if (!Array.isArray(data.prompts)) {
      errors.push("Missing or invalid prompts array");
    } else {
      data.prompts.forEach((prompt, index) => {
        const promptErrors = validatePromptStructure(prompt);
        if (promptErrors.length > 0) {
          errors.push(`Prompt ${index + 1}: ${promptErrors.join(", ")}`);
        }
      });
    }

    return errors;
  }

  function createBackup() {
    const currentData = localStorage.getItem(STORAGE_KEY);
    if (currentData) {
      const backup = {
        timestamp: new Date().toISOString(),
        data: currentData
      };
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
      return true;
    }
    return false;
  }

  function restoreBackup() {
    const backupRaw = localStorage.getItem(BACKUP_KEY);
    if (backupRaw) {
      try {
        const backup = JSON.parse(backupRaw);
        localStorage.setItem(STORAGE_KEY, backup.data);
        localStorage.removeItem(BACKUP_KEY);
        return true;
      } catch (e) {
        console.error("Failed to restore backup:", e);
        return false;
      }
    }
    return false;
  }

  function clearBackup() {
    localStorage.removeItem(BACKUP_KEY);
  }

  function exportPrompts() {
    const prompts = getPrompts();
    const stats = calculateStatistics(prompts);

    const exportData = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      statistics: stats,
      prompts: prompts
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `prompt-library-export-${timestamp}.json`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      filename,
      stats
    };
  }

  function parseImportFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error("Failed to parse JSON file. Please ensure it's a valid JSON file."));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file. Please try again."));
      };

      reader.readAsText(file);
    });
  }

  function findDuplicates(importedPrompts, existingPrompts) {
    const existingIds = new Set(existingPrompts.map(p => p.id));
    const duplicates = importedPrompts.filter(p => existingIds.has(p.id));
    const newPrompts = importedPrompts.filter(p => !existingIds.has(p.id));

    return { duplicates, newPrompts };
  }

  function showMergeModal(conflictData) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";

      const modal = document.createElement("div");
      modal.className = "modal";

      const header = document.createElement("div");
      header.className = "modal-header";
      header.innerHTML = "<h3>Import Conflict</h3>";

      const body = document.createElement("div");
      body.className = "modal-body";

      const stats = document.createElement("div");
      stats.className = "conflict-stats";
      stats.innerHTML = `
        <div class="stat-item">
          <span class="stat-value">${conflictData.totalInFile}</span>
          <span class="stat-label">Prompts in file</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${conflictData.duplicates.length}</span>
          <span class="stat-label">Duplicates found</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${conflictData.existingCount}</span>
          <span class="stat-label">Existing prompts</span>
        </div>
      `;

      const message = document.createElement("p");
      message.className = "conflict-message";
      message.textContent = "How would you like to handle the duplicate prompts?";

      const options = document.createElement("div");
      options.className = "merge-options";

      const replaceBtn = document.createElement("button");
      replaceBtn.className = "btn-merge-option";
      replaceBtn.innerHTML = "<strong>Replace All</strong><span>Import file, discard existing</span>";
      replaceBtn.addEventListener("click", () => {
        closeModal();
        resolve("replace");
      });

      const mergeBtn = document.createElement("button");
      mergeBtn.className = "btn-merge-option";
      mergeBtn.innerHTML = "<strong>Keep Both</strong><span>Add file prompts, keep existing</span>";
      mergeBtn.addEventListener("click", () => {
        closeModal();
        resolve("merge");
      });

      const skipBtn = document.createElement("button");
      skipBtn.className = "btn-merge-option";
      skipBtn.innerHTML = "<strong>Skip Duplicates</strong><span>Only import new prompts</span>";
      skipBtn.addEventListener("click", () => {
        closeModal();
        resolve("skip");
      });

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn-cancel";
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", () => {
        closeModal();
        resolve("cancel");
      });

      options.append(replaceBtn, mergeBtn, skipBtn);
      body.append(stats, message, options);

      const conflictList = document.createElement("div");
      conflictList.className = "conflict-list";
      conflictList.innerHTML = "<h4>Duplicate Prompts:</h4>";

      conflictData.duplicates.forEach(dup => {
        const item = document.createElement("div");
        item.className = "conflict-item";
        item.innerHTML = `
          <span class="conflict-title">${escapeHtml(dup.title)}</span>
          <span class="conflict-id">${dup.id.substring(0, 8)}...</span>
        `;
        conflictList.appendChild(item);
      });

      if (conflictData.duplicates.length > 0) {
        body.appendChild(conflictList);
      }

      modal.append(header, body, cancelBtn);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      function closeModal() {
        overlay.classList.add("closing");
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 200);
      }
    });
  }

  function showResultModal(result) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";

      const modal = document.createElement("div");
      modal.className = "modal";

      const header = document.createElement("div");
      header.className = "modal-header";

      const icon = result.success
        ? '<span class="result-icon success">&#10003;</span>'
        : '<span class="result-icon error">&#10007;</span>';
      header.innerHTML = icon + `<h3>${result.title}</h3>`;

      const body = document.createElement("div");
      body.className = "modal-body";

      const message = document.createElement("p");
      message.textContent = result.message;
      body.appendChild(message);

      if (result.details) {
        const details = document.createElement("div");
        details.className = "result-details";
        details.innerHTML = result.details;
        body.appendChild(details);
      }

      const closeBtn = document.createElement("button");
      closeBtn.className = "btn-save";
      closeBtn.textContent = "Close";
      closeBtn.style.marginTop = "16px";
      closeBtn.addEventListener("click", () => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        resolve();
      });

      modal.append(header, body, closeBtn);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    });
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
  }

  async function importPrompts(file) {
    createBackup();

    try {
      const data = await parseImportFile(file);

      const validationErrors = validateExportStructure(data);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid file structure:\n${validationErrors.join("\n")}`);
      }

      const currentVersion = EXPORT_VERSION;
      const fileVersion = data.version;

      if (fileVersion !== currentVersion) {
        console.warn(`Version mismatch: file has ${fileVersion}, expected ${currentVersion}`);
      }

      const existingPrompts = getPrompts();
      const { duplicates, newPrompts } = findDuplicates(data.prompts, existingPrompts);

      const conflictData = {
        totalInFile: data.prompts.length,
        duplicates,
        newPrompts,
        existingCount: existingPrompts.length
      };

      if (duplicates.length > 0) {
        const choice = await showMergeModal(conflictData);

        switch (choice) {
          case "replace":
            savePrompts(data.prompts);
            clearBackup();
            return {
              success: true,
              title: "Import Complete",
              message: `Successfully imported ${data.prompts.length} prompts. Existing prompts were replaced.`,
              details: `
                <div>Imported: ${data.prompts.length}</div>
                <div>Duplicates replaced: ${duplicates.length}</div>
              `
            };

          case "merge":
            const mergedPrompts = [...existingPrompts, ...data.prompts];
            savePrompts(mergedPrompts);
            clearBackup();
            return {
              success: true,
              title: "Import Complete",
              message: "Successfully merged prompts.",
              details: `
                <div>New prompts added: ${data.prompts.length}</div>
                <div>Existing prompts kept: ${existingPrompts.length}</div>
                <div>Total now: ${mergedPrompts.length}</div>
              `
            };

          case "skip":
            const keptPrompts = [...existingPrompts, ...newPrompts];
            savePrompts(keptPrompts);
            clearBackup();
            return {
              success: true,
              title: "Import Complete",
              message: `Imported ${newPrompts.length} new prompts, skipped ${duplicates.length} duplicates.`,
              details: `
                <div>New prompts added: ${newPrompts.length}</div>
                <div>Duplicates skipped: ${duplicates.length}</div>
              `
            };

          case "cancel":
            restoreBackup();
            return {
              success: false,
              title: "Import Cancelled",
              message: "No changes were made to your prompts."
            };
        }
      } else {
        const allPrompts = [...existingPrompts, ...data.prompts];
        savePrompts(allPrompts);
        clearBackup();
        return {
          success: true,
          title: "Import Complete",
          message: `Successfully imported ${data.prompts.length} prompts.`,
          details: `
            <div>New prompts added: ${data.prompts.length}</div>
            <div>Existing prompts kept: ${existingPrompts.length}</div>
            <div>Total now: ${allPrompts.length}</div>
          `
        };
      }
    } catch (error) {
      restoreBackup();
      return {
        success: false,
        title: "Import Failed",
        message: error.message,
        details: "Your existing data has been restored."
      };
    }
  }

  function setupExportButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener("click", async () => {
        try {
          const prompts = getPrompts();
          if (prompts.length === 0) {
            await showResultModal({
              success: false,
              title: "No Prompts",
              message: "There are no prompts to export."
            });
            return;
          }

          const result = exportPrompts();
          await showResultModal({
            success: true,
            title: "Export Complete",
            message: `Exported ${result.stats.totalPrompts} prompts to ${result.filename}`,
            details: `
              <div>Total prompts: ${result.stats.totalPrompts}</div>
              <div>Average rating: ${result.stats.averageRating}/5</div>
              <div>Most used model: ${result.stats.mostUsedModel}</div>
            `
          });
        } catch (error) {
          await showResultModal({
            success: false,
            title: "Export Failed",
            message: error.message
          });
        }
      });
    }
  }

  function setupImportButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (file) {
            const result = await importPrompts(file);
            await showResultModal(result);
            if (result.success && typeof renderPrompts === "function") {
              renderPrompts();
            }
          }
        });
        input.click();
      });
    }
  }

  return {
    exportPrompts,
    importPrompts,
    setupExportButton,
    setupImportButton,
    showResultModal,
    calculateStatistics
  };
})();

if (typeof window !== "undefined") {
  window.ExportImportManager = ExportImportManager;
}
