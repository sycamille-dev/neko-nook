import { addCoins, notify, gameState, saveState } from './state.js';

const canvas = document.getElementById('pacPawsCanvas');
const ctx = canvas.getContext('2d');
const coinDisplay = document.getElementById('pp-coins');
const biscuitDisplay = document.getElementById('pp-biscuits');
const stageDisplay = document.getElementById('pp-stage');
const bestDisplay = document.getElementById('pp-best');
const arcadeView = document.getElementById('view-arcade');

const TILE_SIZE = 30;
const ROWS = 12;
const COLS = 12;

const mazeMap = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 2, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const GHOST_SPAWNS = [
  [5, 5],
  [6, 5],
  [4, 5],
  [7, 5],
  [5, 7],
  [5, 3]
];

let grid = [];
let coinsEarned = 0;
let totalBiscuits = 0;
let stage = 1;
let bestStage = gameState.pacPawsBestStage || 1;
let ghosts = [];
let loopTimer = null;

const cat = { x: 1, y: 1, dirX: 0, dirY: 0, nextDirX: 0, nextDirY: 0 };

const heroSprite = new Image();
heroSprite.src = gameState.heroImage;

window.addEventListener('neko-hero-change', (e) => {
  heroSprite.src = e.detail.src;
});

function ghostCountForStage(s) {
  return Math.min(s + 1, GHOST_SPAWNS.length);
}

function loopDelay() {
  return Math.max(150, 250 - (stage - 1) * 25);
}

function startStage(newStage) {
  stage = newStage;
  grid = mazeMap.map((row) => [...row]);
  cat.x = 1;
  cat.y = 1;
  cat.dirX = 0;
  cat.dirY = 0;
  cat.nextDirX = 0;
  cat.nextDirY = 0;
  ghosts = GHOST_SPAWNS.slice(0, ghostCountForStage(stage)).map(([x, y]) => ({ x, y, dirX: 0, dirY: 0 }));
  totalBiscuits = grid.flat().filter((t) => t === 0).length;

  if (stage > bestStage) {
    bestStage = stage;
    gameState.pacPawsBestStage = bestStage;
    saveState();
  }

  clearInterval(loopTimer);
  loopTimer = setInterval(() => {
    update();
    render();
  }, loopDelay());

  updateUI();
}

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
  if (['ArrowUp', 'w', 'W'].includes(e.key)) {
    cat.nextDirX = 0;
    cat.nextDirY = -1;
  }
  if (['ArrowDown', 's', 'S'].includes(e.key)) {
    cat.nextDirX = 0;
    cat.nextDirY = 1;
  }
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
    cat.nextDirX = -1;
    cat.nextDirY = 0;
  }
  if (['ArrowRight', 'd', 'D'].includes(e.key)) {
    cat.nextDirX = 1;
    cat.nextDirY = 0;
  }
});

function canMove(x, y) {
  return grid[y] && grid[y][x] !== undefined && grid[y][x] !== 1;
}

function update() {
  if (!arcadeView.classList.contains('active')) return;

  if (canMove(cat.x + cat.nextDirX, cat.y + cat.nextDirY)) {
    cat.dirX = cat.nextDirX;
    cat.dirY = cat.nextDirY;
  }

  if (canMove(cat.x + cat.dirX, cat.y + cat.dirY)) {
    cat.x += cat.dirX;
    cat.y += cat.dirY;
  }

  if (grid[cat.y][cat.x] === 0) {
    grid[cat.y][cat.x] = 2;
    coinsEarned += 1;
    totalBiscuits -= 1;
    addCoins(1);
    updateUI();

    if (totalBiscuits === 0) {
      coinsEarned += 50;
      addCoins(50);
      notify(`🎉 Stage ${stage} cleared! +50 bonus Neko Coins!`);
      startStage(stage + 1);
      return;
    }
  }

  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];

  for (const ghost of ghosts) {
    const valid = dirs.filter((d) => canMove(ghost.x + d.x, ghost.y + d.y));
    if (valid.length > 0) {
      const move = valid[Math.floor(Math.random() * valid.length)];
      ghost.x += move.x;
      ghost.y += move.y;
    }

    if (ghost.x === cat.x && ghost.y === cat.y) {
      notify('💧 Splashed by a water drop! Back to stage 1.');
      startStage(1);
      return;
    }
  }
}

function updateUI() {
  coinDisplay.textContent = coinsEarned;
  biscuitDisplay.textContent = totalBiscuits;
  stageDisplay.textContent = stage;
  bestDisplay.textContent = bestStage;
}

function drawRoundSprite(img, cx, cy, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.clip();
  const side = size * 1.25;
  ctx.drawImage(img, cx - side / 2, cy - side / 2, side, side);
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = grid[r][c];
      const px = c * TILE_SIZE;
      const py = r * TILE_SIZE;

      if (tile === 1) {
        ctx.fillStyle = '#5c4b51';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      } else if (tile === 0) {
        ctx.fillStyle = '#f4a261';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const catCx = cat.x * TILE_SIZE + TILE_SIZE / 2;
  const catCy = cat.y * TILE_SIZE + TILE_SIZE / 2;

  if (heroSprite.complete && heroSprite.naturalWidth > 0) {
    drawRoundSprite(heroSprite, catCx, catCy, 42);
  } else {
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐱', catCx, catCy);
  }

  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const g of ghosts) {
    ctx.fillText('💧', g.x * TILE_SIZE + TILE_SIZE / 2, g.y * TILE_SIZE + TILE_SIZE / 2);
  }
}

startStage(1);
