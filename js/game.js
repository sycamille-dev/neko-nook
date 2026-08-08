import { gameState, saveState, spendCoins, updateCoinUI, notify, SHOP_ITEMS } from './state.js';
import { initAudio, resumeAudio, startMusic, setMuted, playPop } from './audio.js';
import {
  initScene,
  beginIntro,
  petCatByUid,
  selectCatByUid,
  placeItem,
  getSelectedUid,
  refreshSize
} from './3d/scene.js';

const tabButtons = {
  porch: document.getElementById('tab-porch'),
  arcade: document.getElementById('tab-arcade')
};

const views = {
  porch: document.getElementById('view-porch'),
  arcade: document.getElementById('view-arcade')
};

function switchTab(name) {
  Object.entries(tabButtons).forEach(([n, b]) => b.classList.toggle('active', n === name));
  Object.entries(views).forEach(([n, v]) => v.classList.toggle('active', n === name));
  if (name === 'porch') refreshSize();
}

Object.entries(tabButtons).forEach(([name, btn]) => {
  btn.addEventListener('click', () => switchTab(name));
});

function renderShop() {
  const treats = document.getElementById('shop-treats');
  const toys = document.getElementById('shop-toys');
  treats.innerHTML = SHOP_ITEMS.food.map((item) => shopCard('food', item)).join('');
  toys.innerHTML = SHOP_ITEMS.toys.map((item) => shopCard('toys', item)).join('');
}

function shopCard(kind, item) {
  const affordable = gameState.coins >= item.price;
  return `
    <div class="shop-item">
      <div class="shop-emoji">${item.emoji}</div>
      <div class="shop-name">${item.name}</div>
      <div class="shop-price">🪙 ${item.price}</div>
      <button class="btn-soft btn-sm" data-buy="${kind}:${item.id}" ${affordable ? '' : 'disabled'}>Buy</button>
    </div>`;
}

function buyItem(kind, item) {
  if (!spendCoins(item.price)) {
    notify('Not enough Neko Coins!');
    return;
  }
  gameState.inventory[kind].push({ ...item, uid: `item-${Date.now()}-${Math.floor(Math.random() * 9999)}` });
  saveState();
  renderShop();
  renderInventory();
  notify(`Bought ${item.emoji} ${item.name}!`);
}

function renderInventory() {
  const el = document.getElementById('inventory');
  const items = [...gameState.inventory.food, ...gameState.inventory.toys];
  el.innerHTML = items.length
    ? items.map(inventoryChip).join('')
    : '<span class="empty-hint">Nothing here yet — buy treats and toys in the shop above!</span>';
}

function inventoryChip(item) {
  return `
    <div class="chip">
      <span>${item.emoji}</span>
      <span>${item.name}</span>
      <button class="chip-btn" data-place="${item.uid}">Place</button>
    </div>`;
}

function renderCats() {
  const list = document.getElementById('visiting-cats');
  const count = document.getElementById('hud-cat-count');
  count.textContent = gameState.visitingCats.length;
  list.innerHTML = gameState.visitingCats.length
    ? gameState.visitingCats.map(catCard).join('')
    : '<span class="empty-hint">No cats yet — place treats and toys to attract visitors!</span>';
}

function catCard(cat) {
  const selected = getSelectedUid() === cat.uid;
  return `
    <div class="cat-card ${selected ? 'cat-card-selected' : ''}" data-cat="${cat.uid}">
      <img class="cat-portrait" src="${cat.image}" alt="${cat.name}">
      <span class="cat-name">${cat.name}</span>
      <button class="btn-soft btn-sm" data-pet="${cat.uid}">Pet 🖐 +5</button>
    </div>`;
}

function renderCatdex() {
  const list = document.getElementById('catdex-list');
  const count = document.getElementById('catdex-count');
  count.textContent = gameState.catdex.length;
  list.innerHTML = gameState.catdex.length
    ? gameState.catdex
        .map((c) => `<span class="catdex-entry"><img class="catdex-thumb" src="${c.image}" alt=""> ${c.name}</span>`)
        .join('')
    : '<span class="empty-hint">No cats in your Catdex yet. Pet your visitors!</span>';
}

function renderChips() {
  const el = document.getElementById('cat-chips');
  const selected = getSelectedUid();
  el.innerHTML = gameState.visitingCats
    .map(
      (c) => `
      <button class="chip-portrait ${c.uid === selected ? 'chip-selected' : ''}" data-chip="${c.uid}" title="${c.name}">
        <img src="${c.image}" alt="${c.name}">
      </button>`
    )
    .join('');
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

document.getElementById('hud-shop').addEventListener('click', () => {
  renderShop();
  renderInventory();
  openModal('shop-modal');
});
document.getElementById('close-shop').addEventListener('click', () => closeModal('shop-modal'));
document.getElementById('hud-cats').addEventListener('click', () => {
  renderCats();
  renderCatdex();
  openModal('cats-modal');
});
document.getElementById('close-cats').addEventListener('click', () => closeModal('cats-modal'));

document.getElementById('shop-modal').addEventListener('click', (e) => {
  if (e.target.id === 'shop-modal') closeModal('shop-modal');
  const buyBtn = e.target.closest('[data-buy]');
  if (buyBtn) {
    const [kind, id] = buyBtn.dataset.buy.split(':');
    const item = SHOP_ITEMS[kind].find((i) => i.id === id);
    if (item) buyItem(kind, item);
    return;
  }
  const placeBtn = e.target.closest('[data-place]');
  if (placeBtn) {
    placeItem(placeBtn.dataset.place);
    renderInventory();
  }
});

document.getElementById('cats-modal').addEventListener('click', (e) => {
  if (e.target.id === 'cats-modal') closeModal('cats-modal');
  const card = e.target.closest('[data-cat]');
  if (card) {
    selectCatByUid(card.dataset.cat);
    closeModal('cats-modal');
    return;
  }
  const petBtn = e.target.closest('[data-pet]');
  if (petBtn) {
    petCatByUid(petBtn.dataset.pet);
    renderCats();
    renderCatdex();
  }
});

document.getElementById('cat-chips').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-chip]');
  if (btn) selectCatByUid(btn.dataset.chip);
});

const HERO_OPTIONS = [
  'assets/cat-hero.jpg',
  'assets/cat-friend-1.jpg',
  'assets/cat-friend-2.jpg'
];

const heroAvatar = document.querySelector('.hero-avatar');

function updateTopbarAvatar() {
  heroAvatar.src = gameState.heroImage;
}

function renderHeroSelect() {
  const el = document.getElementById('hero-select');
  el.innerHTML = HERO_OPTIONS.map(
    (src) => `
      <button class="hero-option ${gameState.heroImage === src ? 'selected' : ''}" data-hero="${src}">
        <img src="${src}" alt="Neko">
      </button>`
  ).join('');
}

function renderStatsLine() {
  const el = document.getElementById('stats-line');
  const { wins, losses, draws } = gameState.tttRecord;
  el.textContent =
    `🪙 Total coins earned: ${gameState.totalEarned}` +
    ` · 🐾 Cat-Tac-Toe: ${wins}W ${losses}L ${draws}D` +
    ` · 💧 Best Pac-Paws stage: ${gameState.pacPawsBestStage}` +
    ` · 📖 Cats in Catdex: ${gameState.catdex.length}`;
}

function openSettings() {
  renderHeroSelect();
  renderStatsLine();
  openModal('settings-modal');
}

function closeSettings() {
  closeModal('settings-modal');
}

document.getElementById('open-settings').addEventListener('click', openSettings);
document.getElementById('close-settings').addEventListener('click', closeSettings);

document.getElementById('settings-modal').addEventListener('click', (e) => {
  if (e.target.id === 'settings-modal') closeSettings();
  const heroBtn = e.target.closest('[data-hero]');
  if (heroBtn) {
    gameState.heroImage = heroBtn.dataset.hero;
    saveState();
    updateTopbarAvatar();
    renderHeroSelect();
    window.dispatchEvent(new CustomEvent('neko-hero-change', { detail: { src: gameState.heroImage } }));
    notify('😺 Your Neko changed!');
  }
});

document.getElementById('reset-progress').addEventListener('click', () => {
  if (confirm('Reset ALL progress? Coins, items, cats and records will be cleared.')) {
    localStorage.removeItem('neko-nook-save');
    location.reload();
  }
});

const muteBtn = document.getElementById('toggle-mute');

function updateMuteUI() {
  muteBtn.textContent = gameState.muted ? '🔇' : '🔊';
}

muteBtn.addEventListener('click', () => {
  initAudio();
  gameState.muted = !gameState.muted;
  setMuted(gameState.muted);
  saveState();
  updateMuteUI();
  if (!gameState.muted) playPop();
});

const introOverlay = document.getElementById('intro-overlay');

function hideIntro() {
  introOverlay.classList.add('intro-hidden');
}

function startGame(skip) {
  hideIntro();
  try {
    initAudio();
    resumeAudio();
    startMusic();
    beginIntro(skip);
    playPop();
  } catch (err) {
    console.error('Startup failed:', err);
    notify('⚠️ Something went wrong starting the game');
  }
}

document.getElementById('intro-start').addEventListener('click', () => startGame(false));
document.getElementById('intro-skip').addEventListener('click', () => startGame(true));

window.addEventListener('error', (e) => {
  console.error('Uncaught error:', e.error || e.message);
  if (!introOverlay.classList.contains('intro-hidden')) {
    notify(`⚠️ ${e.message || 'Unexpected error'}`);
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal('shop-modal');
    closeModal('cats-modal');
    closeSettings();
  }
});

window.addEventListener('neko:cats-changed', () => {
  renderCats();
  renderCatdex();
  renderChips();
});
window.addEventListener('neko:inventory-changed', () => renderInventory());
window.addEventListener('neko:coins-changed', () => renderShop());
window.addEventListener('neko:selected-changed', () => renderChips());

updateCoinUI();
updateTopbarAvatar();
updateMuteUI();
renderShop();
renderInventory();
renderCats();
renderCatdex();
renderChips();
try {
  initScene();
} catch (err) {
  console.error('initScene failed:', err);
}
