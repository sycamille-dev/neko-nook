import * as THREE from 'three';

export const CAT_COLORS = [0xf7dcb8, 0xf0a868, 0xb8c0cc, 0xa5744f, 0xf5f1ea, 0x8a8594, 0xf2c3cf, 0xbfe3d0];

const eyeWhiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
const pupilMat = new THREE.MeshLambertMaterial({ color: 0x2b2b33 });
const noseMat = new THREE.MeshLambertMaterial({ color: 0xf2a0b8 });
const innerEarMat = new THREE.MeshLambertMaterial({ color: 0xf8c7dd });
const whiskerMat = new THREE.MeshBasicMaterial({ color: 0x4a3a2e });

export class Cat3D {
  constructor(entry) {
    this.entry = entry;
    this.uid = entry.uid;
    this.state = 'idle';
    this.timedState = false;
    this.stateTimer = 0;
    this.justFinished = null;
    this.target = new THREE.Vector3(0, 0, 0);
    this.speed = 1.9;
    this.walkPhase = Math.random() * Math.PI * 2;
    this.t = 0;
    this.leaveTimer = 28 + Math.random() * 18;
    this.sleeping = false;
    this.hopT = 0;
    this.nomT = 0;
    this.tailUp = 0;
    this.followUntil = 0;
    this.playGoal = null;
    this.isWalking = false;
    this.blinkT = Math.random() * 3;
    this.blinkDur = 0;
    this.heading = Math.random() * Math.PI * 2;

    const color = CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)];
    this.cm = new THREE.MeshLambertMaterial({ color });
    this.root = this.build();
    this.root.userData.catUid = this.uid;
  }

  build() {
    const root = new THREE.Group();
    const pivot = new THREE.Group();
    root.add(pivot);
    this.pivot = pivot;

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), this.cm);
    body.scale.set(1, 0.85, 1.3);
    body.position.y = 0.42;
    body.castShadow = true;
    pivot.add(body);

    const head = new THREE.Group();
    head.name = 'head';
    head.position.set(0, 0.68, 0.6);
    pivot.add(head);
    this.head = head;

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), this.cm);
    headMesh.castShadow = true;
    head.add(headMesh);

    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 6), this.cm);
      ear.position.set(0.16 * sx, 0.26, -0.02);
      ear.rotation.z = -0.22 * sx;
      head.add(ear);
      const inner = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), innerEarMat);
      inner.position.set(0.16 * sx, 0.18, 0.02);
      head.add(inner);
    }

    this.eyeL = this.makeEye(-0.13);
    this.eyeR = this.makeEye(0.13);
    head.add(this.eyeL.group);
    head.add(this.eyeR.group);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), noseMat);
    nose.position.set(0, -0.02, 0.32);
    head.add(nose);

    for (const sx of [-1, 1]) {
      for (const wy of [-0.02, 0.07]) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.008, 0.008), whiskerMat);
        w.position.set(sx * 0.26, wy, 0.29);
        w.rotation.z = -0.35 * sx;
        w.rotation.y = sx * 0.35;
        head.add(w);
      }
    }

    this.legs = [];
    const legGeo = new THREE.CapsuleGeometry(0.07, 0.32, 4, 8);
    const legPositions = [[-0.22, 0.55], [0.22, 0.55], [-0.22, -0.55], [0.22, -0.55]];
    for (const [lx, lz] of legPositions) {
      const lp = new THREE.Group();
      lp.position.set(lx, 0.16, lz);
      const leg = new THREE.Mesh(legGeo, this.cm);
      leg.position.y = 0.2;
      leg.castShadow = true;
      lp.add(leg);
      pivot.add(lp);
      this.legs.push({ pivot: lp, front: lz > 0 });
    }

    const tail = new THREE.Group();
    tail.name = 'tail';
    tail.position.set(0, 0.5, -0.72);
    pivot.add(tail);
    this.tail = tail;
    this.tailBones = [];
    for (let i = 0; i < 6; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(0.085 - i * 0.012, 8, 6), this.cm);
      seg.castShadow = true;
      tail.add(seg);
      this.tailBones.push(seg);
    }

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 0.86, 28),
      new THREE.MeshBasicMaterial({ color: 0xffe3b3, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    ring.visible = false;
    root.add(ring);
    this.ring = ring;

    return root;
  }

  makeEye(sx) {
    const group = new THREE.Group();
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), eyeWhiteMat);
    white.position.set(sx, 0.09, 0.3);
    group.add(white);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), pupilMat);
    pupil.position.set(sx, 0.09, 0.38);
    group.add(pupil);
    return { group, white, pupil };
  }

  setTarget(x, z) {
    this.target.set(x, 0, z);
  }

  walkTo(x, z) {
    this.state = 'walk';
    this.timedState = false;
    this.setTarget(x, z);
  }

  arrive(x, z) {
    this.state = 'arrive';
    this.timedState = false;
    this.setTarget(x, z);
  }

  sit() {
    this.state = 'sit';
    this.timedState = true;
    this.stateTimer = 3 + Math.random() * 4;
  }

  sleep(sec) {
    this.state = 'sleep';
    this.timedState = true;
    this.stateTimer = sec;
    this.sleeping = true;
  }

  eat(sec) {
    this.state = 'eat';
    this.timedState = true;
    this.stateTimer = sec;
  }

  play(sec) {
    this.state = 'play';
    this.timedState = true;
    this.stateTimer = sec;
  }

  follow() {
    this.state = 'follow';
    this.followUntil = this.t + 8;
  }

  leave(x, z) {
    this.state = 'leave';
    this.timedState = false;
    this.setTarget(x, z);
  }

  reactPet() {
    this.hopT = 0.7;
    this.tailUp = 0.9;
  }

  reactEat() {
    this.nomT = 3.2;
  }

  consumeJustFinished() {
    const f = this.justFinished;
    this.justFinished = null;
    return f;
  }

  get isBusy() {
    return !['idle', 'sit'].includes(this.state);
  }

  update(dt) {
    this.t += dt;
    this.leaveTimer -= dt;
    this.hopT = Math.max(0, this.hopT - dt);
    this.nomT = Math.max(0, this.nomT - dt);
    this.tailUp = Math.max(0, this.tailUp - dt * 1.2);

    if (this.timedState) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.timedState = false;
        this.justFinished = this.state;
        this.state = 'idle';
        this.sleeping = false;
      }
    }

    if (this.state === 'follow' && this.t >= this.followUntil && !this.justFinished) {
      this.justFinished = 'follow';
      this.state = 'idle';
    }

    this.updateBlink(dt);
    this.updateTail(dt);
    this.move(dt);
    this.animate(dt);
  }

  move(dt) {
    const moving = ['walk', 'arrive', 'leave', 'follow'].includes(this.state);
    const pos = this.root.position;
    const dx = this.target.x - pos.x;
    const dz = this.target.z - pos.z;
    const dist = Math.hypot(dx, dz);

    if (moving && dist > 0.2) {
      const ang = Math.atan2(dx, dz);
      let diff = ang - this.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.heading += diff * Math.min(1, dt * 7);
      const step = Math.min(this.speed * dt, dist);
      pos.x += Math.sin(this.heading) * step;
      pos.z += Math.cos(this.heading) * step;
      this.root.rotation.y = this.heading;
      this.walkPhase += dt * 8.5;
      this.isWalking = true;
    } else {
      if (moving && !this.justFinished) {
        this.justFinished = this.state;
        this.state = 'idle';
      }
      this.isWalking = false;
    }
  }

  updateBlink(dt) {
    this.blinkT -= dt;
    if (this.blinkT <= 0) {
      this.blinkT = 2.5 + Math.random() * 3.5;
      this.blinkDur = 0.12;
    }
    if (this.blinkDur > 0) {
      this.blinkDur -= dt;
      const s = this.blinkDur > 0 ? 0.08 : 1;
      this.eyeL.pupil.scale.y = s;
      this.eyeR.pupil.scale.y = s;
    } else {
      this.eyeL.pupil.scale.y = 1;
      this.eyeR.pupil.scale.y = 1;
    }
    const hidden = this.sleeping;
    this.eyeL.pupil.visible = !hidden;
    this.eyeR.pupil.visible = !hidden;
  }

  updateTail(dt) {
    const base = this.isWalking ? 0.55 : 0.25;
    this.tail.rotation.y = Math.sin(this.t * 2.4) * base + Math.sin(this.t * 1.1) * 0.12;
    this.tail.rotation.x = this.tailUp * 0.9;
    this.tailBones.forEach((seg, i) => {
      const bend = Math.sin(this.t * 2.4 - i * 0.5) * 0.05 * (i + 1);
      seg.position.set(Math.sin(i * 0.6) * 0.02 * (i + 1) + bend, -i * 0.045, -0.1 * i);
    });
  }

  animate(dt) {
    const sitting = this.state === 'sit' || this.state === 'eat' || this.state === 'play';
    const sitTarget = this.sleeping ? -1.15 : sitting ? -1.05 : 0;
    this.pivot.rotation.x = THREE.MathUtils.damp(this.pivot.rotation.x, sitTarget, 7, dt);

    let squat = this.sleeping ? 0.9 : 1;
    if (this.sleeping) squat += Math.sin(this.t * 3) * 0.015;
    this.pivot.scale.y = THREE.MathUtils.damp(this.pivot.scale.y, squat, 7, dt);

    this.pivot.position.y = this.isWalking ? Math.abs(Math.sin(this.walkPhase)) * 0.05 : 0;

    this.head.position.y = 0.68 + (this.isWalking ? Math.sin(this.walkPhase * 2) * 0.03 : 0);
    if (this.state === 'play') {
      this.legs[1].pivot.rotation.x = Math.sin(this.t * 9) * 0.9;
      this.head.rotation.y = Math.sin(this.t * 4.5) * 0.35;
      this.head.rotation.x = 0;
    } else if (this.nomT > 0) {
      this.head.rotation.x = Math.sin(this.t * 16) * 0.22;
    } else {
      this.head.rotation.x = this.isWalking ? Math.sin(this.walkPhase) * 0.04 : 0;
      this.head.rotation.y = 0;
    }

    if (this.isWalking) {
      this.legs.forEach((l, i) => {
        const dir = l.front ? 1 : -1;
        l.pivot.rotation.x = Math.sin(this.walkPhase + i * Math.PI) * 0.55 * dir;
      });
    } else {
      this.legs.forEach((l, i) => {
        l.pivot.rotation.x = THREE.MathUtils.damp(l.pivot.rotation.x, i === 1 ? 0 : 0, 8, dt);
      });
    }
  }
}
