// Смоук-тест интерфейса: поднимает настоящие index.html + app.js + profile-fix.js в jsdom
// и прокликивает все экраны Mini App. Любой сбой = красный тест.
//
// Запуск:  npm test            (нужен jsdom: npm i --no-save jsdom)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let JSDOM, VirtualConsole;
try {
  ({ JSDOM, VirtualConsole } = await import('jsdom'));
} catch {
  console.error('Не найден jsdom. Установите: npm i --no-save jsdom');
  process.exit(2);
}

const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const appJs = readFileSync(join(ROOT, 'app.js'), 'utf8');
const profileFix = readFileSync(join(ROOT, 'profile-fix.js'), 'utf8');

const results = [];
const check = (name, cond, extra = '') => results.push({ name, ok: !!cond, extra });

function boot({ telegram = null, storage = null } = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errors.push(`jsdomError: ${e.message}`));
  vc.on('error', (...a) => errors.push(`console.error: ${a.join(' ')}`));
  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: 'https://alfa-w3ll.onrender.com/',
    virtualConsole: vc,
  });
  const { window } = dom;
  if (telegram) window.Telegram = telegram;
  if (storage) for (const [k, v] of Object.entries(storage)) window.localStorage.setItem(k, v);
  window.eval(appJs);
  window.eval(profileFix);
  const click = (action, reward) => {
    const el = [...window.document.querySelectorAll(`[data-action="${action}"]`)].find(
      (e) => !reward || e.dataset.reward === reward,
    );
    if (!el) return null;
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    return el;
  };
  return { dom, window, doc: window.document, errors, click };
}

// ---------- A: обычный браузер, демо-профиль, полный проход по экранам ----------
{
  const { doc, errors, click, window } = boot();
  check('A1 app.js + profile-fix.js выполняются без ошибок', errors.length === 0, errors.join(' | '));
  check('A2 #app не пустой', doc.querySelector('#app').innerHTML.trim().length > 50, `len=${doc.querySelector('#app').innerHTML.length}`);
  check('A3 показан экран проверки участия', !!doc.querySelector('#app .gate-screen'));

  check('A4 «Да, являюсь» -> экран отказа', click('eligible-yes') && !!doc.querySelector('.rejected-screen'));
  check('A5 отказ: back-to-gate -> гейт', click('back-to-gate') && !!doc.querySelector('.gate-screen'));
  check('A6 «Нет, не являюсь» -> оболочка приложения', click('eligible-no') && !!doc.querySelector('.app-shell'));
  check('A7 экран заданий отрисован', !!doc.querySelector('#tasks-heading'));
  check('A8 нижняя навигация отрисована', !!doc.querySelector('.bottom-nav'));
  check('A9 доступ сохранён', window.localStorage.getItem('alfaTasks.accessGranted') === 'true');

  check('A10 nav-account -> личный кабинет', click('nav-account') && !!doc.querySelector('#account-heading'));
  check('A11 пустое состояние в кабинете', !!doc.querySelector('.empty-state'));
  check('A12 nav-tasks -> экран заданий', click('nav-tasks') && !!doc.querySelector('#tasks-heading'));

  check('A13 open-reviews -> экран 01', click('open-reviews') && !!doc.querySelector('.detail-hero'));
  check('A14 to-rewards -> экран выбора награды', click('to-rewards') && !!doc.querySelector('.reward-intro'));
  const options = [...doc.querySelectorAll('[data-action="choose-reward"]')].filter((e) => e.dataset.reward);
  check('A15 два варианта награды', options.length === 2, `found=${options.length}`);

  check('A16 большая награда -> возрастная проверка', click('choose-reward', 'large') && !!doc.querySelector('.age-gate-view'));
  check('A17 age-yes -> инструкция', click('age-yes') && !!doc.querySelector('.instruction-heading'));
  check('A18 back-step -> возрастная проверка', click('back-step') && !!doc.querySelector('.age-gate-view'));
  check('A19 back-step -> выбор награды', click('back-step') && !!doc.querySelector('.reward-intro'));

  check('A20 малая награда -> инструкция', click('choose-reward', 'small') && !!doc.querySelector('.instruction-heading'));
  check('A21 start-task добавляет задание', !!click('start-task'));
  click('nav-account');
  check('A22 в кабинете появилась карточка задания', !!doc.querySelector('.active-task-card'));
  check('A23 у карточки есть ссылка на награду', !!doc.querySelector('.active-task-card a.button'));
  const badge = doc.querySelector('.nav-badge');
  check('A24 счётчик в навигации = 1', badge?.textContent.trim() === '1', `badge=${badge?.textContent}`);
  const stored = JSON.parse(window.localStorage.getItem('alfaTasks.activeTasks') || '[]');
  check('A25 задание сохранено в localStorage', stored.length === 1, JSON.stringify(stored));
  check('A26 за весь сценарий не было ошибок', errors.length === 0, errors.join(' | '));

  // ---------- B: перезапуск с сохранённым состоянием ----------
  const b = boot({ storage: { 'alfaTasks.accessGranted': 'true', 'alfaTasks.activeTasks': JSON.stringify(stored) } });
  check('B1 повторный вход: гейт пропущен', !!b.doc.querySelector('#app .app-shell') && !b.doc.querySelector('#app .gate-screen'));
  b.click('nav-account');
  check('B2 сохранённое задание отрисовано', !!b.doc.querySelector('.active-task-card'));
  check('B3 без ошибок', b.errors.length === 0, b.errors.join(' | '));

  // ---------- C: профиль из Telegram ----------
  const c = boot({
    telegram: {
      WebApp: {
        ready() {},
        expand() {},
        initDataUnsafe: {
          user: { first_name: 'Иван', last_name: 'Петров', username: 'ivan_p', photo_url: 'https://t.me/i/userpic/320/x.jpg' },
        },
      },
    },
  });
  c.click('eligible-no');
  const headerName = c.doc.querySelector('.header-profile-name')?.textContent;
  check('C1 имя Telegram в шапке', headerName === 'Иван Петров', headerName);
  c.click('nav-account');
  check('C2 имя Telegram в карточке профиля', c.doc.querySelector('.profile-card-copy h2')?.textContent === 'Иван Петров', c.doc.querySelector('.profile-card-copy h2')?.textContent);
  check('C3 @username из Telegram', c.doc.querySelector('.profile-card-copy p')?.textContent === '@ivan_p', c.doc.querySelector('.profile-card-copy p')?.textContent);
  check('C4 аватар из Telegram', c.doc.querySelector('.profile-card .avatar img')?.getAttribute('src') === 'https://t.me/i/userpic/320/x.jpg');
  check('C5 без ошибок с профилем Telegram', c.errors.length === 0, c.errors.join(' | '));

  // ---------- D: злое окружение — localStorage заблокирован ----------
  const d = boot();
  Object.defineProperty(d.window, 'localStorage', {
    configurable: true,
    get() { throw new Error('SecurityError: storage is disabled'); },
  });
  try {
    d.window.eval(appJs);
    check('D1 приложение работает без localStorage', !!d.doc.querySelector('#app .gate-screen'));
  } catch (e) {
    check('D1 приложение работает без localStorage', false, e.message);
  }
}

// ---------- E: страховка от белого экрана (watchdog из index.html) ----------
{
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
  check('E1 в index.html есть watchdog-скрипт', inline.includes('gate-screen') && inline.includes('load'));
  const vc = new VirtualConsole();
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://alfa-w3ll.onrender.com/', virtualConsole: vc });
  dom.window.eval(inline);
  dom.window.dispatchEvent(new dom.window.Event('load'));
  await new Promise((r) => setTimeout(r, 1600));
  const text = dom.window.document.querySelector('#app').textContent;
  check('E2 если приложение не отрисовалось — показывается сообщение', text.includes('не загрузилось'), text.slice(0, 80));
}

// ---------- E2: аварийный экран внутри app.js (renderFatal) ----------
{
  const g = boot();
  check('E3 render() обёрнут в try/catch', /try\{render\(\);\}catch\(error\)\{renderFatal\(error\);\}/.test(appJs));
  check('E4 renderFatal существует в приложении', typeof g.window.renderFatal === 'function', typeof g.window.renderFatal);
  g.window.renderFatal(new Error('тестовая ошибка'));
  const text = g.window.document.querySelector('#app').textContent;
  check('E5 аварийный экран показывает причину и кнопку обновления', text.includes('не загрузилось') && text.includes('тестовая ошибка') && !!g.window.document.querySelector('#app button'), text.slice(0, 90));
}

// ---------- F: целостность index.html ----------
{
  const refs = [...html.matchAll(/(?:src|href)="\/([^"?]+)(?:\?[^"]*)?"/g)].map((m) => m[1]).filter((p) => p !== 'index.html');
  const missing = refs.filter((p) => {
    try { readFileSync(join(ROOT, p)); return false; } catch { return true; }
  });
  check('F1 все локальные файлы из index.html существуют', missing.length === 0, `missing=${missing.join(',')} refs=${refs.join(',')}`);
  const versions = new Set([...html.matchAll(/[?&]v=([\w-]+)/g)].map((m) => m[1]));
  check('F2 версия кэш-бастинга одинаковая у всех ассетов', versions.size === 1, [...versions].join(','));
}

// ---------- G: тексты пошаговой инструкции для двух вариантов ----------
{
  const { doc, click, errors } = boot({ storage: { 'alfaTasks.accessGranted': 'true' } });
  click('open-reviews');
  click('to-rewards');

  click('choose-reward', 'small');
  const debitSteps = [...doc.querySelectorAll('.step-item p')].map((p) => p.textContent.trim());
  check('G1 вариант 01: ровно 5 шагов', debitSteps.length === 5, `len=${debitSteps.length}`);
  check('G2 шаг 1: дебетовая карта по ссылке', debitSteps[0] === 'Оформи дебетовую карту Альфа-Банк по ссылке', debitSteps[0]);
  check('G3 шаг 2: доставка в удобное время', debitSteps[1] === 'Прими доставку продукта в удобное время', debitSteps[1]);
  check('G4 шаг 3: покупка от 1 рубля, переводы не считаются', /от 1 рубля \(переводы не считаются\)$/.test(debitSteps[2] || ''), debitSteps[2]);
  check('G5 шаг 4: отзыв в личном кабинете', /зайди в личный кабинет и напиши отзыв/.test(debitSteps[3] || ''), debitSteps[3]);
  check('G6 шаг 5: 3-4 дня и награда на карту', /В течение 3-4 дней награда поступит на вашу карту$/.test(debitSteps[4] || ''), debitSteps[4]);
  const debitNote = doc.querySelector('.step-note')?.textContent || '';
  check('G7 P.S. про 18 лет есть у варианта 01', debitNote.includes('МЕНЬШЕ 18') && debitNote.includes('РОДИТЕЛЯ'), debitNote.slice(0, 60));
  check('G8 шапка инструкции указывает продукт', /Дебетовая карта/.test(doc.querySelector('.selected-reward')?.textContent || ''));

  click('back-step');
  click('choose-reward', 'large');
  click('age-yes');
  const creditSteps = [...doc.querySelectorAll('.step-item p')].map((p) => p.textContent.trim());
  check('G9 вариант 02: ровно 5 шагов', creditSteps.length === 5, `len=${creditSteps.length}`);
  check('G10 шаг 1: кредитная карта по ссылке', creditSteps[0] === 'Оформи кредитную карту Альфа-Банк по ссылке', creditSteps[0]);
  check('G11 шаг 3 совпадает с вариантом 01', creditSteps[2] === debitSteps[2], creditSteps[2]);
  check('G12 у варианта 02 нет P.S. про 18 лет', !doc.querySelector('.step-note'));
  check('G13 шапка инструкции указывает кредитную карту', /Кредитная карта/.test(doc.querySelector('.selected-reward')?.textContent || ''));
  check('G14 без ошибок на обеих инструкциях', errors.length === 0, errors.join(' | '));
}

// ---------- H: «Выполнил» -> вопрос про карту -> отзыв -> проверка ----------
{
  const reviewText = '<b>Оформил</b> дебетовую карту за пару минут, курьер привёз в удобное время, активировал покупкой на 1 ₽.';
  const { doc, click, window, errors } = boot({
    storage: {
      'alfaTasks.accessGranted': 'true',
      'alfaTasks.activeTasks': JSON.stringify([{ id: 'reviews-small', title: 'Отзывы', rewardId: 'small', createdAt: Date.now(), stage: 'progress' }]),
    },
  });
  click('nav-account');
  check('H1 в карточке задания есть кнопка «Выполнил»', doc.querySelector('[data-action="task-done"]')?.textContent.includes('Выполнил'));

  click('task-done');
  const question = doc.querySelector('.modal-title')?.textContent || '';
  check('H2 появляется вопрос про карту и покупку', /получил карту и совершил с ней покупку/i.test(question), question);
  check('H3 есть варианты «да» и «нет»', !!doc.querySelector('[data-action="done-yes"]') && !!doc.querySelector('[data-action="done-no"]'));

  check('H3a в вопросе назван продукт задания', /оформить дебетовую карту по ссылке/.test(doc.querySelector('.modal-sheet')?.textContent || ''), doc.querySelector('.modal-sheet')?.textContent);
  click('done-no');
  const waitTitle = doc.querySelector('.modal-title')?.textContent || '';
  check('H4 «нет» -> окно «нужно дождаться выполнения условий»', /дождаться выполнения условий/i.test(waitTitle), waitTitle);
  check('H4a в окне ожидания назван продукт', /дебетовая карта оформлена по ссылке/.test(doc.querySelector('.modal-sheet')?.textContent || ''), doc.querySelector('.modal-sheet')?.textContent);
  check('H5 в окне ожидания есть ссылка на оформление', !!doc.querySelector('.modal-sheet a.button[href]'));
  check('H5a в окне ожидания назван продукт и кнопка оформления', /дебетовую карту/.test(doc.querySelector('.modal-sheet')?.textContent || '') && /Оформить дебетовую карту/.test(doc.querySelector('.modal-sheet')?.textContent || ''));
  click('close-modal');
  check('H6 окно закрывается', !doc.querySelector('.modal-overlay'));
  check('H7 после «нет» задание остаётся в процессе', !!doc.querySelector('[data-action="task-done"]'));

  click('task-done');
  click('done-yes');
  const field = doc.querySelector('#review-text');
  check('H8 «да» -> появляется поле для отзыва', !!field && !!doc.querySelector('[data-action="submit-review"]'));

  if (field) field.value = 'Коротко';
  click('submit-review');
  check('H9 слишком короткий отзыв не отправляется', !!doc.querySelector('#review-text') && !/Отзыв проверяется/.test(doc.querySelector('.modal-sheet')?.textContent || ''));

  if (field) field.value = reviewText;
  click('submit-review');
  const thanks = doc.querySelector('.modal-sheet')?.textContent || '';
  check('H10 после отправки окно «Отзыв проверяется»', /Отзыв проверяется/.test(thanks), thanks.slice(0, 70));
  check('H11 в окне текст «Награда скоро будет у вас»', /Награда скоро будет у вас/.test(thanks));

  click('close-modal');
  const card = doc.querySelector('.active-task-card')?.textContent || '';
  check('H12 статус карточки — «Отзыв на проверке»', /Отзыв на проверке/.test(card), card.slice(0, 60));
  check('H13 текст отзыва показан под заданием', /курьер привёз в удобное время/.test(card));
  check('H14 HTML из отзыва экранирован', !doc.querySelector('.task-review-block b') && /<b>Оформил<\/b>/.test(card));
  check('H15 кнопка «Выполнил» больше не показывается', !doc.querySelector('[data-action="task-done"]'));

  const stored = JSON.parse(window.localStorage.getItem('alfaTasks.activeTasks') || '[]')[0] || {};
  check('H16 отзыв и статус сохранены в localStorage', stored.stage === 'under-review' && /курьер/.test(stored.review || ''), JSON.stringify(stored).slice(0, 110));
  check('H17 без ошибок за весь сценарий', errors.length === 0, errors.join(' | '));

  const restarted = boot({
    storage: {
      'alfaTasks.accessGranted': 'true',
      'alfaTasks.activeTasks': window.localStorage.getItem('alfaTasks.activeTasks'),
    },
  });
  restarted.click('nav-account');
  check('H18 после перезапуска статус проверки сохранился', /Отзыв на проверке/.test(restarted.doc.querySelector('.active-task-card')?.textContent || ''));
}

console.log('\n=== РЕЗУЛЬТАТЫ ===');
let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? 'OK  ' : 'FAIL'}  ${r.name}${r.extra ? `  [${r.extra}]` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} пройдено, ${failed} провалено`);
process.exit(failed ? 1 : 0);
