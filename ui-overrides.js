(() => {
  const app = document.querySelector('#app');
  if (!app) return;

  const reviewIcon = `
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v4A3.5 3.5 0 0 1 15.5 14H11l-4.5 3v-3.2A3.5 3.5 0 0 1 5 10.5v-4Z"/>
      <path d="M9 8.5h6M9 11h4"/>
    </svg>`;

  const style = document.createElement('style');
  style.textContent = `
    .reward-option { position: relative; overflow: hidden; }
    .reward-option[data-reward="large"] { border-color: rgba(240,24,40,.22); }
    .reward-option[data-reward="large"]::after {
      content: '18+';
      position: absolute;
      top: 12px;
      right: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 38px;
      height: 24px;
      padding: 0 8px;
      border-radius: 999px;
      color: #fff;
      background: #161313;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .04em;
    }
    .age-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: grid;
      place-items: center;
      padding: 20px;
      background: rgba(22,19,19,.46);
      backdrop-filter: blur(8px);
    }
    .age-modal {
      width: min(100%, 430px);
      padding: 25px;
      border: 1px solid rgba(240,24,40,.14);
      border-radius: 26px;
      background: #fff;
      box-shadow: 0 28px 80px rgba(22,19,19,.24);
      animation: age-modal-in 220ms cubic-bezier(.22,1,.36,1) both;
    }
    .age-modal-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 44px;
      height: 30px;
      padding: 0 10px;
      border-radius: 999px;
      color: #fff;
      background: #161313;
      font-size: 12px;
      font-weight: 800;
    }
    .age-modal h2 { margin: 17px 0 8px; font-size: 25px; letter-spacing: -.045em; }
    .age-modal p { margin: 0; color: #847878; font-size: 14px; line-height: 1.6; }
    .age-modal-actions { display: grid; gap: 9px; margin-top: 22px; }
    .age-modal-denied { margin-top: 16px !important; color: #d90d1d !important; font-weight: 700; }
    @keyframes age-modal-in { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `;
  document.head.appendChild(style);

  function refreshReviewsUI() {
    const reviewCard = [...app.querySelectorAll('.task-card')].find((el) => el.textContent.includes('Отзывы'));
    const reviewIconHost = reviewCard?.querySelector('.task-icon');
    if (reviewIconHost && !reviewIconHost.dataset.reviewIconApplied) {
      reviewIconHost.innerHTML = reviewIcon;
      reviewIconHost.dataset.reviewIconApplied = '1';
    }

    const hero = app.querySelector('.detail-hero');
    if (hero?.textContent.includes('Отзывы')) {
      const heroIcon = hero.querySelector('.detail-hero-icon');
      if (heroIcon && !heroIcon.dataset.reviewIconApplied) {
        heroIcon.innerHTML = reviewIcon.replaceAll('width="25" height="25"', 'width="30" height="30"');
        heroIcon.dataset.reviewIconApplied = '1';
      }
    }

    app.querySelectorAll('.active-task-card').forEach((card) => {
      if (card.textContent.includes('Отзывы')) {
        const host = card.querySelector('.active-task-icon');
        if (host && !host.dataset.reviewIconApplied) {
          host.innerHTML = reviewIcon.replaceAll('width="25" height="25"', 'width="20" height="20"');
          host.dataset.reviewIconApplied = '1';
        }
      }
    });

    app.querySelectorAll('.reward-option').forEach((option) => {
      const reward = option.dataset.reward;
      const small = option.querySelector('.reward-option-copy small');
      if (!small) return;
      if (reward === 'small') small.textContent = 'Более доступный';
      if (reward === 'large') small.textContent = 'Менее доступный';
    });
  }

  function closeAgeModal() {
    document.querySelector('.age-modal-backdrop')?.remove();
  }

  function showAgeModal(target) {
    closeAgeModal();
    const backdrop = document.createElement('div');
    backdrop.className = 'age-modal-backdrop';
    backdrop.innerHTML = `
      <div class="age-modal" role="dialog" aria-modal="true" aria-labelledby="age-title">
        <span class="age-modal-badge">18+</span>
        <h2 id="age-title">Вам уже исполнилось 18 лет?</h2>
        <p>Менее доступный вариант доступен только совершеннолетним участникам.</p>
        <div class="age-modal-actions">
          <button class="button button-full" type="button" data-age-confirm="yes">Да, мне 18+</button>
          <button class="button button-outline button-full" type="button" data-age-confirm="no">Нет</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);

    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) closeAgeModal();
      const choice = event.target.closest('[data-age-confirm]');
      if (!choice) return;
      if (choice.dataset.ageConfirm === 'yes') {
        closeAgeModal();
        target.dataset.ageApproved = 'true';
        target.click();
        delete target.dataset.ageApproved;
      } else {
        const modal = backdrop.querySelector('.age-modal');
        const old = modal.querySelector('.age-modal-denied');
        if (!old) {
          const message = document.createElement('p');
          message.className = 'age-modal-denied';
          message.textContent = 'Этот вариант доступен только с 18 лет.';
          modal.appendChild(message);
        }
      }
    });
  }

  const observer = new MutationObserver(() => refreshReviewsUI());
  observer.observe(app, { childList: true, subtree: true });
  refreshReviewsUI();

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action="choose-reward"][data-reward="large"]');
    if (!target || target.dataset.ageApproved === 'true') return;
    event.preventDefault();
    event.stopPropagation();
    showAgeModal(target);
  }, true);
})();
