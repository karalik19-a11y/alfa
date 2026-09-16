const ACCESS_KEY = 'alfaTasks.accessGranted';
const ACTIVE_TASKS_KEY = 'alfaTasks.activeTasks';

const rewards = {
  small: {
    id: 'small',
    label: 'до 2 000 ₽',
    caption: 'Базовый сценарий',
    link: 'https://alfa.me/dx3_ke',
  },
  large: {
    id: 'large',
    label: 'до 4 000 ₽',
    caption: 'Расширенный сценарий',
    link: 'https://alfa.me/oUT1ol',
  },
};

const iconPaths = {
  shield: '<path d="M12 3.5 19 6v5.2c0 4.4-2.7 7.5-7 9.3-4.3-1.8-7-4.9-7-9.3V6l7-2.5Z"/><path d="m8.6 12 2.2 2.2 4.6-4.7"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
  arrowUpRight: '<path d="M5 19 19 5"/><path d="M9 5h10v10"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/><path d="M12 14v2"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  quote: '<path d="M8.5 7H6.8A2.8 2.8 0 0 0 4 9.8v2.4A2.8 2.8 0 0 0 6.8 15h.4A2.8 2.8 0 0 0 10 12.2V9.7A2.7 2.7 0 0 0 7.3 7Z"/><path d="M16.5 7h-1.7a2.8 2.8 0 0 0-2.8 2.8v2.4a2.8 2.8 0 0 0 2.8 2.8h.4a2.8 2.8 0 0 0 2.8-2.8V9.7A2.7 2.7 0 0 0 15.3 7Z"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1.2"/><rect x="14" y="4" width="6" height="6" rx="1.2"/><rect x="4" y="14" width="6" height="6" rx="1.2"/><rect x="14" y="14" width="6" height="6" rx="1.2"/>',
  user: '<circle cx="12" cy="8" r="3.3"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
  check: '<path d="m5 12 4.2 4.2L19 6.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11.2v5"/><path d="M12 8h.01"/>',
  spark: '<path d="m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3Z"/><path d="m19 16 .5 2.5L22 19l-2.5.5L19 22l-.5-2.5L16 19l2.5-.5L19 16Z"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"/><path d="M4 8h15"/><path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z"/><path d="M17.5 14h.01"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  link: '<path d="M10 13.8 8.4 15.4a3.2 3.2 0 0 1-4.6-4.6l2.7-2.7a3.2 3.2 0 0 1 4.6 0"/><path d="m14 10.2 1.6-1.6a3.2 3.2 0 0 1 4.6 4.6l-2.7 2.7a3.2 3.2 0 0 1-4.6 0"/><path d="m8.5 12.5 7-5"/>',
};

function icon(name, size = 20, className = '') {
  return `<svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || ''}</svg>`;
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#039;',
    '"': '&quot;',
  })[character]);
}

function getTelegramUser() {
  const fallback = {
    firstName: 'Гость',
    lastName: '',
    username: 'telegram_user',
    photoUrl: '',
    isTelegram: false,
  };

  try {
    const telegram = window.Telegram?.WebApp;
    telegram?.ready?.();
    telegram?.expand?.();
    const user = telegram?.initDataUnsafe?.user;

    if (!user) return fallback;

    return {
      firstName: user.first_name || 'Пользователь',
      lastName: user.last_name || '',
      username: user.username || '',
      photoUrl: user.photo_url || '',
      isTelegram: true,
    };
  } catch {
    return fallback;
  }
}

function getDisplayName(user) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Пользователь';
}

function getUsername(user) {
  return user.username ? `@${user.username.replace(/^@/, '')}` : '@username';
}

function getInitials(user) {
  const letters = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((part) => part.trim().charAt(0))
    .join('');
  return (letters || 'A').slice(0, 2).toUpperCase();
}

function safePhotoUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? escapeHTML(parsed.href) : '';
  } catch {
    return '';
  }
}

function avatarMarkup(user, size = '') {
  const photo = safePhotoUrl(user.photoUrl);
  const className = `avatar${size ? ` ${size}` : ''}`;
  return `<span class="${className}">${photo ? `<img src="${photo}" alt="" />` : escapeHTML(getInitials(user))}</span>`;
}

function loadActiveTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(ACTIVE_TASKS_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveActiveTasks(tasks) {
  try {
    localStorage.setItem(ACTIVE_TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // Storage can be unavailable in a private Telegram WebView; the UI still works for this session.
  }
}

function formatDate(timestamp) {
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(timestamp));
  } catch {
    return 'сегодня';
  }
}

const user = getTelegramUser();
const state = {
  mode: localStorage.getItem(ACCESS_KEY) === 'true' ? 'app' : 'gate',
  view: 'tasks',
  selectedReward: null,
  activeTasks: loadActiveTasks(),
};

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
let toastTimer;

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 3200);
}

function persistAccess() {
  try {
    localStorage.setItem(ACCESS_KEY, 'true');
  } catch {
    // Continue without persistence when storage is unavailable.
  }
}

function avatarButton() {
  return `<button class="header-profile-button" type="button" data-action="nav-account" aria-label="Открыть личный кабинет">
    <span class="header-profile-name">${escapeHTML(user.firstName)}</span>
    ${avatarMarkup(user)}
  </button>`;
}

function renderGate() {
  return `<div class="gate-screen">
    <div class="gate-top">
      <div class="brand-lockup">
        <span class="brand-mark">А</span>
        <span class="brand-text"><strong class="brand-service">tasks</strong></span>
        <span class="mini-pill">MINI APP</span>
      </div>
    </div>

    <main class="gate-main">
      <div class="gate-kicker">Задания с наградой</div>
      <h1 class="gate-title">Твой следующий<br /><em>шаг — здесь.</em></h1>
      <p class="gate-description">Выполняй простые задания, выбирай свой уровень и получай вознаграждение. Начнём с одного вопроса.</p>

      <section class="gate-card" aria-labelledby="eligibility-question">
        <div class="gate-card-label"><span>Проверка участия</span><strong>01 / 01</strong></div>
        <h2 class="gate-question" id="eligibility-question">Вы когда-нибудь были клиентом Альфа-Банка?</h2>
        <div class="gate-actions">
          <button class="button button-dark button-full" type="button" data-action="eligible-yes">Да, являюсь или являлся(ась)</button>
          <button class="button button-outline button-full" type="button" data-action="eligible-no">Нет, не являюсь</button>
        </div>
      </section>
    </main>

    <div class="gate-footer">
      ${icon('shield', 17)}
      <span>Ответ нужен только для проверки условий участия</span>
    </div>
  </div>`;
}

function renderRejected() {
  return `<div class="rejected-screen">
    <div class="gate-top">
      <div class="brand-lockup">
        <span class="brand-mark">А</span>
        <span class="brand-text"><strong class="brand-service">tasks</strong></span>
      </div>
    </div>

    <main class="rejected-content">
      <div class="rejected-icon">${icon('shield', 38)}</div>
      <h1 class="rejected-title">Участие пока недоступно</h1>
      <p class="rejected-description">К сожалению, в этой активности могут участвовать только люди, которые никогда не были клиентами Альфа-Банка.</p>
      <button class="button button-dark" type="button" data-action="back-to-gate">Вернуться к ответу</button>
    </main>

    <div class="gate-footer">
      ${icon('info', 17)}
      <span>Если ответ был выбран случайно, его можно изменить</span>
    </div>
  </div>`;
}

function renderAppHeader() {
  return `<header class="app-header">
    <div class="header-brand"><span class="brand-mark">А</span><span class="brand-text"><strong class="brand-service">tasks</strong></span></div>
    ${avatarButton()}
  </header>`;
}

function renderTaskHome() {
  return `<section class="view-enter" aria-labelledby="tasks-heading">
    <div class="welcome-row">
      <div>
        <div class="eyebrow">Твоя подборка</div>
        <h1 class="view-heading" id="tasks-heading">Задания<br />с наградой</h1>
      </div>
      <span class="status-pill">Онлайн</span>
    </div>

    <div class="balance-card">
      <div class="balance-copy">
        <span class="balance-label">Максимальная награда</span>
        <strong class="balance-amount">до 4 000 ₽</strong>
        <span class="balance-note">Выбери задание и начни<br />сегодня</span>
      </div>
      <div class="balance-orb">${icon('spark', 27)}</div>
    </div>

    <div class="section-heading">
      <h2>Все задания</h2>
      <span>1 доступно · 3 скоро</span>
    </div>

    <div class="task-list">
      <button class="task-card" type="button" data-action="open-reviews" aria-label="Открыть задание Отзывы">
        <div class="task-card-main">
          <span class="task-icon">${icon('quote', 25)}</span>
          <span class="task-card-copy">
            <span class="task-meta"><span>Доступно сейчас</span><span>${icon('arrowUpRight', 13)}</span></span>
            <span class="task-card-bottomless"><strong class="task-card-title">Отзывы</strong><span class="task-card-description">Оцени качество курьерской службы, а также процесс оформления фирменных продуктов Альфа-банка и получи награду! Вместе мы сможем повысить качество сервиса ❤️</span></span>
          </span>
        </div>
        <div class="task-card-bottom"><span>Простое задание</span><span class="arrow">Открыть ${icon('arrowRight', 13)}</span></div>
      </button>

      <div class="locked-grid">
        <div class="locked-card task-card locked">
          <span class="task-icon dark">${icon('grid', 19)}</span>
          <h3>Опрос</h3>
          <p>Поделись своим мнением</p>
          <span class="coming-soon">${icon('lock', 12)} Coming soon</span>
        </div>
        <div class="locked-card task-card locked">
          <span class="task-icon dark">${icon('wallet', 19)}</span>
          <h3>Финансы</h3>
          <p>Полезные сценарии</p>
          <span class="coming-soon">${icon('lock', 12)} Coming soon</span>
        </div>
        <div class="locked-card task-card locked">
          <span class="task-icon dark">${icon('user', 19)}</span>
          <h3>Пригласи друга</h3>
          <p>Скоро в приложении</p>
          <span class="coming-soon">${icon('lock', 12)} Coming soon</span>
        </div>
      </div>
    </div>
  </section>`;
}

function renderDetailTopbar(label = 'Задание') {
  return `<div class="detail-topbar">
    <button class="icon-button" type="button" data-action="back-to-tasks" aria-label="Назад к заданиям">${icon('arrowLeft', 19)}</button>
    <div class="eyebrow">${escapeHTML(label)}</div>
  </div>`;
}

function renderIntro() {
  return `<section class="view-enter">
    ${renderDetailTopbar('Задание 01')}
    <div class="detail-hero">
      <div class="detail-hero-content">
        <div class="eyebrow">Доступно сейчас</div>
        <h1>Отзывы</h1>
        <p>Один шаг, чтобы поделиться своим опытом и получить награду.</p>
      </div>
      <div class="detail-hero-icon">${icon('quote', 30)}</div>
    </div>

    <div class="info-card">
      <h2>${icon('info', 19)} Перед началом</h2>
      <p>Здесь появится подробное объяснение задания. Позже ты сможешь добавить сюда правила, условия участия и всё, что важно знать перед стартом.</p>
      <div class="info-note">${icon('spark', 15)}<span>Текст этого блока можно заменить на готовое описание в одном месте — прямо в файле приложения.</span></div>
    </div>

    <div class="detail-actions">
      <button class="button button-full" type="button" data-action="to-rewards">Далее — выбрать награду ${icon('arrowRight', 17)}</button>
    </div>
  </section>`;
}

function renderRewards() {
  return `<section class="view-enter">
    ${renderDetailTopbar('Шаг 02')}
    <div class="reward-intro">
      <div class="eyebrow">Выбор уровня</div>
      <h1 class="view-heading">Какую награду<br />выбираешь?</h1>
      <p class="view-subheading">Выбери подходящий сценарий. После этого откроется инструкция и ссылка на задание.</p>
    </div>

    <div class="reward-list">
      <button class="reward-option" type="button" data-action="choose-reward" data-reward="small">
        <span class="reward-option-copy"><span>Вариант 01</span><strong>до 2 000 ₽</strong><small>Базовый сценарий</small></span>
        <span class="reward-option-mark">${icon('arrowRight', 19)}</span>
      </button>
      <button class="reward-option" type="button" data-action="choose-reward" data-reward="large">
        <span class="reward-option-copy"><span>Вариант 02</span><strong>до 4 000 ₽</strong><small>Расширенный сценарий</small></span>
        <span class="reward-option-mark">${icon('arrowRight', 19)}</span>
      </button>
    </div>
  </section>`;
}

function renderInstructions() {
  const reward = rewards[state.selectedReward] || rewards.small;
  return `<section class="view-enter">
    ${renderDetailTopbar('Шаг 03')}
    <div class="instruction-heading">
      <div class="eyebrow">Пошаговая инструкция</div>
      <h1 class="view-heading">Почти готово<br />к старту.</h1>
      <span class="selected-reward">${icon('wallet', 14)} Твоя награда: ${escapeHTML(reward.label)}</span>
    </div>

    <div class="info-card">
      <h2>${icon('check', 19)} Что нужно сделать</h2>
      <p>Здесь появится пошаговая инструкция. Добавь сюда последовательность действий, сроки и любые дополнительные детали для участника.</p>
      <ol class="step-list">
        <li class="step-item"><span class="step-number">01</span><p>Здесь будет первый шаг задания</p></li>
        <li class="step-item"><span class="step-number">02</span><p>Здесь будет второй шаг задания</p></li>
        <li class="step-item"><span class="step-number">03</span><p>Здесь будет финальный шаг и проверка результата</p></li>
      </ol>
    </div>

    <div class="detail-actions">
      <a class="button button-full" href="${reward.link}" target="_blank" rel="noopener noreferrer" data-action="start-task" data-reward="${reward.id}">Перейти к заданию ${icon('arrowUpRight', 17)}</a>
      <button class="button button-ghost button-full" type="button" data-action="back-to-rewards">Выбрать другой уровень</button>
    </div>
    <div class="external-hint">${icon('link', 13)} Ссылка откроется в новой вкладке</div>
  </section>`;
}

function renderActiveTask(task) {
  const reward = rewards[task.rewardId] || rewards.small;
  return `<article class="active-task-card">
    <div class="active-task-top">
      <span class="active-task-icon">${icon('quote', 20)}</span>
      <div class="active-task-copy">
        <h3>${escapeHTML(task.title || 'Отзывы')}</h3>
        <p>Добавлено ${escapeHTML(formatDate(task.createdAt))}</p>
      </div>
      <span class="task-status">В процессе</span>
    </div>
    <div class="active-task-bottom">
      <span class="active-task-reward">Награда: <strong>${escapeHTML(reward.label)}</strong></span>
      <a class="button button-ghost" href="${reward.link}" target="_blank" rel="noopener noreferrer">Продолжить ${icon('arrowUpRight', 14)}</a>
    </div>
  </article>`;
}

function renderAccount() {
  const displayName = getDisplayName(user);
  const username = getUsername(user);
  const tasks = state.activeTasks;
  const profileLabel = user.isTelegram ? 'Профиль Telegram' : 'Демо-профиль';

  return `<section class="view-enter" aria-labelledby="account-heading">
    <div class="account-heading">
      <div class="eyebrow">Личный кабинет</div>
      <h1 class="view-heading" id="account-heading">Твой профиль</h1>
      <p class="view-subheading">Здесь собраны данные профиля и задания, которые ты уже начал.</p>
    </div>

    <div class="profile-card">
      ${avatarMarkup(user, 'large')}
      <div class="profile-card-copy">
        <span class="profile-label">${profileLabel}</span>
        <h2>${escapeHTML(displayName)}</h2>
        <p>${escapeHTML(username)}</p>
      </div>
    </div>

    <div class="account-section">
      <div class="account-section-heading">
        <h2>Задания в процессе</h2>
        <span class="task-count">${tasks.length}</span>
      </div>
      ${tasks.length ? tasks.map(renderActiveTask).join('') : `<div class="empty-state">
        <div class="empty-state-icon">${icon('clock', 21)}</div>
        <h3>Пока здесь пусто</h3>
        <p>Выбери задание на главной, чтобы оно появилось в этом разделе.</p>
      </div>`}
    </div>

    <div class="account-footnote">${icon('shield', 14)}<span>Данные профиля берутся из Telegram Mini App. В обычном браузере показан демо-профиль.</span></div>
  </section>`;
}

function renderBottomNav() {
  const onAccount = state.view === 'account';
  const tasksCount = state.activeTasks.length;
  return `<nav class="bottom-nav" aria-label="Основная навигация">
    <button class="nav-item${onAccount ? '' : ' active'}" type="button" data-action="nav-tasks" aria-label="Задания">
      ${icon('grid', 20)}<span>Задания</span>${tasksCount ? `<span class="nav-badge">${tasksCount}</span>` : ''}
    </button>
    <button class="nav-item${onAccount ? ' active' : ''}" type="button" data-action="nav-account" aria-label="Личный кабинет">
      ${icon('user', 20)}<span>Кабинет</span>
    </button>
  </nav>`;
}

function renderApp() {
  let content = renderTaskHome();
  if (state.view === 'account') content = renderAccount();
  if (state.view === 'intro') content = renderIntro();
  if (state.view === 'rewards') content = renderRewards();
  if (state.view === 'instructions') content = renderInstructions();

  return `<div class="app-shell">
    ${renderAppHeader()}
    <main class="app-main">${content}</main>
    ${renderBottomNav()}
  </div>`;
}

function render() {
  if (state.mode === 'gate') {
    app.innerHTML = renderGate();
    return;
  }
  if (state.mode === 'rejected') {
    app.innerHTML = renderRejected();
    return;
  }
  app.innerHTML = renderApp();
}

function addTaskToProgress(rewardId) {
  const reward = rewards[rewardId] || rewards.small;
  const taskId = `reviews-${reward.id}`;
  const existing = state.activeTasks.find((task) => task.id === taskId);
  if (!existing) {
    state.activeTasks.unshift({
      id: taskId,
      title: 'Отзывы',
      rewardId: reward.id,
      createdAt: Date.now(),
    });
  }
  saveActiveTasks(state.activeTasks);
  showToast('Задание добавлено в личный кабинет');
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;

  switch (action) {
    case 'eligible-yes':
      state.mode = 'rejected';
      render();
      break;
    case 'eligible-no':
      persistAccess();
      state.mode = 'app';
      state.view = 'tasks';
      render();
      break;
    case 'back-to-gate':
      state.mode = 'gate';
      render();
      break;
    case 'nav-tasks':
      state.mode = 'app';
      state.view = 'tasks';
      render();
      break;
    case 'nav-account':
      state.mode = 'app';
      state.view = 'account';
      render();
      break;
    case 'open-reviews':
      state.view = 'intro';
      render();
      break;
    case 'back-to-tasks':
      state.view = 'tasks';
      render();
      break;
    case 'to-rewards':
      state.view = 'rewards';
      render();
      break;
    case 'back-to-rewards':
      state.view = 'rewards';
      render();
      break;
    case 'choose-reward':
      state.selectedReward = target.dataset.reward || 'small';
      state.view = 'instructions';
      render();
      break;
    case 'start-task':
      addTaskToProgress(target.dataset.reward || state.selectedReward || 'small');
      break;
    default:
      break;
  }
});

render();
