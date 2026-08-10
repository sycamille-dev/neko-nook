const SAVE_KEY = 'neko-nook-save';

const defaultState = {
  coins: 100,
  inventory: { food: [], toys: [] },
  placedItems: [],
  visitingCats: [],
  catdex: [],
  heroImage: 'assets/cat-hero.jpg',
  totalEarned: 0,
  tttRecord: { wins: 0, losses: 0, draws: 0 },
  pacPawsBestStage: 1,
  muted: false
};

export const CAT_POOL = [
  { name: 'Mochi', image: 'assets/cat-friend-1.jpg' },
  { name: 'Biscuit', image: 'assets/cat-friend-2.jpg' },
  { name: 'Pumpkin', image: 'assets/cat images/pumpkin.png' },
  { name: 'Noodle', image: 'assets/cat-friend-2.jpg' },
  { name: 'Suki', image: 'assets/cat images/suki.png' },
  { name: 'Tofu', image: 'assets/cat images/tofu.png' },
  { name: 'Miso', image: 'assets/cat-friend-1.jpg' },
  { name: 'Peach', image: 'assets/cat-hero.jpg' },
  { name: 'Basil', image: 'assets/cat images/basil.png' },
  { name: 'Maple', image: 'assets/cat-friend-2.jpg' }
];

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return structuredClone(defaultState);
    const saved = JSON.parse(raw);
    return {
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
