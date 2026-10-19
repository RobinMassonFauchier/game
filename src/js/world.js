import * as THREE from "three";
import { AMBER, GOLD, ALLY_COLOR, ENEMY_COLOR, ARENA, CAPTURE_RADIUS } from "./config.js";
import { makeOutlineMesh, flat } from "./utils.js";

const OBSIDIAN = 0x1a1512;
const STONE_DARK = 0x2b241e;
const STONE = 0x4a3b2d;

export function buildWorld(scene) {
  const S = ARENA.size, W = ARENA.wall;
  const world = new THREE.Group();
  scene.add(world);

  // Sol
  const floor = flat(STONE_DARK, { w: S, h: 0.5, d: S, y: -0.25 });
  world.add(floor);

  // Grille obsidienne incrustée
  const grid = new THREE.GridHelper(S, 23, 0x1f1813, 0x1f1813);
  grid.position.y = 0.01;
  world.add(grid);

  // Murs
  const walls = [];
  const wallDefs = [
    [0, W / 2, -(S / 2 + W / 2), S + W * 2, W, "z"],
    [0, W / 2, (S / 2 + W / 2), S + W * 2, W, "z"],
    [-(S / 2 + W / 2), W / 2, 0, S, W, "x"],
    [(S / 2 + W / 2), W / 2, 0, S, W, "x"],
  ];
  for (const [x, y, z, len, h, axis] of wallDefs) {
    const w = axis === "z" ? flat(STONE, { w: len, h, d: W, x, y, z }) : flat(STONE, { w: W, h, d: len, x, y, z });
    world.add(w);
    walls.push(w);
  }

  // Bordure lumineuse ambre en haut des murs
  for (const [x, , z, len, h, axis] of wallDefs) {
    const stripGeo = axis === "z"
      ? new THREE.BoxGeometry(len, 0.18, W + 0.1)
      : new THREE.BoxGeometry(W + 0.1, 0.18, len);
    const strip = new THREE.Mesh(stripGeo, new THREE.MeshBasicMaterial({ color: AMBER }));
    strip.position.set(x, h - 0.05, z);
    world.add(strip);
  }

  // Piliers / couverture
  const obstacles = [];
  const pillDefs = [
    [-12, -12], [12, -12], [-12, 12], [12, 12],
    [0, -14], [0, 14], [-16, 0], [16, 0],
  ];
  for (const [px, pz] of pillDefs) {
    const p = flat(STONE, { w: 2.2, h: 4.2, d: 2.2, x: px, y: 2.1, z: pz });
    world.add(p);
    obstacles.push({ x: px, z: pz, hw: 1.1, hd: 1.1 });
    const cap = flat(AMBER, { w: 2.5, h: 0.25, d: 2.5, x: px, y: 4.35, z: pz });
    world.add(cap);
  }
  // Blocs bas
  const blockDefs = [[-6, 6], [6, -6], [-6, -6], [6, 6], [0, 0]];
  for (const [bx, bz] of blockDefs.slice(0, 4)) {
    const b = flat(STONE_DARK, { w: 3.4, h: 1.2, d: 1.4, x: bx, y: 0.6, z: bz });
    world.add(b);
    obstacles.push({ x: bx, z: bz, hw: 1.7, hd: 0.7 });
  }

  // Zone de capture centrale
  const capture = buildCaptureZone();
  world.add(capture.group);

  // Réceptacle d'âme (anneau runique au sol)
  const soulPad = buildSoulPad();
  world.add(soulPad);

  return { walls, obstacles, capture, soulPad };
}

function buildCaptureZone() {
  const group = new THREE.Group();
  const ringGeo = new THREE.RingGeometry(CAPTURE_RADIUS - 0.15, CAPTURE_RADIUS, 48);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  group.add(ring);

  const innerGeo = new THREE.CircleGeometry(CAPTURE_RADIUS - 0.2, 48);
  const inner = new THREE.Mesh(innerGeo, new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.10, side: THREE.DoubleSide }));
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.03;
  group.add(inner);

  // Pictogrammes runiques (segments)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const seg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.14),
      new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.55 })
    );
    seg.rotation.x = -Math.PI / 2;
    seg.rotation.z = a;
    seg.position.set(Math.cos(a) * (CAPTURE_RADIUS + 0.35), 0.04, Math.sin(a) * (CAPTURE_RADIUS + 0.35));
    group.add(seg);
  }

  // Cristal central de la zone
  const crystal = makeOutlineMesh(new THREE.OctahedronGeometry(0.7), GOLD, 0x0c0a09, 0.05);
  crystal.position.y = 1.4;
  crystal.rotation.y = Math.PI / 4;
  group.add(crystal);

  return { group, ring, inner, crystal, progress: 0, owner: null };
}

function buildSoulPad() {
  // Cercle d'invocation magique au sol, à l'écart du centre
  const pad = new THREE.Group();
  pad.position.set(0, 0, -16);
  const ringGeo = new THREE.RingGeometry(1.1, 1.3, 32);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  pad.add(ring);
  const ring2Geo = new THREE.RingGeometry(0.45, 0.55, 24);
  const ring2 = new THREE.Mesh(ringGeo.clone(), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
  ring2.rotation.x = -Math.PI / 2;
  ring2.position.y = 0.05;
  pad.add(ring2);
  return pad;
}

export function buildSky(scene) {
  scene.background = new THREE.Color(0x120e0a);
  scene.fog = new THREE.Fog(0x120e0a, 30, 90);

  const hemi = new THREE.HemisphereLight(0xf5b544, 0x1a1512, 0.9);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffe0b0, 1.1);
  dir.position.set(12, 24, 8);
  scene.add(dir);
}
