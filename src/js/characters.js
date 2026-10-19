import * as THREE from "three";
import { ALLY_COLOR, ENEMY_COLOR, GOLD, AMBER } from "./config.js";
import { makeOutlineMesh, flat } from "./utils.js";

// Construit une silhouette différenciée selon la classe
export function buildCharacterMesh(className, color) {
  const g = new THREE.Group();
  const M = (geo, c) => makeOutlineMesh(geo, c);
  const box = (c, w, h, d, x, y, z, parent = g) => {
    const m = M(new THREE.BoxGeometry(w, h, d), c);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  const isAssassin = className === "ASSASSIN" || className === "CHASSEUR";
  const isTank = className === "TANK" || className === "SENTINELLE";

  const bodyW = isTank ? 1.05 : isAssassin ? 0.55 : 0.75;
  const bodyH = isTank ? 0.85 : isAssassin ? 0.65 : 0.75;
  const legW  = isTank ? 0.32 : isAssassin ? 0.17 : 0.24;
  const armW  = isTank ? 0.26 : isAssassin ? 0.13 : 0.19;
  const headR = isTank ? 0.26 : isAssassin ? 0.19 : 0.22;
  const shoulderY = isTank ? 1.25 : isAssassin ? 1.15 : 1.2;

  // Jambes
  box(color, legW, 0.55, legW, -bodyW / 3, 0.28, 0);
  box(color, legW, 0.55, legW, bodyW / 3, 0.28, 0);
  // Torse
  box(color, bodyW, bodyH, bodyW * 0.6, 0, 0.55 + bodyH / 2, 0);
  // Tête (casque)
  const head = M(new THREE.OctahedronGeometry(headR, 0), 0x3a2f24);
  head.position.set(0, shoulderY + headR + 0.1, 0);
  g.add(head);
  // Visière lumineuse
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(headR * 1.4, headR * 0.28, 0.05),
    new THREE.MeshBasicMaterial({ color: GOLD })
  );
  visor.position.set(0, shoulderY + headR + 0.12, headR * 0.85);
  g.add(visor);

  // Bras
  const armL = box(color, armW, 0.5, armW, -(bodyW / 2 + armW / 2), shoulderY - 0.25, 0);
  const armR = box(color, armW, 0.5, armW, bodyW / 2 + armW / 2, shoulderY - 0.25, 0);

  // Armes selon la classe
  if (className === "WARRIOR" || className === "BERSERKER") {
    // Épée d'énergie à deux mains (dans la main droite)
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.15, 0.03), new THREE.MeshBasicMaterial({ color: GOLD }));
    blade.position.set(bodyW / 2 + armW / 2, shoulderY - 0.2, 0.4);
    g.add(blade);
    const hilt = flat(0x3a2f24, { w: 0.28, h: 0.08, d: 0.08 });
    hilt.position.copy(blade.position);
    hilt.position.y -= 0.6;
    g.add(hilt);
  } else if (isTank) {
    // Grand bouclier à gauche + masse à droite
    const shield = flat(color, { w: 0.14, h: 1.1, d: 0.85 });
    shield.position.set(-(bodyW / 2 + 0.3), shoulderY - 0.1, 0.3);
    shield.rotation.y = 0.2;
    g.add(shield);
    const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 8), new THREE.MeshBasicMaterial({ color: AMBER }));
    boss.rotation.x = Math.PI / 2;
    boss.position.set(-(bodyW / 2 + 0.24), shoulderY - 0.1, 0.44);
    g.add(boss);
    const mace = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 6), new THREE.MeshBasicMaterial({ color: 0x3a2f24 }));
    mace.position.set(bodyW / 2 + armW / 2 + 0.1, shoulderY + 0.1, 0.3);
    mace.rotation.x = 0.4;
    g.add(mace);
    const maceHead = M(new THREE.DodecahedronGeometry(0.14), 0x3a2f24);
    maceHead.position.set(bodyW / 2 + armW / 2 + 0.1, shoulderY + 0.55, 0.55);
    g.add(maceHead);
  } else {
    // Dagues arcaniques lumineuses
    for (const side of [-1, 1]) {
      const dagger = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.02), new THREE.MeshBasicMaterial({ color: GOLD }));
      dagger.position.set(side * (bodyW / 2 + armW / 2), shoulderY - 0.55, 0.2);
      g.add(dagger);
    }
  }

  // Épaulettes distinctives
  if (isTank || className === "WARRIOR" || className === "BERSERKER") {
    box(0x3a2f24, bodyW * 0.42, 0.14, 0.3, -bodyW / 2 - 0.05, shoulderY + 0.05, 0);
    box(0x3a2f24, bodyW * 0.42, 0.14, 0.3, bodyW / 2 + 0.05, shoulderY + 0.05, 0);
  }

  return g;
}

export function buildHPBar() {
  const group = new THREE.Group();
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x0c0a09 }));
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 0.07), new THREE.MeshBasicMaterial({ color: ALLY_COLOR }));
  fill.position.z = 0.001;
  group.add(bg, fill);
  return { group, fill };
}
