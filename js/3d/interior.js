import * as THREE from 'three';

function mat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function box(w, h, d, color, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.castShadow = opts.castShadow !== false;
  m.receiveShadow = true;
  m.position.set(opts.x ?? 0, opts.y ?? 0, opts.z ?? 0);
  return m;
}

function cyl(rt, rb, h, color, x, y, z, opts = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 14), mat(color));
  m.castShadow = opts.castShadow !== false;
  m.receiveShadow = true;
  m.position.set(x, y, z);
  return m;
}

function sph(r, color, x, y, z, opts = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat(color));
  m.castShadow = opts.castShadow !== false;
  m.position.set(x, y, z);
  return m;
}

const cutawayMats = [];
const interiorWindows = [];

function wallBox(w, h, d, color, x, y, z, isWindow = false) {
  const m = box(w, h, d, color, { x, y, z });
  cutawayMats.push(m.material);
  if (isWindow) interiorWindows.push(m.material);
  return m;
}

export function setCutaway(t) {
  cutawayMats.forEach((m) => {
    m.transparent = t > 0;
    m.opacity = 1 - t * 0.88;
    m.depthWrite = t < 0.5;
  });
}

export function buildInterior() {
  const g = new THREE.Group();

  const floor = box(6.9, 0.1, 4.4, 0xc99a62, { x: 0, y: -0.05, z: -3.8, castShadow: false });
  g.add(floor);

  g.add(wallBox(6.9, 0.12, 4.4, 0xfff7ea, 0, 2.66, -3.8));

  const wallColor = 0xfff2dd;

  g.add(wallBox(6.9, 2.6, 0.12, wallColor, 0, 1.3, -6.05));
  g.add(wallBox(0.12, 2.6, 4.4, wallColor, -3.45, 1.3, -3.8));
  g.add(wallBox(0.12, 2.6, 4.4, wallColor, 3.45, 1.3, -3.8));

  g.add(wallBox(2.7, 2.6, 0.12, wallColor, -2.1, 1.3, -1.55));
  g.add(wallBox(2.7, 2.6, 0.12, wallColor, 2.1, 1.3, -1.55));
  g.add(wallBox(1.6, 0.5, 0.12, wallColor, 0, 2.35, -1.55));

  g.add(wallBox(0.14, 2.2, 0.14, 0xe8d3b8, -0.72, 1.1, -1.55));
  g.add(wallBox(0.14, 2.2, 0.14, 0xe8d3b8, 0.72, 1.1, -1.55));

  g.add(wallBox(2.6, 1.25, 0.12, wallColor, -2.05, 0.63, -4.05));

  const windowColor = 0xbfe8ff;
  const windowFrame = 0xffffff;
  g.add(wallBox(1.2, 1.0, 0.08, windowColor, -2.0, 1.7, -5.99, true));
  g.add(wallBox(1.35, 0.12, 0.08, windowFrame, -2.0, 1.7, -5.97));
  g.add(wallBox(0.12, 1.15, 0.08, windowFrame, -2.0, 1.7, -5.97));
  g.add(wallBox(1.2, 1.0, 0.08, windowColor, 2.4, 1.7, -5.99, true));
  g.add(wallBox(1.35, 0.12, 0.08, windowFrame, 2.4, 1.7, -5.97));
  g.add(wallBox(0.12, 1.15, 0.08, windowFrame, 2.4, 1.7, -5.97));
  g.add(wallBox(0.08, 1.1, 1.4, windowColor, -3.41, 1.7, -2.7, true));
  g.add(wallBox(0.08, 1.25, 1.55, windowFrame, -3.41, 1.7, -2.7));

  const sofa = new THREE.Group();
  sofa.position.set(-3.0, 0, -2.7);
  const sofaBase = box(0.85, 0.42, 2.0, 0xf2a0b8, { x: 0.4, y: 0.21, z: 0 });
  const sofaBack = box(0.28, 0.75, 2.0, 0xea8fae, { x: 0.14, y: 0.55, z: 0 });
  const armL = box(0.3, 0.55, 0.28, 0xea8fae, { x: 0.42, y: 0.3, z: -0.95 });
  const armR = box(0.3, 0.55, 0.28, 0xea8fae, { x: 0.42, y: 0.3, z: 0.95 });
  const c1 = box(0.5, 0.18, 0.82, 0xf7c7d6, { x: 0.65, y: 0.41, z: -0.45 });
  const c2 = box(0.5, 0.18, 0.82, 0xf7c7d6, { x: 0.65, y: 0.41, z: 0.45 });
  sofa.add(sofaBase, sofaBack, armL, armR, c1, c2);
  g.add(sofa);

  g.add(cyl(1.5, 1.5, 0.03, 0xf9d8e0, -1.8, 0.02, -2.7, { castShadow: false }));
  g.add(cyl(0.55, 0.55, 0.06, 0xcdb4db, -1.8, 0.48, -2.7));
  g.add(cyl(0.08, 0.11, 0.42, 0xb89ad0, -1.8, 0.26, -2.7));

  const tvScreen = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.72, 0.06),
    new THREE.MeshBasicMaterial({ color: 0x9fd8f5 })
  );
  tvScreen.position.set(-0.9, 1.45, -3.97);
  g.add(tvScreen);
  g.add(box(0.1, 0.35, 0.3, 0x8a5a3b, { x: -0.9, y: 1.05, z: -3.97 }));

  g.add(cyl(0.16, 0.12, 0.28, 0xe8846a, -3.05, 0.14, -1.85));
  g.add(cyl(0.03, 0.03, 0.4, 0x6bbf72, -3.05, 0.45, -1.85));
  g.add(sph(0.14, 0x8fd4a0, -3.05, 0.66, -1.85));
  g.add(sph(0.1, 0x9ed9a5, -2.95, 0.74, -1.78));

  g.add(cyl(0.03, 0.03, 1.3, 0x8a8594, -1.1, 0.65, -3.6));
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.24, 12), mat(0xffe0b0));
  lampShade.position.set(-1.1, 1.42, -3.6);
  lampShade.castShadow = false;
  g.add(lampShade);

  const tower = new THREE.Group();
  tower.position.set(-2.85, 0, -3.5);
  tower.add(box(0.5, 0.3, 0.38, 0xf2c3cf, { x: 0, y: 0.15, z: 0 }));
  tower.add(box(0.42, 0.28, 0.32, 0xcdb4db, { x: 0, y: 0.44, z: 0 }));
  tower.add(box(0.34, 0.26, 0.26, 0xf2a0c0, { x: 0, y: 0.71, z: 0 }));
  g.add(tower);

  const bedFrame = box(2.3, 0.35, 1.5, 0xcdb4db, { x: -2.0, y: 0.175, z: -5.45 });
  const mattress = box(2.15, 0.25, 1.35, 0xffffff, { x: -2.0, y: 0.475, z: -5.45 });
  const pillow1 = box(0.6, 0.14, 0.38, 0xf9e8d8, { x: -2.7, y: 0.62, z: -5.62 });
  const pillow2 = box(0.6, 0.14, 0.38, 0xf9e8d8, { x: -1.3, y: 0.62, z: -5.62 });
  const blanket = box(1.7, 0.12, 1.3, 0xf2a0b8, { x: -2.25, y: 0.62, z: -5.3 });
  const headboard = box(2.3, 0.8, 0.1, 0xb89ad0, { x: -2.0, y: 0.75, z: -5.85 });
  g.add(bedFrame, mattress, pillow1, pillow2, blanket, headboard);

  g.add(box(0.5, 0.5, 0.4, 0xc98d57, { x: -0.62, y: 0.25, z: -5.5 }));
  g.add(cyl(0.04, 0.04, 0.22, 0x8a8594, -0.62, 0.61, -5.5));
  const nightLamp = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.14, 10), mat(0xffe0b0));
  nightLamp.position.set(-0.62, 0.75, -5.5);
  nightLamp.castShadow = false;
  g.add(nightLamp);

  const wardrobe = box(1.1, 2.0, 0.55, 0xdfb98a, { x: -3.1, y: 1.0, z: -4.55 });
  g.add(wardrobe);
  g.add(box(0.48, 1.8, 0.05, 0xc98d57, { x: -3.3, y: 1.0, z: -4.26 }));
  g.add(box(0.48, 1.8, 0.05, 0xc98d57, { x: -2.9, y: 1.0, z: -4.26 }));

  g.add(cyl(1.15, 1.15, 0.03, 0xe0d2f5, -2.0, 0.02, -4.9, { castShadow: false }));

  g.add(box(2.7, 0.9, 0.65, 0xf7e8d0, { x: 2.0, y: 0.45, z: -5.5 }));
  g.add(box(2.8, 0.06, 0.75, 0xfff7ea, { x: 2.0, y: 0.93, z: -5.5 }));
  g.add(box(0.65, 0.9, 1.4, 0xf7e8d0, { x: 3.1, y: 0.45, z: -4.45 }));
  g.add(box(0.75, 0.06, 1.5, 0xfff7ea, { x: 3.1, y: 0.93, z: -4.45 }));

  const stove = box(0.7, 0.04, 0.7, 0x4a3a2e, { x: 2.9, y: 0.96, z: -5.5 });
  g.add(stove);
  for (const bx of [-0.2, 0.2]) {
    for (const bz of [-0.2, 0.2]) {
      g.add(cyl(0.09, 0.09, 0.02, 0x2b2b33, 2.9 + bx, 0.99, -5.5 + bz, { castShadow: false }));
    }
  }
  g.add(box(0.6, 0.55, 0.5, 0x8a8594, { x: 2.9, y: 0.68, z: -5.08 }));
  g.add(cyl(0.05, 0.05, 0.06, 0x9db8c4, 1.1, 0.97, -5.25, { castShadow: false }));
  g.add(box(0.55, 0.05, 0.45, 0x9db8c4, { x: 1.1, y: 0.97, z: -5.5 }));
  g.add(cyl(0.025, 0.025, 0.25, 0x9db8c4, 1.25, 1.08, -5.5, { castShadow: false }));

  g.add(box(0.85, 1.9, 0.8, 0xf2f6f4, { x: 3.2, y: 0.95, z: -2.9 }));
  g.add(box(0.06, 0.5, 0.04, 0x9db8c4, { x: 3.55, y: 1.1, z: -2.9 }));

  g.add(box(0.85, 0.55, 0.32, 0xe8d3b8, { x: 1.1, y: 1.78, z: -5.5 }));
  g.add(box(0.85, 0.55, 0.32, 0xe8d3b8, { x: 2.0, y: 1.78, z: -5.5 }));
  g.add(box(0.85, 0.55, 0.32, 0xe8d3b8, { x: 2.9, y: 1.78, z: -5.5 }));

  g.add(cyl(0.8, 0.8, 0.06, 0xd9a066, 2.2, 0.83, -2.9));
  g.add(cyl(0.1, 0.13, 0.75, 0xc98d57, 2.2, 0.46, -2.9));

  const chairColor = [0xcdb4db, 0xf2c3cf, 0xbfe3d0];
  const chairPos = [[2.2, -2.15], [1.35, -2.9], [3.05, -2.9]];
  chairPos.forEach(([cx, cz], i) => {
    const chair = new THREE.Group();
    chair.position.set(cx, 0, cz);
    chair.rotation.y = i * 1.05;
    const seat = box(0.45, 0.06, 0.45, chairColor[i], { x: 0, y: 0.53, z: 0 });
    const back = box(0.06, 0.55, 0.4, chairColor[i], { x: -0.18, y: 0.85, z: 0 });
    chair.add(seat, back);
    for (const lx of [-0.15, 0.15]) {
      for (const lz of [-0.15, 0.15]) {
        chair.add(cyl(0.025, 0.025, 0.5, 0xc98d57, lx, 0.25, lz, { castShadow: false }));
      }
    }
    g.add(chair);
  });

  g.add(cyl(1.15, 1.15, 0.03, 0xd5f0e4, 2.2, 0.02, -2.9, { castShadow: false }));

  g.add(new THREE.AmbientLight(0xfff2e0, 0.55));

  const p1 = new THREE.PointLight(0xffd9a0, 0.9, 7);
  p1.position.set(-1.5, 2.3, -2.8);
  g.add(p1);
  const p2 = new THREE.PointLight(0xffd9a0, 0.8, 6);
  p2.position.set(2.2, 2.3, -4.8);
  g.add(p2);
  const p3 = new THREE.PointLight(0xffd9a0, 0.55, 5);
  p3.position.set(2.2, 2.2, -2.9);
  g.add(p3);

  const interiorAmbient = g.children.find((c) => c.isAmbientLight);
  const interiorPoints = [p1, p2, p3];
  p1.userData.baseIntensity = 0.9;
  p2.userData.baseIntensity = 0.8;
  p3.userData.baseIntensity = 0.55;
  const dayWindowC = new THREE.Color(0xbfe8ff);
  const nightWindowC = new THREE.Color(0x33335c);

  setInteriorNightRefs = {
    ambient: interiorAmbient,
    points: interiorPoints,
    dayWindowC,
    nightWindowC
  };

  const pendant = (x, z) => {
    g.add(cyl(0.02, 0.02, 0.25, 0x4a3a2e, x, 2.5, z, { castShadow: false }));
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.22, 12), mat(0xffe0b0));
    shade.position.set(x, 2.35, z);
    shade.castShadow = false;
    g.add(shade);
  };
  pendant(-1.5, -2.8);
  pendant(2.2, -4.8);
  pendant(2.2, -2.9);

  return g;
}

let setInteriorNightRefs = null;

export function setInteriorNight(t) {
  if (!setInteriorNightRefs) return;
  const { ambient, points, dayWindowC, nightWindowC } = setInteriorNightRefs;
  ambient.intensity = 0.55 - 0.3 * t;
  points.forEach((p) => {
    p.intensity = p.userData.baseIntensity * (0.6 + 0.9 * t);
  });
  interiorWindows.forEach((m) => m.color.lerpColors(dayWindowC, nightWindowC, t));
}
