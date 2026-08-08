import * as THREE from 'three';

function mat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function bowlMesh(foodColor) {
  const g = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.2, 16), mat(0xf7e8d0));
  bowl.position.y = 0.1;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 20), mat(0xeed7b3));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.2;
  const food = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(foodColor));
  food.position.y = 0.26;
  food.scale.set(1, 0.6, 1.35);
  g.add(bowl, rim, food);
  return g;
}

function yarnMesh() {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), mat(0xf2a0c0));
  ball.scale.set(1, 0.92, 1);
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 8, 18), mat(0xe883a8));
  ring1.rotation.x = Math.PI / 2.4;
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 8, 18), mat(0xf8c7dd));
  ring2.rotation.z = Math.PI / 3;
  g.add(ball, ring1, ring2);
  g.userData.rings = [ring1, ring2];
  g.userData.anim = (grp, t) => {
    grp.userData.rings.forEach((r, i) => {
      r.rotation.y = t * (i % 2 === 0 ? 1.3 : -1.3);
    });
  };
  return g;
}

function wandMesh() {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8), mat(0xc98d57));
  stick.position.y = 0.5;
  stick.rotation.z = 0.3;
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5, 6), mat(0x9fd8f5));
  f1.position.set(0.35, 0.95, 0);
  f1.rotation.z = -0.7;
  f1.rotation.x = 0.25;
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 6), mat(0xc9a9f0));
  f2.position.set(0.42, 0.85, 0.1);
  f2.rotation.z = -0.55;
  f2.rotation.x = -0.2;
  g.add(stick, f1, f2);
  g.userData.anim = (grp, t) => {
    grp.rotation.y = Math.sin(t * 1.2) * 0.5;
    grp.position.y = 0.32 + Math.abs(Math.sin(t * 1.8)) * 0.1;
  };
  return g;
}

function laserMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.45), mat(0x8fd4f0));
  body.position.y = 0.07;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.28, 8), mat(0xff6b6b));
  tip.rotation.x = Math.PI / 2;
  tip.position.set(0, 0.07, 0.35);
  g.add(body, tip);
  g.userData.anim = (grp, t) => {
    grp.rotation.y = t * 1.6;
  };
  return g;
}

function mouseMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(0xb8b0c0));
  body.scale.set(1.15, 0.85, 1.5);
  body.position.y = 0.13;
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mat(0xd8d0e0));
    ear.position.set(sx * 0.13, 0.22, 0.05);
    g.add(ear);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), mat(0xf2a0b8));
  nose.position.set(0, 0.1, 0.26);
  g.add(nose);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 6), mat(0xd8d0e0));
  tail.position.set(0, 0.16, -0.22);
  tail.rotation.x = 0.9;
  g.add(tail);
  g.userData.anim = (grp, t) => {
    grp.position.y = 0.32 + Math.sin(t * 2.2) * 0.03;
    grp.rotation.y = t * 1.4;
  };
  return g;
}

function towerMesh() {
  const g = new THREE.Group();
  const layers = [
    { w: 1.15, d: 0.85, h: 0.42, y: 0.21, c: 0xf2c3cf },
    { w: 0.95, d: 0.75, h: 0.38, y: 0.61, c: 0xcdb4db },
    { w: 0.75, d: 0.62, h: 0.34, y: 0.97, c: 0xf2a0c0 }
  ];
  for (const layer of layers) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(layer.w, layer.h, layer.d), mat(layer.c));
    box.position.y = layer.y;
    g.add(box);
  }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0xffe3b3));
  ball.position.y = 1.28;
  g.add(ball);
  return g;
}

function genericMesh() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat(0xf2c3cf));
  box.position.y = 0.25;
  g.add(box);
  return g;
}

export function makeItemMesh(item) {
  let g;
  switch (item.id) {
    case 'tuna-bite': g = bowlMesh(0xf0a878); break;
    case 'salmon-snack': g = bowlMesh(0xf7b3ad); break;
    case 'chicken-jerky': g = bowlMesh(0xe8c39e); break;
    case 'shrimp-delight': g = bowlMesh(0xf7a58c); break;
    case 'crab-pate': g = bowlMesh(0xe8846a); break;
    case 'yarn-ball': g = yarnMesh(); break;
    case 'feather-wand': g = wandMesh(); break;
    case 'laser-pointer': g = laserMesh(); break;
    case 'catnip-mouse': g = mouseMesh(); break;
    case 'scratch-tower': g = towerMesh(); break;
    default: g = genericMesh();
  }
  g.userData.itemUid = item.uid;
  g.userData.isToy = !['tuna-bite', 'salmon-snack', 'chicken-jerky', 'shrimp-delight', 'crab-pate'].includes(item.id);
  return g;
}
