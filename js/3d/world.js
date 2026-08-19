import * as THREE from 'three';

const PASTEL_FLOWERS = [0xffc2d1, 0xfff1c2, 0xc2e8ff, 0xffd6c2, 0xd9c2ff, 0xc2ffdd];

function mat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

export function buildWorld(scene) {
  const exterior = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    mat(0xaed9a8)
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = 'ground';
  ground.userData.ground = true;
  scene.add(ground);

  const lightGrass = new THREE.Mesh(
    new THREE.CircleGeometry(14, 40),
    mat(0xbfe3b6)
  );
  lightGrass.rotation.x = -Math.PI / 2;
  lightGrass.position.y = 0.01;
  lightGrass.receiveShadow = true;
  exterior.add(lightGrass);

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(11, 0.32, 7),
    mat(0xd9a066)
  );
  deck.position.set(0, 0.16, 0.5);
  deck.receiveShadow = true;
  deck.castShadow = true;
  exterior.add(deck);

  const step = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.18, 1.1),
    mat(0xc98d57)
  );
  step.position.set(0, 0.09, 3.9);
  step.receiveShadow = true;
  exterior.add(step);

  for (const [x, z] of [[-5.2, 0.5], [5.2, 0.5], [-5.2, 4.1], [5.2, 4.1]]) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 1.1, 8),
      mat(0xc98d57)
    );
    post.position.set(x, 0.55, z);
    post.castShadow = true;
    exterior.add(post);
  }

  for (const [x, z, len] of [[0, 4.1, 8.8], [0, -2.6, 11]]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.12, 0.12),
      mat(0xc98d57)
    );
    rail.position.set(x, 1.0, z);
    rail.castShadow = true;
    exterior.add(rail);
  }

  const house = new THREE.Mesh(
    new THREE.BoxGeometry(7, 3.2, 4.6),
    mat(0xffe6c7)
  );
  house.position.set(0, 1.6, -3.8);
  house.castShadow = true;
  house.receiveShadow = true;
  exterior.add(house);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(5.1, 2.2, 4),
    mat(0xffb3a7)
  );
  roof.position.set(0, 4.3, -3.8);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  exterior.add(roof);

  const fenceColors = [0xffd6c2, 0xc2e8ff, 0xfff1c2, 0xd9c2ff];
  for (let i = 0; i < 8; i++) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.0, 0.16), mat(fenceColors[i % 4]));
    post.position.set(-6.6 + i * 1.6, 0.5, 5.6);
    post.castShadow = true;
    exterior.add(post);
  }
  for (let i = 0; i < 6; i++) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.0, 0.16), mat(fenceColors[i % 4]));
    post.position.set(-7.9, 0.5, 3.8 - i * 1.2);
    post.castShadow = true;
    exterior.add(post);
  }
  for (let i = 0; i < 6; i++) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.0, 0.16), mat(fenceColors[i % 4]));
    post.position.set(7.9, 0.5, 3.8 - i * 1.2);
    post.castShadow = true;
    exterior.add(post);
  }

  const railTop = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.1, 0.1), mat(0xfff0d4));
  railTop.position.set(0, 1.05, 5.6);
  exterior.add(railTop);
  const railLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 6.8), mat(0xfff0d4));
  railLeft.position.set(-7.9, 1.05, 0.8);
  exterior.add(railLeft);
  const railRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 6.8), mat(0xfff0d4));
  railRight.position.set(7.9, 1.05, 0.8);
  exterior.add(railRight);

  const trees = [
    [-11, -8], [11, -7], [-12, 4], [12, 3], [-9, 11], [9, 10], [0, 12.5], [-4, -11], [4, -10]
  ];
  for (const [x, z] of trees) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.42, 1.8, 8),
      mat(0xb07d52)
    );
    trunk.position.set(x, 0.9, z);
    trunk.castShadow = true;
    exterior.add(trunk);
    const green = [0x9ed9a5, 0x8fd4a0, 0xaee8b4][Math.floor(Math.random() * 3)];
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 12, 10),
      mat(green)
    );
    leaves.position.set(x, 2.6, z);
    leaves.scale.y = 1.25;
    leaves.castShadow = true;
    exterior.add(leaves);
  }

  const bushes = [
    [-3.5, 7.5], [3.5, 7.8], [-8.2, -2.5], [8.2, -2], [0, -7.5]
  ];
  for (const [x, z] of bushes) {
    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 10, 8),
      mat(0x8fd4a0)
    );
    bush.position.set(x, 0.7, z);
    bush.scale.set(1.3, 0.9, 1.1);
    bush.castShadow = true;
    exterior.add(bush);
  }

  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 10;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6),
      mat(0x6bbf72)
    );
    stem.position.set(x, 0.25, z);
    exterior.add(stem);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      mat(PASTEL_FLOWERS[Math.floor(Math.random() * PASTEL_FLOWERS.length)])
    );
    head.position.set(x, 0.58, z);
    exterior.add(head);
  }

  const pond = new THREE.Mesh(
    new THREE.CircleGeometry(2.6, 32),
    mat(0x8ecfe6)
  );
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(-8.5, 0.05, 9.5);
  exterior.add(pond);

  const pondRim = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.18, 8, 32),
    mat(0x6fb8d4)
  );
  pondRim.rotation.x = -Math.PI / 2;
  pondRim.position.set(-8.5, 0.08, 9.5);
  exterior.add(pondRim);

  scene.add(exterior);

  const doorGroup = new THREE.Group();
  doorGroup.position.set(0, 0, -1.48);
  doorGroup.userData.door = true;

  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.7, 0, 0);
  doorGroup.add(doorPivot);

  const doorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 2.2, 0.1),
    mat(0x8a5a3b, { side: THREE.DoubleSide })
  );
  doorMesh.position.set(0.7, 1.1, 0);
  doorMesh.castShadow = true;
  doorPivot.add(doorMesh);

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    mat(0xf5d76e)
  );
  knob.position.set(0.5, 1.0, 0.07);
  doorPivot.add(knob);
  const knobInner = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    mat(0xf5d76e)
  );
  knobInner.position.set(0.5, 1.0, -0.07);
  doorPivot.add(knobInner);

  scene.add(doorGroup);

  const hemi = new THREE.HemisphereLight(0xffe9f0, 0xcfe9c8, 0.9);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1d0, 1.3);
  sun.position.set(10, 16, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 50;
  scene.add(sun);

  const warm = new THREE.PointLight(0xffc58a, 0.5, 12);
  warm.position.set(0, 3, -2);
  scene.add(warm);

  const exteriorWindows = [];
  for (const [x, w] of [[-2.4, 1.1], [2.4, 1.1]]) {
    const win = new THREE.Mesh(
      new THREE.BoxGeometry(w, 1.1, 0.1),
      mat(0xbfe8ff)
    );
    win.position.set(x, 2.2, -1.48);
    exterior.add(win);
    exteriorWindows.push(win.material);
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.2, 0.12, 0.08),
      mat(0xffffff)
    );
    frame.position.set(x, 2.2, -1.41);
    exterior.add(frame);
  }

  scene.background = new THREE.Color(0xcfeaff);
  scene.fog = new THREE.Fog(0xcfeaff, 30, 70);

  const starPositions = [];
  for (let i = 0; i < 160; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 45 + Math.random() * 25;
    starPositions.push(Math.cos(a) * r, 16 + Math.random() * 32, Math.sin(a) * r);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, transparent: true, opacity: 0, depthWrite: false })
  );
  scene.add(stars);

  const moonCanvas = document.createElement('canvas');
  moonCanvas.width = moonCanvas.height = 64;
  const mctx = moonCanvas.getContext('2d');
  const mg = mctx.createRadialGradient(32, 32, 6, 32, 32, 30);
  mg.addColorStop(0, 'rgba(255, 250, 235, 1)');
  mg.addColorStop(1, 'rgba(255, 250, 235, 0)');
  mctx.fillStyle = mg;
  mctx.fillRect(0, 0, 64, 64);
  const moon = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(moonCanvas), transparent: true, opacity: 0, depthWrite: false })
  );
  moon.position.set(34, 40, -26);
  moon.scale.set(14, 14, 1);
  scene.add(moon);

  const flyPositions = [];
  for (let i = 0; i < 22; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 9;
    flyPositions.push(Math.cos(a) * r, 0.3 + Math.random() * 1.8, Math.sin(a) * r);
  }
  const flyGeo = new THREE.BufferGeometry();
  flyGeo.setAttribute('position', new THREE.Float32BufferAttribute(flyPositions, 3));
  const fireflies = new THREE.Points(
    flyGeo,
    new THREE.PointsMaterial({
      color: 0xd9ff8a,
      size: 0.42,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  fireflies.position.y = 0.6;
  scene.add(fireflies);

  const daySky = new THREE.Color(0xffe9f0);
  const nightSky = new THREE.Color(0x6a5fa0);
  const dayGround = new THREE.Color(0xcfe9c8);
  const nightGround = new THREE.Color(0x241e3e);
  const dayBg = new THREE.Color(0xcfeaff);
  const nightBg = new THREE.Color(0x1b1632);
  const daySun = new THREE.Color(0xfff1d0);
  const nightSun = new THREE.Color(0x8fa2ff);
  const dayWindow = new THREE.Color(0xbfe8ff);
  const nightWindow = new THREE.Color(0x3a3a66);

  function setNight(t) {
    sun.intensity = 1.3 - 1.18 * t;
    sun.color.lerpColors(daySun, nightSun, t);
    hemi.intensity = 0.9 - 0.55 * t;
    hemi.color.lerpColors(daySky, nightSky, t);
    hemi.groundColor.lerpColors(dayGround, nightGround, t);
    warm.intensity = 0.5 + 0.45 * t;
    scene.background.lerpColors(dayBg, nightBg, t);
    scene.fog.color.copy(scene.background);
    stars.material.opacity = t;
    moon.material.opacity = t;
    fireflies.material.opacity = 0.85 * t;
    exteriorWindows.forEach((m) => m.color.lerpColors(dayWindow, nightWindow, t));
  }

  return { ground, exterior, doorGroup, doorPivot, lights: { setNight, fireflies } };
}
