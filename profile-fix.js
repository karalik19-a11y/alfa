(() => {
  const clean = (value = '') => String(value).replace(/[&<>'"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' })[c]);

  function getUser() {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!user) return null;
    return {
      firstName: user.first_name || 'Пользователь',
      lastName: user.last_name || '',
      username: user.username ? `@${String(user.username).replace(/^@/, '')}` : '@username',
      photoUrl: user.photo_url || '',
    };
  }

  function initials(user) {
    return [user.firstName, user.lastName].filter(Boolean).map((x) => x.trim()[0]).join('').slice(0, 2).toUpperCase() || 'A';
  }

  function apply() {
    const user = getUser();
    if (!user) return false;

    const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Пользователь';
    const headerName = document.querySelector('.header-profile-name');
    if (headerName) headerName.textContent = displayName;

    const profile = document.querySelector('.profile-card');
    if (profile) {
      const name = profile.querySelector('.profile-card-copy h2');
      const username = profile.querySelector('.profile-card-copy p');
      if (name) name.textContent = displayName;
      if (username) username.textContent = user.username;
      const avatar = profile.querySelector('.avatar');
      if (avatar) {
        if (user.photoUrl) {
          const safe = clean(user.photoUrl);
          avatar.innerHTML = `<img src="${safe}" alt="" />`;
        } else {
          avatar.textContent = initials(user);
        }
      }
    }

    const headerAvatar = document.querySelector('.header-profile-button .avatar');
    if (headerAvatar) {
      if (user.photoUrl) {
        const safe = clean(user.photoUrl);
        headerAvatar.innerHTML = `<img src="${safe}" alt="" />`;
      } else {
        headerAvatar.textContent = initials(user);
      }
    }
    return true;
  }

  function start() {
    try { window.Telegram?.WebApp?.ready?.(); window.Telegram?.WebApp?.expand?.(); } catch {}
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      apply();
      if (attempts >= 40) window.clearInterval(timer);
    }, 250);
    apply();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
