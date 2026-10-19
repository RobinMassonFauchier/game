import * as THREE from "three";
import { GOLD, AMBER, SOUL_PICKUP_RADIUS } from "./config.js";
import { makeOutlineMesh } from "./utils.js";

export class SoulManager {
  constructor(scene) {
    this.scene = scene;
    this.souls = [];
  }

  dropSoul(pos, className, ownerName) {
    const group = new THREE.Group();
    group.position.set(pos.x, 0, pos.z);

    // Cercle d'invocation au sol
    const ringGeo = new THREE.RingGeometry(0.9, 1.15, 32);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    group.add(ring);

    const ring2 = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.5, 24), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.06;
    group.add(ring2);

    // Âme cristallisée : polyèdre flottant
    const crystal = makeOutlineMesh(new THREE.IcosahedronGeometry(0.38), GOLD, 0x0c0a09, 0.06);
    crystal.position.y = 1.1;
    group.add(crystal);

    // Halo
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(0.6, 24),
      new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 1.1;
    group.add(halo);

    const light = new THREE.PointLight(GOLD, 1.4, 6);
    light.position.y = 1.2;
    group.add(light);

    this.scene.add(group);
    this.souls.push({
      group, crystal, ring, halo,
      className, ownerName,
      pos: new THREE.Vector3(pos.x, 0, pos.z),
      t: Math.random() * 10,
    });
  }

  update(dt, player) {
    for (let i = this.souls.length - 1; i >= 0; i--) {
      const s = this.souls[i];
      s.t += dt;
      s.crystal.position.y = 1.1 + Math.sin(s.t * 2) * 0.12;
      s.crystal.rotation.y += dt * 1.8;
      s.crystal.rotation.x = Math.sin(s.t) * 0.2;
      s.ring.rotation.z += dt * 0.5;
      s.halo.material.opacity = 0.2 + Math.sin(s.t * 3) * 0.08;

      if (player.alive) {
        const d = Math.hypot(player.pos.x - s.pos.x, player.pos.z - s.pos.z);
        if (d < SOUL_PICKUP_RADIUS) {
          this.scene.remove(s.group);
          this.souls.splice(i, 1);
          return s; // consommée par le joueur
        }
      }
    }
    return null;
  }

  removeNearest(pos, radius = 3) {
    let best = -1, bd = radius;
    this.souls.forEach((s, i) => {
      const d = Math.hypot(pos.x - s.pos.x, pos.z - s.pos.z);
      if (d < bd) { bd = d; best = i; }
    });
    if (best >= 0) {
      const s = this.souls[best];
      this.scene.remove(s.group);
      this.souls.splice(best, 1);
      return s;
    }
    return null;
  }
}
