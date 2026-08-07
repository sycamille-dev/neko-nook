import { gameState, saveState, addCoins, spendCoins, updateCoinUI, notify, SHOP_ITEMS } from './state.js';

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
}

Object.entries(tabButtons).forEach(([name, btn]) => {
  btn.addEventListener('click', () => switchTab(name));
});

const CAT_POOL = [
  { name: 'Mochi', image: 'assets/cat-friend-1.jpg' },
  { name: 'Biscuit', image: 'assets/cat-friend-2.jpg' },
  { name: 'Pumpkin', image: 'assets/cat-friend-1.jpg' },
  { name: 'Noodle', image: 'assets/cat-friend-2.jpg' },
  { name: 'Suki', image: 'assets/cat-hero.jpg' },
  { name: 'Tofu', image: 'assets/cat-friend-1.jpg' },
  { name: 'Miso', image: 'assets/cat-friend-2.jpg' },
  { name: 'Peach', image: 'assets/cat-hero.jpg' },
  { name: 'Basil', image: 'assets/cat-friend-1.jpg' },
  { name: 'Maple', image: 'assets/cat-friend-2.jpg' }
];

let uidCounter = 0;

function makeUid(prefix) {
  uidCounter += 1;
  return `${prefix}-${uidCounter}-${Date.now()}`;
}

function randomCat() {
  const here = new Set(gameState.visitingCats.map((c) => c.name));
  const pool = CAT_POOL.filter((c) => !here.has(c.name));
  const pick = pool.length ? pool : CAT_POOL;
  return { ...pick[Math.floor(Math.random() * pick.length)], uid: makeUid('cat') };
}

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
  gameState.inventory[kind].push({ ...item, uid: makeUid('item') });
  saveState();
  renderShop();
  renderInventory();
  notify(`Bought ${item.emoji} ${item.name}!`);
}

function findInventoryEntry(uid) {
  for (const kind of ['food', 'toys']) {
    const idx = gameState.inventory[kind].findIndex((i) => i.uid === uid);
    if (idx >= 0) return { kind, idx };
  }
  return null;
}

function placeItem(uid) {
  const entry = findInventoryEntry(uid);
  if (!entry) return;
  const [item] = gameState.inventory[entry.kind].splice(entry.idx, 1);
  gameState.placedItems.push({ ...item, kind: entry.kind });
  saveState();
  renderInventory();
  renderPlaced();
  scheduleCatVisit();
}

function removePlaced(uid) {
  const idx = gameState.placedItems.findIndex((i) => i.uid === uid);
  if (idx < 0) return;
  const [item] = gameState.placedItems.splice(idx, 1);
  gameState.inventory[item.kind].push(item);
  saveState();
  renderInventory();
  renderPlaced();
}

function renderInventory() {
  const el = document.getElementById('inventory');
  const items = [...gameState.inventory.food, ...gameState.inventory.toys];
  el.innerHTML = items.length
    ? items.map(inventoryChip).join('')
    : '<span class="empty-hint">Nothing here yet — open the shop to buy treats and toys!</span>';
}

function inventoryChip(item) {
  return `
    <div class="chip">
      <span>${item.emoji}</span>
      <span>${item.name}</span>
      <button class="chip-btn" data-place="${item.uid}">Place</button>
    </div>`;
}

function renderPlaced() {
  const el = document.getElementById('placed-items');
  el.innerHTML = gameState.placedItems.length
    ? gameState.placedItems.map(placedChip).join('')
    : '<span class="empty-hint">✨ The porch is empty. Place items to attract cats!</span>';
}

function placedChip(item) {
  return `
    <div class="chip placed">
      <span>${item.emoji}</span>
      <span>${item.name}</span>
      <button class="chip-btn" data-remove="${item.uid}" title="Put back in inventory">✕</button>
    </div>`;
}

function renderCats() {
  const list = document.getElementById('visiting-cats');
  const count = document.getElementById('cat-count');
  count.textContent = gameState.visitingCats.length;
  list.innerHTML = gameState.visitingCats.length
    ? gameState.visitingCats.map(catCard).join('')
    : '<span class="empty-hint">No cats yet — place treats and toys to attract visitors!</span>';
}

function catCard(cat) {
  return `
    <div class="cat-card">
      <img class="cat-portrait" src="${cat.image}" alt="${cat.name}">
      <span class="cat-name">${cat.name}</span>
      <button class="btn-soft btn-sm" data-pet="${cat.uid}">Pet 🖐</button>
    </div>`;
}

function petCat(uid) {
  const idx = gameState.visitingCats.findIndex((c) => c.uid === uid);
  if (idx < 0) return;
  const [cat] = gameState.visitingCats.splice(idx, 1);
  const known = gameState.catdex.some((c) => c.name === cat.name);
  if (!known) {
    gameState.catdex.push({ name: cat.name, image: cat.image });
    notify(`${cat.name} joined your Catdex! +5 Neko Coins`);
  } else {
    notify(`You petted ${cat.name}! +5 Neko Coins`);
  }
  addCoins(5);
  saveState();
  renderCats();
  renderCatdex();
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

function scheduleCatVisit() {
  const delay = 2500 + Math.random() * 3500;
  setTimeout(() => {
    if (gameState.visitingCats.length >= 5) return;
    const cat = randomCat();
    gameState.visitingCats.push(cat);
    saveState();
    renderCats();
    notify(`😻 ${cat.name} wandered onto the porch!`);
  }, delay);
}

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
  document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
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

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeShop();
    closeSettings();
  }
});

updateCoinUI();
updateTopbarAvatar();
renderInventory();

function openShop() {
  renderShop();
  document.getElementById('shop-modal').classList.remove('hidden');
}

function closeShop() {
  document.getElementById('shop-modal').classList.add('hidden');
}

document.getElementById('open-shop').addEventListener('click', openShop);
document.getElementById('close-shop').addEventListener('click', closeShop);

document.getElementById('shop-modal').addEventListener('click', (e) => {
  if (e.target.id === 'shop-modal') closeShop();
  const btn = e.target.closest('[data-buy]');
  if (!btn) return;
  const [kind, id] = btn.dataset.buy.split(':');
  const item = SHOP_ITEMS[kind].find((i) => i.id === id);
  if (item) buyItem(kind, item);
});

document.getElementById('view-porch').addEventListener('click', (e) => {
  const placeBtn = e.target.closest('[data-place]');
  if (placeBtn) {
    placeItem(placeBtn.dataset.place);
    return;
  }
  const removeBtn = e.target.closest('[data-remove]');
  if (removeBtn) {
    removePlaced(removeBtn.dataset.remove);
    return;
  }
  const petBtn = e.target.closest('[data-pet]');
  if (petBtn) petCat(petBtn.dataset.pet);
});

updateCoinUI();
updateTopbarAvatar();
renderInventory();
renderPlaced();
renderCats();
renderCatdex();
