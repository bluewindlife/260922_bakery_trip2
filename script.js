(() => {
  'use strict';

  const VISIT_KEY = 'aichi-bakery-trip-20260922-visits-v2';
  const CHECKLIST_KEY = 'aichi-bakery-trip-20260922-checklist-v2';

  const visitInputs = Array.from(document.querySelectorAll('[data-visit]'));
  const checklistInputs = Array.from(document.querySelectorAll('.checklist input[type="checkbox"]'));
  const progressCount = document.querySelector('#progress-count');
  const progressFill = document.querySelector('#progress-fill');
  const nextStop = document.querySelector('#next-stop');
  const resetButton = document.querySelector('#reset-progress');

  const readStoredArray = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  const writeStoredArray = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The itinerary remains fully usable when storage is unavailable.
    }
  };

  const savedVisits = new Set(readStoredArray(VISIT_KEY));
  visitInputs.forEach((input) => {
    input.checked = savedVisits.has(input.dataset.visit);
  });

  const savedChecklist = new Set(readStoredArray(CHECKLIST_KEY).map(String));
  checklistInputs.forEach((input, index) => {
    input.checked = savedChecklist.has(String(index));
  });

  const updateVisitProgress = () => {
    const completed = visitInputs.filter((input) => input.checked);
    const total = visitInputs.length;
    const percentage = total ? Math.round((completed.length / total) * 100) : 0;

    if (progressCount) {
      progressCount.textContent = `${completed.length} / ${total}`;
    }
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    document.querySelectorAll('[data-stop-card]').forEach((item) => {
      item.classList.remove('is-current', 'is-complete');
      item.removeAttribute('aria-current');
      const input = item.querySelector('[data-visit]');
      if (input?.checked) item.classList.add('is-complete');
    });

    const next = visitInputs.find((input) => !input.checked);
    if (next) {
      if (nextStop) nextStop.textContent = `次は ${next.dataset.label}`;
      const nextCard = next.closest('[data-stop-card]');
      nextCard?.classList.add('is-current');
      nextCard?.setAttribute('aria-current', 'step');
    } else if (nextStop) {
      nextStop.textContent = `本命${total}店 完了！`;
    }

    writeStoredArray(VISIT_KEY, completed.map((input) => input.dataset.visit));
  };

  visitInputs.forEach((input) => {
    input.addEventListener('change', updateVisitProgress);
  });

  checklistInputs.forEach((input) => {
    input.addEventListener('change', () => {
      const checked = checklistInputs
        .map((item, index) => (item.checked ? String(index) : null))
        .filter((value) => value !== null);
      writeStoredArray(CHECKLIST_KEY, checked);
    });
  });

  resetButton?.addEventListener('click', () => {
    if (!window.confirm(`本命${visitInputs.length}店の訪問進捗をリセットしますか？`)) return;
    visitInputs.forEach((input) => {
      input.checked = false;
    });
    updateVisitProgress();
  });

  const cleanEmptyGallery = (gallery) => {
    if (gallery && !gallery.querySelector('figure')) gallery.remove();
  };

  const removeBrokenFigure = (image) => {
    const figure = image.closest('figure');
    const gallery = figure?.closest('.gallery');
    if (figure) figure.remove();
    cleanEmptyGallery(gallery);
  };

  // Images are authored once in HTML. JavaScript only removes duplicate or failed figures.
  const seenImageUrls = new Set();
  document.querySelectorAll('figure img').forEach((image) => {
    let normalizedUrl = image.getAttribute('src') || '';
    try {
      normalizedUrl = new URL(normalizedUrl, window.location.href).href;
    } catch {
      // Keep the original string when URL parsing fails.
    }

    if (seenImageUrls.has(normalizedUrl)) {
      removeBrokenFigure(image);
      return;
    }
    seenImageUrls.add(normalizedUrl);

    image.addEventListener('error', () => removeBrokenFigure(image), { once: true });
    if (image.complete && image.naturalWidth === 0) removeBrokenFigure(image);
  });

  updateVisitProgress();
})();
