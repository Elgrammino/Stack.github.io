import { STACK, SUITS, RANKS, label, name, calculate } from './logic.js';

const stage = document.getElementById('stage');
const saved = (() => {
  try { return JSON.parse(localStorage.getItem('stack-state')) || {}; }
  catch { return {}; }
})();

function syncViewport() {
  const height = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${height}px`);
  document.documentElement.dataset.compact = height <= 500 ? 'true' : 'false';
}
syncViewport();
window.visualViewport?.addEventListener('resize', syncViewport);
window.addEventListener('resize', syncViewport);

const state = {
  step: ['bottom', 'spectator', 'position', 'result'].includes(saved.step) ? saved.step : 'bottom',
  bottom: STACK.includes(saved.bottom) ? saved.bottom : '9D',
  spectator: STACK.includes(saved.spectator) ? saved.spectator : null,
  position: Number.isInteger(saved.position) && saved.position >= 1 && saved.position <= 52 ? saved.position : null,
  theme: saved.theme === 'light' ? 'light' : 'dark',
  suit: null,
};
if ((state.step === 'position' || state.step === 'result') && !state.spectator) state.step = 'spectator';
if (state.step === 'result' && !state.position) state.step = 'position';

const lines = `<div class="lines" aria-hidden="true">${'<i></i>'.repeat(52)}</div>`;
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const img = card => `<img class="hero-card" src="cards/${card}.webp" alt="${esc(name(card))}">`;

function persist() {
  try {
    localStorage.setItem('stack-state', JSON.stringify({
      step: state.step, bottom: state.bottom, spectator: state.spectator,
      position: state.position, theme: state.theme,
    }));
  } catch { /* The app remains usable if storage is blocked. */ }
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  document.querySelector('meta[name="theme-color"]').content = state.theme === 'dark' ? '#20262d' : '#f0f3f6';
}

function header() {
  const back = state.step === 'bottom'
    ? '<span class="nav-placeholder" aria-hidden="true"></span>'
    : '<button class="nav" data-action="back">← Назад</button>';
  return `<header>${back}<h1 class="brand">Стек</h1><button class="nav" data-action="theme">${state.theme === 'dark' ? 'Светлая' : 'Тёмная'}</button></header>`;
}

function selector(kind) {
  const bottom = kind === 'bottom';
  const activeSuit = state.suit || (bottom ? state.bottom.at(-1) : state.spectator?.at(-1) || 'S');
  const suits = ['S', 'H', 'C', 'D'].map(s => `<button class="suit ${s === 'H' || s === 'D' ? 'red' : ''}" data-suit="${s}" aria-label="${SUITS[s][1]}" aria-pressed="${s === activeSuit}">${SUITS[s][0]}</button>`).join('');
  const ranks = RANKS.map(r => {
    const card = r + activeSuit;
    return `<button class="rank" data-card="${card}"${card === (bottom ? state.bottom : state.spectator) ? ' data-selected aria-current="true"' : ''}>${r}</button>`;
  }).join('');
  return `<section class="screen card-picker">
    ${header()}
    <div class="content">
      <p class="eyebrow">Шаг ${bottom ? '1' : '2'} из 3</p>
      <h2 class="headline">${bottom ? 'Нижняя карта' : 'Карта зрителя'}</h2>
      <p class="hint">Выбери масть и номинал</p>
      <div class="suits">${suits}</div>
      <div class="ranks" aria-label="Номиналы ${SUITS[activeSuit][1]}">${ranks}</div>
      <p class="picker-note">${bottom ? `Сейчас снизу ${label(state.bottom)}. Выбери другую карту или продолжи.` : 'После выбора номинала откроется ввод позиции.'}</p>
    </div>
    ${bottom ? `<div class="actions"><button class="primary" data-action="confirm-bottom" aria-label="Продолжить с ${esc(name(state.bottom))} снизу">Продолжить с ${label(state.bottom)}</button></div>` : ''}
  </section>`;
}

function positionScreen() {
  return `<section class="screen">
    ${header()}
    <div class="content">
      <p class="eyebrow">Шаг 3 из 3</p>
      <h2 class="headline">Позиция</h2>
      <p class="chosen">Карта зрителя: <strong>${label(state.spectator)}</strong></p>
      <label class="hint" for="position">Позиция сверху, от 1 до 52</label>
      <input class="position-field" id="position" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" enterkeyhint="done" maxlength="2" value="${state.position ?? ''}">
      <p class="error" id="error" role="alert"></p>
    </div>
    <div class="actions"><button class="primary" data-action="calculate">OK</button></div>
  </section>`;
}

function resultScreen() {
  const r = calculate(state.bottom, state.spectator, state.position);
  const zero = r.cut === 0;
  const deck = zero ? '' : `<div class="deck" role="img" aria-label="Примерная глубина: после ${r.cut} карт сверху" style="--depth:${r.cut / 52 * 100}%">${lines}<div class="cut"><i class="beam"></i></div></div>`;
  return `<section class="screen result-screen">
    ${header()}
    <div class="content result">
      <div class="request"><strong>${label(r.target)}</strong> на позиции <strong>${r.position}</strong></div>
      <p class="result-title">${zero ? 'Готово' : 'Подсними'}</p>
      <p class="count">${r.cut}<span>${zero ? 'подснятий' : 'карт'}</span></p>
      <div class="result-main">${img(zero ? r.target : r.cutAfter)}${deck}</div>
      <p class="guide">${zero ? 'Уже на нужной позиции' : `Ориентир — ${name(r.cutAfter)}`}</p>
      <div class="edges">
        <div class="edge" aria-label="Сверху после подснятия ${esc(name(r.newTop))}">
          <span class="edge-label">Сверху после подснятия</span>
          <strong class="edge-value">${label(r.newTop)}</strong>
        </div>
        <button class="edge edge-next" data-action="continue" aria-label="Продолжить расчёт с ${esc(name(r.newBottom))} снизу">
          <span class="edge-label">Снизу после подснятия</span>
          <span class="edge-value">${label(r.newBottom)} <span aria-hidden="true" class="edge-arrow">→</span></span>
        </button>
      </div>
    </div>
    <div class="actions"><button class="primary" data-action="restart">Начать заново</button></div>
  </section>`;
}

function render() {
  applyTheme();
  persist();
  stage.innerHTML = state.step === 'bottom' ? selector('bottom')
    : state.step === 'spectator' ? selector('spectator')
    : state.step === 'position' ? positionScreen() : resultScreen();
  if (state.step === 'position') requestAnimationFrame(() => {
    document.getElementById('position')?.focus({ preventScroll: true });
  });
}

stage.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.suit) {
    state.suit = button.dataset.suit;
    render();
    return;
  }
  if (button.dataset.card) {
    if (state.step === 'bottom') {
      state.bottom = button.dataset.card;
      state.step = 'spectator';
    } else if (state.step === 'spectator') {
      state.spectator = button.dataset.card;
      state.step = 'position';
    }
    state.suit = null;
    render();
    return;
  }
  switch (button.dataset.action) {
    case 'confirm-bottom':
      state.step = 'spectator';
      state.suit = null;
      render();
      break;
    case 'theme':
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      render();
      break;
    case 'back':
      state.step = state.step === 'result' ? 'position' : state.step === 'position' ? 'spectator' : 'bottom';
      state.suit = null;
      render();
      break;
    case 'calculate': {
      const input = document.getElementById('position');
      if (!/^(?:[1-9]|[1-4][0-9]|5[0-2])$/.test(input.value)) {
        document.getElementById('error').textContent = 'Введи число от 1 до 52';
        input.focus();
        return;
      }
      state.position = Number(input.value);
      state.step = 'result';
      input.blur();
      render();
      break;
    }
    case 'continue': {
      const r = calculate(state.bottom, state.spectator, state.position);
      state.bottom = r.newBottom;
      state.spectator = null;
      state.position = null;
      state.step = 'spectator';
      state.suit = null;
      render();
      break;
    }
    case 'restart':
      state.bottom = '9D';
      state.spectator = null;
      state.position = null;
      state.step = 'bottom';
      state.suit = null;
      render();
      break;
  }
});

stage.addEventListener('input', event => {
  if (event.target.id === 'position') {
    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 2);
    document.getElementById('error').textContent = '';
  }
});
// Handle OK before a mobile keyboard closes and changes the visual viewport.
stage.addEventListener('pointerdown', event => {
  const button = event.target.closest('[data-action="calculate"]');
  if (button) {
    event.preventDefault();
    button.click();
  }
});
stage.addEventListener('keydown', event => {
  if (event.target.id === 'position' && event.key === 'Enter') {
    event.preventDefault();
    stage.querySelector('[data-action="calculate"]').click();
  }
});

render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
