import * as THREE from "three";
import { GOLD, AMBER } from "./config.js";

export class ViewModel {
  constructor(camera) {
    this.camera = camera;
    this.holder = new THREE.Group();
    camera.add(this.holder);

    this.rig = new THREE.Group();
    this.holder.add(this.rig);
    this.bobT = 0;
    this.swingT = 1; // >=1 : repos
    this.chargeGlow = 0;

    this.build("sword");
  }

  build(weapon) {
    this.rig.clear();
    this.weapon = weapon;
    const g = new THREE.Group();

    const skin = new THREE.MeshLambertMaterial({ color: 0x9a7b5a });
    const dark = new THREE.MeshLambertMaterial({ color: 0x2b241e });
    const glow = new THREE.MeshBasicMaterial({ color: GOLD });

    if (weapon === "sword" || weapon === "mace") {
      // Main droite
      const handR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.16), skin);
      handR.position.set(0.32, -0.32, -0.55);
      handR.rotation.set(0.2, 0, 0);
      g.add(handR);
      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.38), dark);
      armR.position.set(0.34, -0.38, -0.32);
      armR.rotation.set(0.25, 0.05, 0);
      g.add(armR);

      // Main gauche (bouclier pour tank)
      if (weapon === "mace") {
        const shield = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.45), dark);
        shield.position.set(-0.34, -0.35, -0.6);
        shield.rotation.set(0.1, 0.3, 0.1);
        g.add(shield);
        const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), glow);
        boss.rotation.z = Math.PI / 2;
        boss.position.set(-0.31, -0.33, -0.6);
        g.add(boss);
        // Masse dans la main droite
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6), dark);
        handle.position.set(0.32, -0.18, -0.7);
        handle.rotation.x = -0.6;
        g.add(handle);
        const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09), dark);
        head.position.set(0.32, -0.02, -0.85);
        g.add(head);
      } else {
        // Épée d'énergie
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.75, 0.015), glow);
        blade.position.set(0.32, -0.05, -0.75);
        blade.rotation.x = -0.5;
        g.add(blade);
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.05), dark);
        guard.position.set(0.32, -0.22, -0.62);
        g.add(guard);
        // Main gauche le long de la lame
        const handL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.15), skin);
        handL.position.set(-0.28, -0.34, -0.55);
        g.add(handL);
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.36), dark);
        armL.position.set(-0.32, -0.4, -0.33);
        g.add(armL);
      }
    } else if (weapon === "daggers") {
      for (const side of [-1, 1]) {
        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.15), skin);
        hand.position.set(side * 0.3, -0.32, -0.55);
        hand.rotation.set(0.15, side * 0.1, 0);
        g.add(hand);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.34), dark);
        arm.position.set(side * 0.34, -0.4, -0.32);
        arm.rotation.set(0.25, 0, 0);
        g.add(arm);
        const dagger = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.012), glow);
        dagger.position.set(side * 0.3, -0.22, -0.68);
        dagger.rotation.x = -0.35;
        g.add(dagger);
      }
    }

    this.rig.add(g);
    this.g = g;
  }

  swing() { this.swingT = 0; }

  update(dt, moveSpeed, charging, chargeRatio) {
    // Head-bob
    this.bobT += dt * (4 + moveSpeed * 1.5);
    const bobAmt = Math.min(moveSpeed / 6, 1) * 0.012;
    this.holder.position.y = Math.sin(this.bobT) * bobAmt;
    this.holder.position.x = Math.cos(this.bobT * 0.5) * bobAmt * 0.6;

    // Animation de frappe (0 -> 1)
    if (this.swingT < 1) {
      this.swingT += dt * 3.2;
      const t = this.swingT;
      const arc = Math.sin(Math.min(t, 1) * Math.PI);
      this.g.rotation.x = -arc * 1.5;
      this.g.position.z = -arc * 0.18;
      this.g.position.y = arc * 0.05;
    } else {
      this.g.rotation.x = 0;
      this.g.position.z = charging ? 0.08 : 0;
      this.g.position.y = charging ? -0.02 : 0;
      this.g.rotation.z = charging ? 0.06 : 0;
    }

    // Lueur de charge sur les matériaux glow
    if (charging) {
      this.chargeGlow = Math.min(1, (this.chargeGlow || 0) + dt * 2);
    } else {
      this.chargeGlow = Math.max(0, (this.chargeGlow || 0) - dt * 4);
    }
    this.g.traverse((o) => {
      if (o.material && o.material.color && o.material.color.getHex() === GOLD) {
        o.material.color.setHex(charging ? 0xffe08a : GOLD);
        const s = 1 + this.chargeGlow * chargeRatio * 0.35;
        o.scale.set(s, s, s);
      }
    });
  }
}
