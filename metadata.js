const MetadataTracker = (function() {
  function isValidISO8601(dateString) {
    if (typeof dateString !== 'string') return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.toISOString() === dateString;
  }

  function generateISO8601Timestamp() {
    return new Date().toISOString();
  }

  function estimateTokens(text, isCode = false) {
    if (typeof text !== 'string') {
      throw new Error('Text must be a string for token estimation');
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return { min: 0, max: 0, confidence: 'high' };
    }

    const words = trimmedText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const charCount = trimmedText.length;

    let min = Math.round(0.75 * wordCount);
    let max = Math.round(0.25 * charCount);

    if (isCode) {
      min = Math.round(min * 1.3);
      max = Math.round(max * 1.3);
    }

    let confidence;
    const avgTokens = (min + max) / 2;
    if (avgTokens < 1000) {
      confidence = 'high';
    } else if (avgTokens <= 5000) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return { min, max, confidence };
  }

  function trackModel(modelName, content) {
    try {
      if (typeof modelName !== 'string' || modelName.trim().length === 0) {
        throw new Error('Model name must be a non-empty string');
      }

      if (modelName.length > 100) {
        throw new Error('Model name must not exceed 100 characters');
      }

      if (typeof content !== 'string') {
        throw new Error('Content must be a string');
      }

      const createdAt = generateISO8601Timestamp();
      const tokenEstimate = estimateTokens(content, false);

      return {
        model: modelName.trim(),
        createdAt,
        updatedAt: createdAt,
        tokenEstimate
      };
    } catch (error) {
      throw new Error(`Failed to track model: ${error.message}`);
    }
  }

  function updateTimestamps(metadata) {
    try {
      if (!metadata || typeof metadata !== 'object') {
        throw new Error('Metadata must be a valid object');
      }

      if (!metadata.createdAt || !isValidISO8601(metadata.createdAt)) {
        throw new Error('Invalid createdAt timestamp. Must be valid ISO 8601 format');
      }

      const updatedAt = generateISO8601Timestamp();
      const createdDate = new Date(metadata.createdAt);
      const updatedDate = new Date(updatedAt);

      if (updatedDate < createdDate) {
        throw new Error('updatedAt must be greater than or equal to createdAt');
      }

      return {
        ...metadata,
        updatedAt
      };
    } catch (error) {
      throw new Error(`Failed to update timestamps: ${error.message}`);
    }
  }

  function formatRelativeTime(isoString) {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return 'unknown';
    }
  }

  function getConfidenceColor(confidence) {
    const colors = {
      high: 'var(--confidence-high, #22c55e)',
      medium: 'var(--confidence-medium, #eab308)',
      low: 'var(--confidence-low, #ef4444)'
    };
    return colors[confidence] || colors.medium;
  }

  function renderMetadataSection(metadata) {
    if (!metadata) return null;

    const section = document.createElement('div');
    section.className = 'metadata-section';

    const modelLine = document.createElement('div');
    modelLine.className = 'metadata-line';
    modelLine.innerHTML = `<span class="metadata-label">Model:</span> <span class="metadata-value">${escapeHtml(metadata.model)}</span>`;

    const createdLine = document.createElement('div');
    createdLine.className = 'metadata-line';
    createdLine.innerHTML = `<span class="metadata-label">Created:</span> <span class="metadata-value" title="${metadata.createdAt}">${formatRelativeTime(metadata.createdAt)}</span>`;

    const updatedLine = document.createElement('div');
    updatedLine.className = 'metadata-line';
    updatedLine.innerHTML = `<span class="metadata-label">Updated:</span> <span class="metadata-value" title="${metadata.updatedAt}">${formatRelativeTime(metadata.updatedAt)}</span>`;

    const tokenLine = document.createElement('div');
    tokenLine.className = 'metadata-line token-estimate';
    const tokenColor = getConfidenceColor(metadata.tokenEstimate.confidence);
    tokenLine.innerHTML = `<span class="metadata-label">Tokens:</span> <span class="metadata-value token-range">${metadata.tokenEstimate.min}-${metadata.tokenEstimate.max}</span> <span class="confidence-badge" style="background-color: ${tokenColor}">${metadata.tokenEstimate.confidence}</span>`;

    section.append(modelLine, createdLine, updatedLine, tokenLine);
    return section;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function sortMetadataByCreatedAt(items, descending = true) {
    return items.sort((a, b) => {
      const dateA = new Date(a.metadata?.createdAt || 0);
      const dateB = new Date(b.metadata?.createdAt || 0);
      return descending ? dateB - dateA : dateA - dateB;
    });
  }

  return {
    trackModel,
    updateTimestamps,
    estimateTokens,
    renderMetadataSection,
    sortMetadataByCreatedAt,
    formatRelativeTime,
    getConfidenceColor,
    isValidISO8601,
    generateISO8601Timestamp
  };
})();

if (typeof window !== 'undefined') {
  window.MetadataTracker = MetadataTracker;
}