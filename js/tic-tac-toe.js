import { addCoins, notify, gameState, saveState } from './state.js';

const boardEl = document.getElementById('ttt-board');
const statusEl = document.getElementById('ttt-status');
const restartBtn = document.getElementById('ttt-restart');
const recordEl = document.getElementById('ttt-record');

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const SYMBOLS = { Paw: '🐾', Fish: '🐟' };

let board = Array(9).fill(null);
let gameOver = false;
let thinking = false;

function buildBoard() {
  boardEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('button');
    cell.className = 'ttt-cell';
    cell.addEventListener('click', () => onCellClick(i));
    boardEl.appendChild(cell);
  }
}

function render() {
  Array.from(boardEl.children).forEach((cell, i) => {
    cell.textContent = board[i] ? SYMBOLS[board[i]] : '';
    cell.classList.toggle('taken', Boolean(board[i]));
    cell.classList.remove('win');
  });
}

function emptyCells() {
  return board.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);
}

function findLineFor(symbol) {
  return LINES.find((line) => {
    const spots = line.map((i) => board[i]);
    return spots.filter((s) => s === symbol).length === 2 && spots.some((s) => s === null);
  });
}

function updateRecordUI() {
  const { wins, losses, draws } = gameState.tttRecord;
  recordEl.textContent = `Record — ${wins}W · ${losses}L · ${draws}D`;
}

function bumpRecord(result) {
  gameState.tttRecord[result] += 1;
  saveState();
  updateRecordUI();
}

function checkEnd() {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      gameOver = true;
      Array.from(boardEl.children).forEach((cell, i) => {
        if (line.includes(i)) cell.classList.add('win');
      });
      if (board[a] === 'Paw') {
        addCoins(20);
        bumpRecord('wins');
        statusEl.textContent = '🏆 You win! +20 Neko Coins';
        notify('🏆 Cat-Tac-Toe victory! +20 Neko Coins');
      } else {
        bumpRecord('losses');
        statusEl.textContent = '🐟 Fish wins! Try again, meow.';
      }
      return true;
    }
  }
  if (emptyCells().length === 0) {
    gameOver = true;
    bumpRecord('draws');
    statusEl.textContent = "🤝 It's a draw!";
    return true;
  }
  return false;
}

function aiTurn() {
  thinking = true;
  statusEl.textContent = '🐟 Fish is thinking...';
  setTimeout(() => {
    let idx = null;
    const winLine = findLineFor('Fish');
    if (winLine) {
      idx = winLine.find((i) => board[i] === null);
    } else {
      const blockLine = findLineFor('Paw');
      if (blockLine) idx = blockLine.find((i) => board[i] === null);
    }
    if (idx === null) {
      const empty = emptyCells();
      if (empty.includes(4)) {
        idx = 4;
      } else {
        const corners = empty.filter((i) => [0, 2, 6, 8].includes(i));
        const pick = corners.length ? corners : empty;
        idx = pick[Math.floor(Math.random() * pick.length)];
      }
    }
    board[idx] = 'Fish';
    render();
    if (!checkEnd()) statusEl.textContent = 'Your turn — you are Paw';
    thinking = false;
  }, 450);
}

function onCellClick(i) {
  if (board[i] || gameOver || thinking) return;
  board[i] = 'Paw';
  render();
  if (!checkEnd()) aiTurn();
}

function restart() {
  board = Array(9).fill(null);
  gameOver = false;
  thinking = false;
  render();
  statusEl.textContent = 'Your turn — you are Paw';
}

restartBtn.addEventListener('click', restart);
buildBoard();
restart();
updateRecordUI();
