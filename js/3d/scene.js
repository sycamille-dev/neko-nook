import * as THREE from 'three';
import { gameState, saveState, addCoins, notify, CAT_POOL } from '../state.js';
import { playMeow, playPurr, playHappy, playEat, playPop, playBird, resumeAudio } from '../audio.js';
import { buildWorld } from './world.js';
import { buildInterior, setCutaway } from './interior.js';
import { Cat3D } from './cats.js';
import { makeItemMesh } from './items3d.js';

const container = document.getElementById('scene-container');

let threeReady = false;
let renderer = null;
let scene = null;
let camera = null;
let ground = null;
let dom = null;
let exteriorGroup = null;
let doorGroup = null;
let doorPivot = null;
let interiorGroup = null;
let insideMode = false;

const camTarget = new THREE.Vector3(0, 1.2, 0);
let camRadius = 12;
let camTheta = 0.7;
let camPhi = 1.1;

const transition = {
  active: false,
  t0: 0,
  duration: 2200,
  entering: true,
  fromPos: null,
  midPos: null,
  toPos: null,
  fromTarget: null,
  toTarget: null
};

function clampTarget() {
  camTarget.x = THREE.MathUtils.clamp(camTarget.x, -25, 25);
  camTarget.z = THREE.MathUtils.clamp(camTarget.z, -25, 25);
}

function defaultCamPos() {
  return new THREE.Vector3(
    camTarget.x + camRadius * Math.sin(camPhi) * Math.sin(camTheta),
    camTarget.y + camRadius * Math.cos(camPhi),
    camTarget.z + camRadius * Math.sin(camPhi) * Math.cos(camTheta)
  );
}

function applyCamera() {
  camera.position.copy(defaultCamPos());
  camera.lookAt(camTarget);
}

const cats = new Map();
const catRoots = [];
const itemMeshes = new Map();
const floats = [];
const zzz = new Map();
const eatSoundT = new Map();
const meowSoundT = new Map();

let selectedUid = null;
let uidSeq = 0;
let spawnT = 5;
let birdT = 8 + Math.random() * 10;

const intro = { active: false, t0: 0, duration: 4200 };

function emit(name) {
  window.dispatchEvent(new CustomEvent(name));
}

function makeUid() {
  uidSeq += 1;
  return `cat-${uidSeq}-${Date.now()}`;
}

function randomCatEntry() {
  const here = new Set(gameState.visitingCats.map((c) => c.name));
  const pool = CAT_POOL.filter((c) => !here.has(c.name));
  const pick = pool.length ? pool : CAT_POOL;
  return { ...pick[Math.floor(Math.random() * pick.length)] };
}

function edgePoint() {
  const a = Math.random() * Math.PI * 2;
  const r = 13 + Math.random() * 3;
  return { x: Math.cos(a) * r, z: 0.5 + Math.sin(a) * r };
}

function randomPorchPoint() {
  if (insideMode) {
    return { x: (Math.random() - 0.5) * 6.2, z: -2.1 - Math.random() * 3.6 };
  }
  return { x: (Math.random() - 0.5) * 6, z: (Math.random() - 0.5) * 3 + 0.6 };
}

function randomArrivalPoint() {
  if (insideMode) {
    return { x: (Math.random() - 0.5) * 2.5, z: 0.6 };
  }
  const a = Math.random() * Math.PI * 2;
  const r = 13 + Math.random() * 3;
  return { x: Math.cos(a) * r, z: 0.5 + Math.sin(a) * r };
}

function spawnCat(entry = null) {
  if (gameState.visitingCats.length >= 4) return null;
  const e = entry || randomCatEntry();
  e.uid = e.uid || makeUid();
  const existing = gameState.visitingCats.some((c) => c.uid === e.uid);
  const cat = new Cat3D(e);
  const spawn = randomArrivalPoint();
  const dest = randomPorchPoint();
  cat.root.position.set(spawn.x, 0, spawn.z);
  cat.arrive(dest.x, dest.z);
  scene.add(cat.root);
  catRoots.push(cat.root);
  cats.set(e.uid, cat);
  if (!existing) {
    gameState.visitingCats.push({ name: e.name, image: e.image, uid: e.uid });
    saveState();
    emit('neko:cats-changed');
    notify(`😻 ${e.name} wandered onto the porch!`);
    if (Math.random() < 0.5) playMeow(0.4);
  }
  return cat;
}

function removeCat(uid) {
  const cat = cats.get(uid);
  if (!cat) return;
  scene.remove(cat.root);
  const ri = catRoots.indexOf(cat.root);
  if (ri >= 0) catRoots.splice(ri, 1);
  cats.delete(uid);
  const vi = gameState.visitingCats.findIndex((c) => c.uid === uid);
  if (vi >= 0) gameState.visitingCats.splice(vi, 1);
  if (selectedUid === uid) deselect();
  saveState();
  emit('neko:cats-changed');
}

function startLeave(cat) {
  cat.pinned = false;
  const p = randomArrivalPoint();
  cat.leave(p.x, p.z);
}

function wander(cat) {
  if (insideMode) {
    const p = randomPorchPoint();
    cat.walkTo(p.x, p.z);
    return;
  }
  const toys = [];
  itemMeshes.forEach((m) => {
    if (m.userData.isToy) toys.push(m.position);
  });
  if (toys.length && Math.random() < 0.45) {
    const t = toys[Math.floor(Math.random() * toys.length)];
    cat.playGoal = null;
    cat.walkTo(t.x + (Math.random() - 0.5) * 1.5, t.z + (Math.random() - 0.5) * 1.5);
  } else {
    const p = randomPorchPoint();
    cat.walkTo(p.x, p.z);
  }
}

function selectCat(uid) {
  if (selectedUid) {
    const old = cats.get(selectedUid);
    if (old) old.ring.visible = false;
  }
  selectedUid = uid;
  const cat = cats.get(uid);
  if (!cat) return;
  cat.ring.visible = true;
  cat.pinned = true;
  cat.leaveTimer = Math.max(cat.leaveTimer, 20);
  updateSelectionBar();
  emit('neko:selected-changed');
}

export function deselect() {
  if (!threeReady) return;
  if (selectedUid) {
    const cat = cats.get(selectedUid);
    if (cat) {
      cat.ring.visible = false;
      cat.pinned = false;
    }
  }
  selectedUid = null;
  updateSelectionBar();
  emit('neko:selected-changed');
}

export function getSelectedUid() {
  return threeReady ? selectedUid : null;
}

export function selectCatByUid(uid) {
  if (threeReady && cats.has(uid)) selectCat(uid);
}

export function petCatByUid(uid) {
  if (!threeReady) return;
  const cat = cats.get(uid);
  const entry = gameState.visitingCats.find((c) => c.uid === uid);
  if (!cat || !entry) return;
  const known = gameState.catdex.some((c) => c.name === entry.name);
  if (!known) {
    gameState.catdex.push({ name: entry.name, image: entry.image });
    notify(`${entry.name} joined your Catdex! +5 Neko Coins`);
  } else {
    notify(`You petted ${entry.name}! +5 Neko Coins`);
  }
  addCoins(5);
  playPurr();
  playHappy();
  cat.reactPet();
  cat.leaveTimer = Math.max(cat.leaveTimer, 20);
  spawnFloat('🪙+5', cat);
  spawnHearts(cat);
  saveState();
  emit('neko:cats-changed');
}

export function feedCatByUid(uid) {
  if (!threeReady) return;
  if (!gameState.inventory.food.length) {
    notify('No treats in inventory — buy some in the shop!');
    return;
  }
  const cat = cats.get(uid);
  if (!cat) return;
  gameState.inventory.food.shift();
  saveState();
  emit('neko:inventory-changed');
  addCoins(10);
  notify('😋 The cat loved the treat! +10 Neko Coins');
  cat.eat(3.5);
  cat.reactEat();
  cat.leaveTimer = Math.max(cat.leaveTimer, 25);
  eatSoundT.set(uid, performance.now() + 400);
  spawnFloat('🪙+10', cat);
  spawnHearts(cat);
}

export function shooCat(uid) {
  if (!threeReady) return;
  const cat = cats.get(uid);
  if (!cat) return;
  startLeave(cat);
  playPop();
  if (selectedUid === uid) deselect();
}

function updateSelectionBar() {
  const bar = document.getElementById('selection-bar');
  const cat = selectedUid ? cats.get(selectedUid) : null;
  if (!cat) {
    bar.classList.add('hidden');
    return;
  }
  bar.classList.remove('hidden');
  document.getElementById('sel-avatar').src = cat.entry.image;
  document.getElementById('sel-name').textContent = cat.entry.name;
  document.getElementById('act-feed').disabled = gameState.inventory.food.length === 0;
}

document.getElementById('act-pet').addEventListener('click', () => {
  if (selectedUid) petCatByUid(selectedUid);
});
document.getElementById('act-feed').addEventListener('click', () => {
  if (selectedUid) feedCatByUid(selectedUid);
});
document.getElementById('act-call').addEventListener('click', () => {
  const cat = selectedUid ? cats.get(selectedUid) : null;
  if (cat) {
    cat.follow();
    cat.pinned = true;
    notify(`📣 You called ${cat.entry.name}!`);
    playPop();
  }
});
document.getElementById('act-shoo').addEventListener('click', () => {
  if (selectedUid) shooCat(selectedUid);
});

window.addEventListener('neko:inventory-changed', () => updateSelectionBar());

function findInventoryEntry(uid) {
  for (const kind of ['food', 'toys']) {
    const idx = gameState.inventory[kind].findIndex((i) => i.uid === uid);
    if (idx >= 0) return { kind, idx };
  }
  return null;
}

export function placeItem(uid) {
  if (!threeReady) return;
  const entry = findInventoryEntry(uid);
  if (!entry) return;
  const [item] = gameState.inventory[entry.kind].splice(entry.idx, 1);
  const pos = { x: (Math.random() - 0.5) * 5.5, z: (Math.random() - 0.5) * 3 + 0.6 };
  const mesh = makeItemMesh(item);
  mesh.position.set(pos.x, 0.32, pos.z);
  mesh.traverse((o) => {
    o.castShadow = true;
  });
  scene.add(mesh);
  itemMeshes.set(item.uid, mesh);
  gameState.placedItems.push({ ...item, kind: entry.kind, x: pos.x, z: pos.z });
  saveState();
  emit('neko:inventory-changed');
  notify(`🧺 Placed ${item.name} on the porch!`);
  const idle = [...cats.values()].filter((c) => c.state === 'idle' || c.state === 'sit');
  if (idle.length) {
    const cat = idle[Math.floor(Math.random() * idle.length)];
    if (mesh.userData.isToy) {
      cat.playGoal = mesh;
      cat.walkTo(pos.x + 0.4, pos.z + 0.4);
    } else {
      cat.walkTo(pos.x + 1.2, pos.z);
    }
  }
}

export function removePlaced(uid) {
  if (!threeReady) return;
  const idx = gameState.placedItems.findIndex((i) => i.uid === uid);
  if (idx < 0) return;
  const [item] = gameState.placedItems.splice(idx, 1);
  const mesh = itemMeshes.get(uid);
  if (mesh) {
    scene.remove(mesh);
    itemMeshes.delete(uid);
  }
  gameState.inventory[item.kind].push(item);
  saveState();
  emit('neko:inventory-changed');
  notify('📦 Picked up from the porch');
  playPop();
}

function makeSprite(text, size = 56) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  g.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 128);
  const tex = new THREE.CanvasTexture(cv);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(1.3, 1.3, 1);
  return sp;
}

function spawnFloat(text, cat) {
  const sp = makeSprite(text, 64);
  sp.position.copy(cat.root.position).add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 1.6, 0));
  scene.add(sp);
  floats.push({ sp, life: 1.4, max: 1.4, vy: 1.1 });
}

function spawnHearts(cat) {
  for (let i = 0; i < 6; i++) {
    const sp = makeSprite(['💗', '💖', '✨'][i % 3], 46);
    sp.position.copy(cat.root.position).add(
      new THREE.Vector3((Math.random() - 0.5) * 1.3, 1.2 + Math.random() * 0.6, (Math.random() - 0.5) * 0.9)
    );
    scene.add(sp);
    floats.push({
      sp,
      life: 1.2,
      max: 1.2,
      vy: 0.9,
      drift: new THREE.Vector3((Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.4)
    });
  }
}

function updateFloats(dt) {
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i];
    f.life -= dt;
    if (f.life <= 0) {
      scene.remove(f.sp);
      floats.splice(i, 1);
      continue;
    }
    f.sp.position.y += f.vy * dt;
    if (f.drift) {
      f.sp.position.x += f.drift.x * dt;
      f.sp.position.z += f.drift.z * dt;
    }
    f.sp.material.opacity = Math.min(1, f.life / (f.max * 0.55));
  }
}

function updateZzz(cat, dt) {
  if (cat.sleeping) {
    let sp = zzz.get(cat.uid);
    if (!sp) {
      sp = makeSprite('💤', 42);
      scene.add(sp);
      sp.userData.phase = Math.random() * 10;
      zzz.set(cat.uid, sp);
    }
    sp.userData.phase += dt * 2;
    sp.position.set(
      cat.root.position.x + Math.sin(sp.userData.phase) * 0.22,
      1.6 + Math.sin(sp.userData.phase * 0.8) * 0.25,
      cat.root.position.z
    );
  } else {
    const sp = zzz.get(cat.uid);
    if (sp) {
      scene.remove(sp);
      zzz.delete(cat.uid);
    }
  }
}

function updateCats(dt) {
  for (const [uid, cat] of cats) {
    cat.update(dt);
    const done = cat.consumeJustFinished();
    if (done === 'arrive' || done === 'walk') {
      if (cat.playGoal) {
        const goal = cat.playGoal;
        cat.playGoal = null;
        cat.play(4.5);
        playMeow(0.3);
        cat.leaveTimer = Math.max(cat.leaveTimer, 15);
        if (goal.userData.isToy) playPop();
      } else if (Math.random() < 0.28) {
        cat.sleep(5 + Math.random() * 6);
      } else {
        cat.sit();
      }
    } else if (done === 'sit') {
      if (Math.random() < 0.35) cat.sleep(5 + Math.random() * 6);
      else wander(cat);
    } else if (done === 'sleep') {
      wander(cat);
    } else if (done === 'eat') {
      wander(cat);
    } else if (done === 'play') {
      addCoins(1);
      spawnFloat('🪙+1', cat);
      playChime();
      wander(cat);
    } else if (done === 'follow') {
      cat.pinned = false;
      wander(cat);
    } else if (done === 'leave') {
      removeCat(uid);
      continue;
    }

    if (cat.state === 'eat' && eatSoundT.has(uid)) {
      const now = performance.now();
      if (now >= eatSoundT.get(uid)) {
        playEat();
        eatSoundT.set(uid, now + 520);
      }
    } else if (eatSoundT.has(uid)) {
      eatSoundT.delete(uid);
    }

    if (!cat.pinned && cat.state !== 'leave' && cat.leaveTimer <= 0) {
      startLeave(cat);
    }

    if (cat.state === 'follow') {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0;
      cat.target.copy(camera.position).addScaledVector(dir, 3);
      cat.target.y = 0;
    }

    if (!cat.isBusy) {
      const next = meowSoundT.get(uid) || performance.now() + 12000 + Math.random() * 15000;
      if (performance.now() >= next) {
        playMeow(0.3);
        meowSoundT.set(uid, performance.now() + 12000 + Math.random() * 15000);
      }
    }

    updateZzz(cat, dt);
  }
}

function updateItems(t) {
  itemMeshes.forEach((mesh) => {
    if (mesh.userData.anim) mesh.userData.anim(mesh, t);
  });
}

function updateAmbient(dt) {
  spawnT -= dt;
  if (spawnT <= 0) {
    spawnT = 6 + Math.random() * 5;
    if (gameState.visitingCats.length < 4 && Math.random() < 0.7) spawnCat();
  }
  birdT -= dt;
  if (birdT <= 0) {
    birdT = 10 + Math.random() * 15;
    playBird();
  }
}

function updateIntro(now) {
  if (!intro.active) return;
  const p = Math.min(1, (now - intro.t0) / intro.duration);
  const e = p * p * (3 - 2 * p);
  const start = new THREE.Vector3(0, 22, 34);
  const end = defaultCamPos();
  camera.position.lerpVectors(start, end, e);
  const tStart = new THREE.Vector3(0, 1.5, 0);
  camTarget.lerpVectors(tStart, new THREE.Vector3(0, 1.2, 0), e);
  camera.lookAt(camTarget);
  if (p >= 1) intro.active = false;
}

export function beginIntro(skip = false) {
  if (!threeReady) return;
  intro.active = true;
  intro.t0 = performance.now();
  intro.duration = skip ? 1500 : 4200;
  spawnCat();
  spawnCat();
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function quadBezier(p0, p1, p2, t) {
  const u = 1 - t;
  return new THREE.Vector3(
    u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    u * u * p0.z + 2 * u * t * p1.z + t * t * p2.z
  );
}

const INSIDE_POS = new THREE.Vector3(1.4, 3.9, -5.3);
const INSIDE_TARGET = new THREE.Vector3(0, 0.5, -3.8);
const OUTSIDE_POS = new THREE.Vector3(6.89, 6.64, 8.68);
const OUTSIDE_TARGET = new THREE.Vector3(0, 1.2, 0);
const DOOR_WAY = new THREE.Vector3(0.2, 1.15, -2.1);

function toggleHouse() {
  if (transition.active || !threeReady) return;
  const entering = !insideMode;
  transition.active = true;
  transition.entering = entering;
  transition.t0 = performance.now();
  transition.duration = 2200;
  transition.fromPos = camera.position.clone();
  transition.fromTarget = camTarget.clone();
  transition.midPos = DOOR_WAY;
  transition.toPos = entering ? INSIDE_POS : OUTSIDE_POS;
  transition.toTarget = entering ? INSIDE_TARGET.clone() : OUTSIDE_TARGET.clone();
  playPop();
}

function updateTransition(now) {
  if (!transition.active) return;
  const p = Math.min(1, (now - transition.t0) / transition.duration);
  const e = easeInOutCubic(p);
  camera.position.copy(quadBezier(transition.fromPos, transition.midPos, transition.toPos, e));
  const target = new THREE.Vector3().lerpVectors(transition.fromTarget, transition.toTarget, e);
  camera.lookAt(target);

  const open = transition.entering ? 1.9 : -1.9;
  doorPivot.rotation.y = (transition.entering ? e : 1 - e) * open;

  if (p >= 1) {
    transition.active = false;
    insideMode = transition.entering;
    exteriorGroup.visible = !insideMode;
    interiorGroup.visible = insideMode;
    doorPivot.rotation.y = 0;
    camTarget.copy(transition.toTarget);
    camRadius = insideMode ? 4.0 : 12;
    camPhi = insideMode ? 0.55 : 1.1;
    camTheta = insideMode ? 2.4 : 0.7;
    updateHint();
    if (insideMode) notify('🏠 Welcome home!');
    else notify('🌤️ Back out on the porch!');
    playPop();
    const selected = selectedUid ? cats.get(selectedUid) : null;
    if (selected) {
      const dest = insideMode ? { x: 0.4, z: -3.2 } : { x: 0, z: 0.8 };
      selected.playGoal = null;
      selected.walkTo(dest.x, dest.z);
    }
  }
}

function maxInsideRadius() {
  const rx = 3.3 - Math.abs(camTarget.x);
  const rzF = -1.7 - camTarget.z;
  const rzB = -5.95 - camTarget.z;
  const horiz = Math.min(rx, rzF, rzB);
  return Math.max(1.2, horiz / Math.max(Math.sin(camPhi), 0.3));
}

function updateHint() {
  const el = document.getElementById('hud-hint');
  if (!el) return;
  el.textContent = insideMode
    ? 'Click the door 🚪 to step back outside · click a cat to pet it'
    : 'Click the door 🚪 to go inside · click a cat to select it · click the ground to send it';
}

let cutaway = 0;

function updateCutaway(dt) {
  let t = 0;
  if (insideMode) {
    const y = camera.position.y;
    t = y > 2.75 ? 1 : y > 2.2 ? (y - 2.2) / 0.55 : 0;
  }
  cutaway = THREE.MathUtils.damp(cutaway, t, 6, dt);
  setCutaway(cutaway);
}

function updateCamera(dt) {
  if (transition.active) return;
  if (!intro.active) {
    if (selectedUid && cats.has(selectedUid)) {
      const c = cats.get(selectedUid);
      camTarget.lerp(new THREE.Vector3(c.root.position.x, 1.2, c.root.position.z), 0.06);
    } else {
      camTarget.lerp(new THREE.Vector3(0, 1.2, 0), 0.015);
    }
    if (insideMode) {
      camTarget.x = THREE.MathUtils.clamp(camTarget.x, -2.8, 2.8);
      camTarget.z = THREE.MathUtils.clamp(camTarget.z, -5.7, -2.4);
      camRadius = THREE.MathUtils.clamp(camRadius, 1.5, maxInsideRadius());
      camPhi = THREE.MathUtils.clamp(camPhi, 0.4, 1.32);
    }
    clampTarget();
    applyCamera();
  }
}

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function handleClick(e) {
  if (transition.active) return;
  const rect = container.getBoundingClientRect();
  ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);

  const doorHits = raycaster.intersectObjects([doorGroup], true);
  if (doorHits.length) {
    toggleHouse();
    return;
  }

  const itemHits = raycaster.intersectObjects([...itemMeshes.values()], true);
  if (itemHits.length) {
    let obj = itemHits[0].object;
    while (obj && !obj.userData.itemUid) obj = obj.parent;
    if (obj) {
      removePlaced(obj.userData.itemUid);
      return;
    }
  }

  const catHits = raycaster.intersectObjects(catRoots, true);
  if (catHits.length) {
    let obj = catHits[0].object;
    while (obj && !obj.userData.catUid) obj = obj.parent;
    if (obj) {
      selectCat(obj.userData.catUid);
      playPop();
      return;
    }
  }

  const ghits = raycaster.intersectObject(ground);
  if (ghits.length) {
    const p = ghits[0].point;
    if (selectedUid && cats.has(selectedUid)) {
      const cat = cats.get(selectedUid);
      cat.playGoal = null;
      cat.walkTo(p.x, p.z);
      cat.leaveTimer = Math.max(cat.leaveTimer, 20);
      playPop();
    } else {
      deselect();
    }
  }
}

let dragging = false;
let dragMode = 0;
let lastX = 0;
let lastY = 0;
let moved = 0;

function registerListeners() {
  dom.addEventListener('pointerdown', (e) => {
    if (transition.active) return;
    dragging = true;
    dragMode = e.button === 0 ? 0 : 1;
    lastX = e.clientX;
    lastY = e.clientY;
    moved = 0;
    dom.setPointerCapture(e.pointerId);
  });

  dom.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (dragMode === 0) {
      camTheta -= dx * 0.005;
      camPhi = THREE.MathUtils.clamp(camPhi - dy * 0.004, 0.25, 1.4);
    } else {
      const fwd = new THREE.Vector3().subVectors(camTarget, camera.position).setY(0).normalize();
      const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
      const scale = camRadius * 0.0012;
      camTarget.addScaledVector(fwd, -dy * scale);
      camTarget.addScaledVector(right, -dx * scale);
      clampTarget();
    }
    if (insideMode) {
      camRadius = THREE.MathUtils.clamp(camRadius, 1.5, maxInsideRadius());
      camPhi = THREE.MathUtils.clamp(camPhi, 0.4, 1.32);
      camTarget.x = THREE.MathUtils.clamp(camTarget.x, -2.8, 2.8);
      camTarget.z = THREE.MathUtils.clamp(camTarget.z, -5.7, -2.4);
    }
  });

  dom.addEventListener('pointerup', (e) => {
    dragging = false;
    if (moved < 6) handleClick(e);
  });

  dom.addEventListener('wheel', (e) => {
    e.preventDefault();
    camRadius = camRadius * Math.exp(e.deltaY * 0.0012);
    if (insideMode) {
      camRadius = THREE.MathUtils.clamp(camRadius, 1.5, maxInsideRadius());
    } else {
      camRadius = THREE.MathUtils.clamp(camRadius, 5, 30);
    }
  }, { passive: false });

  dom.addEventListener('contextmenu', (e) => e.preventDefault());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') deselect();
  });

  window.addEventListener('resize', resize);
}

export function refreshSize() {
  if (!threeReady) return;
  resize();
}

function resize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

document.addEventListener('pointerdown', resumeAudio, { once: true });

let last = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  updateIntro(now);
  updateTransition(now);
  updateCats(dt);
  updateItems(now / 1000);
  updateFloats(dt);
  updateAmbient(dt);
  updateCamera(dt);
  updateCutaway(dt);

  if (container.offsetParent !== null) renderer.render(scene, camera);
}

export function initScene() {
  if (threeReady) return;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    dom = renderer.domElement;

    scene = new THREE.Scene();
    const world = buildWorld(scene);
    ground = world.ground;
    exteriorGroup = world.exterior;
    doorGroup = world.doorGroup;
    doorPivot = world.doorPivot;

    interiorGroup = buildInterior();
    interiorGroup.visible = false;
    scene.add(interiorGroup);

    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    applyCamera();
    updateHint();

    threeReady = true;
    registerListeners();

    resize();
    gameState.visitingCats.forEach((entry) => {
      const cat = spawnCat(entry);
      if (cat) cat.pinned = false;
    });
    gameState.placedItems.forEach((item) => {
      const mesh = makeItemMesh(item);
      mesh.position.set(item.x ?? (Math.random() - 0.5) * 5.5, 0.32, item.z ?? 0.6);
      mesh.traverse((o) => {
        o.castShadow = true;
      });
      scene.add(mesh);
      itemMeshes.set(item.uid, mesh);
    });
    spawnCat();
    spawnCat();
    requestAnimationFrame(animate);
  } catch (err) {
    console.error('3D failed to start:', err);
    notify(`⚠️ 3D failed to start: ${err.message}`);
  }
}
