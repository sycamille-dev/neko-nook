const SAVE_KEY = 'neko-nook-save';

const OLD_IMAGES = ['assets/cat-hero.jpg', 'assets/cat-friend-1.jpg', 'assets/cat-friend-2.jpg'];

export const CAT_PORTRAITS = {
  Mochi: 'assets/cat images/suki.png',
  Biscuit: 'assets/cat images/tofu.png',
  Pumpkin: 'assets/cat images/pumpkin.png',
  Noodle: 'assets/cat images/basil.png',
  Suki: 'assets/cat images/suki.png',
  Tofu: 'assets/cat images/tofu.png',
  Miso: 'assets/cat images/pumpkin.png',
  Peach: 'assets/cat images/suki.png',
  Basil: 'assets/cat images/basil.png',
  Maple: 'assets/cat images/tofu.png'
};

export const DEFAULT_PORTRAIT = 'assets/cat images/suki.png';

export function portraitFor(name) {
  return CAT_PORTRAITS[name] || DEFAULT_PORTRAIT;
}

export const CAT_POOL = Object.entries(CAT_PORTRAITS).map(([name, image]) => ({ name, image }));

function migrateImage(path, name) {
  if (OLD_IMAGES.includes(path)) return portraitFor(name);
  return path;
}

const defaultState = {
  coins: 100,
  inventory: { food: [], toys: [] },
  placedItems: [],
  visitingCats: [],
  catdex: [],
  heroImage: DEFAULT_PORTRAIT,
  totalEarned: 0,
  tttRecord: { wins: 0, losses: 0, draws: 0 },
  pacPawsBestStage: 1,
  muted: false
};

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return structuredClone(defaultState);
    const saved = JSON.parse(raw);
    const state = {
      ...structuredClone(defaultState),
      ...saved,
      inventory: {
        food: Array.isArray(saved.inventory?.food) ? saved.inventory.food : [],
        toys: Array.isArray(saved.inventory?.toys) ? saved.inventory.toys : []
      },
      placedItems: Array.isArray(saved.placedItems) ? saved.placedItems : [],
      visitingCats: Array.isArray(saved.visitingCats) ? saved.visitingCats : [],
      catdex: Array.isArray(saved.catdex) ? saved.catdex : []
    };
    state.heroImage = migrateImage(state.heroImage, '');
    state.visitingCats = state.visitingCats.map((c) => ({ ...c, image: migrateImage(c.image, c.name) }));
    state.catdex = state.catdex.map((c) => ({ ...c, image: migrateImage(c.image, c.name) }));
    return state;
  } catch {
    return structuredClone(defaultState);
  }
}

export const gameState = loadState();

export function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  } catch {
    // storage unavailable
  }
}

export function updateCoinUI() {
  const el = document.getElementById('coin-count');
  if (el) el.textContent = gameState.coins;
}

export function addCoins(n) {
  gameState.coins += n;
  gameState.totalEarned += n;
  saveState();
  updateCoinUI();
  window.dispatchEvent(new CustomEvent('neko:coins-changed'));
}

export function spendCoins(n) {
  if (gameState.coins < n) return false;
  gameState.coins -= n;
  saveState();
  updateCoinUI();
  window.dispatchEvent(new CustomEvent('neko:coins-changed'));
  return true;
}

let toastTimer = null;

export function notify(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

export const SHOP_ITEMS = {
  food: [
    { id: 'tuna-bite', name: 'Tuna Bite', emoji: '🐟', price: 10 },
    { id: 'salmon-snack', name: 'Salmon Snack', emoji: '🍣', price: 20 },
    { id: 'chicken-jerky', name: 'Chicken Jerky', emoji: '🍗', price: 30 },
    { id: 'shrimp-delight', name: 'Shrimp Delight', emoji: '🍤', price: 40 },
    { id: 'crab-pate', name: 'Crab Pâté', emoji: '🦀', price: 50 }
  ],
  toys: [
    { id: 'yarn-ball', name: 'Yarn Ball', emoji: '🧶', price: 30 },
    { id: 'feather-wand', name: 'Feather Wand', emoji: '🪶', price: 40 },
    { id: 'laser-pointer', name: 'Laser Pointer', emoji: '🔴', price: 50 },
    { id: 'catnip-mouse', name: 'Catnip Mouse', emoji: '🐭', price: 70 },
    { id: 'scratch-tower', name: 'Scratch Tower', emoji: '🗼', price: 100 }
  ]
};
