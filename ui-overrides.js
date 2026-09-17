const feedbackIcon = `
  <svg class="reviews-feedback-icon" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4.5 4v-4.2A2.5 2.5 0 0 1 5 12.5v-6Z"/>
    <path d="M8.5 9.5h7M8.5 12h4.5"/>
  </svg>`;

function applyUiOverrides() {
  const root = document.querySelector('#app');
  if (!root) return;

  const reviewsIcon = root.querySelector('[data-action="open-reviews"] .task-icon');
  if (reviewsIcon && !reviewsIcon.dataset.feedbackIconApplied) {
    reviewsIcon.innerHTML = feedbackIcon;
    reviewsIcon.dataset.feedbackIconApplied = 'true';
  }

  const intro = root.querySelector('.info-card');
  if (intro && root.querySelector('.detail-topbar .eyebrow')?.textContent.trim() === 'Задание 01') {
    const paragraphs = intro.querySelectorAll(':scope > p');
    if (paragraphs[0]) {
      paragraphs[0].textContent = 'Оцени качество курьерской службы, а также процесс оформления фирменных продуктов Альфа-банка и получи награду! Вместе мы сможем повысить качество сервиса ❤️';
    }

    const note = intro.querySelector('.info-note span');
    if (note) {
      note.textContent = 'Здесь появится подробное объяснение задания. Позже ты сможешь добавить сюда правила, условия участия и всё, что важно знать перед стартом.';
    }
  }

  // Keep the public-facing product name clean: only “tasks” beside the A mark.
  root.querySelectorAll('.brand-name').forEach((node) => {
    node.remove();
  });
}

const observer = new MutationObserver(() => applyUiOverrides());
observer.observe(document.documentElement, { childList: true, subtree: true });
applyUiOverrides();
