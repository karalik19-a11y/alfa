(() => {
  // Второй слой защиты профиля: если app.js по какой-то причине ещё не подхватил
  // аккаунт Telegram (скрипт telegram-web-app.js грузится по сети и может опоздать),
  // этот файл дописывает имя/username/аватар в уже отрисованный DOM.
  // Работает постоянно (раз в секунду), а не первые 10 секунд, поэтому аккаунт
  // виден всегда — на любом экране и после любых переходов.
  const clean = (value = '') => String(value).replace(/[&<>'"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' })[c]);

  function rawPhotoUrl(url) {
    try {
      const parsed = new URL(String(url || ''));
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
    } catch { return ''; }
  }

  function getUser() {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!user) return null;
    return {
      id: user.id || '',
      firstName: user.first_name || 'Пользователь',
      lastName: user.last_name || '',
      username: user.username
        ? `@${String(user.username).replace(/^@/, '')}`
        : (user.id ? `ID ${user.id}` : '@username'),
      photoUrl: rawPhotoUrl(user.photo_url || ''),
    };
  }

  function initials(user) {
    return [user.firstName, user.lastName].filter(Boolean).map((x) => x.trim()[0]).join('').slice(0, 2).toUpperCase() || 'A';
  }

  function setText(el, value) {
    if (el && el.textContent !== value) el.textContent = value;
  }

  function syncAvatar(el, user) {
    if (!el) return;
    const img = el.querySelector('img');
    if (user.photoUrl) {
      if (img && img.getAttribute('src') === user.photoUrl) return;
      el.innerHTML = `<img src="${clean(user.photoUrl)}" alt="" />`;
    } else {
      const want = initials(user);
      if (!img && el.textContent === want) return;
      el.textContent = want;
    }
  }

  function apply() {
    // Основной путь: просим сам app.js обновить профиль (единый источник правды).
    try {
      if (window.__alfaTasks && typeof window.__alfaTasks.refresh === 'function') {
        window.__alfaTasks.refresh();
        return true;
      }
    } catch {}
    // Запасной путь: точечно правим DOM, не трогая остальное.
    const user = getUser();
    if (!user) return false;
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Пользователь';
    setText(document.querySelector('.header-profile-name'), displayName);
    setText(document.querySelector('.profile-card .profile-card-copy h2'), displayName);
    setText(document.querySelector('.profile-card .profile-card-copy p'), user.username);
    setText(document.querySelector('.profile-card .profile-label'), 'Профиль Telegram');
    syncAvatar(document.querySelector('.header-profile-button .avatar'), user);
    syncAvatar(document.querySelector('.profile-card .avatar'), user);
    return true;
  }

  function start() {
    try { window.Telegram?.WebApp?.ready?.(); window.Telegram?.WebApp?.expand?.(); } catch {}
    apply();
    // Постоянный лёгкий вотчер: подхватывает аккаунт, даже если скрипт Telegram
    // загрузился через минуту после старта, и чинит DOM после любого перехода.
    // Записи идут только при расхождении — лишних перерисовок и «фризов» нет.
    window.setInterval(apply, 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { try { apply(); } catch {} } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
