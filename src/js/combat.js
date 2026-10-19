import * as THREE from "three";
import { GOLD, AMBER } from "./config.js";

export class Combat {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.attackCd = 0;
    this.chargeStart = null;
    this.charging = false;
    this.abilityCds = [0, 0];
    this.effects = [];
    this.shieldActive = 0;
    this.shockwaveCd = 0;
  }

  startCharge() {
    if (this.attackCd <= 0 && !this.charging) {
      this.chargeStart = performance.now();
      this.charging = true;
    }
  }

  releaseCharge() {
    if (!this.charging) return;
    const held = (performance.now() - this.chargeStart) / 1000;
    this.charging = false;
    const stats = this.game.player.stats;
    if (this.attackCd > 0) return;
    if (held >= stats.chargeTime) this.doAttack(stats.chargeDmg, true);
    else this.doAttack(stats.dmg, false);
  }

  doAttack(dmg, charged) {
    const stats = this.game.player.stats;
    this.attackCd = charged ? 0.8 : 0.42;
    this.game.viewmodel.swing();

    // Portée : cône devant le joueur
    const player = this.game.player;
    const fwd = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    let hitSomething = false;

    for (const bot of this.game.bots) {
      if (!bot.alive) continue;
      const to = new THREE.Vector3().subVectors(bot.pos, player.pos);
      to.y = 0;
      const dist = to.length();
      if (dist > stats.range + (charged ? 1.2 : 0)) continue;
      to.normalize();
      if (fwd.dot(to) < 0.45) continue;
      bot.takeDamage(dmg, player);
      hitSomething = true;
    }

    if (hitSomething) {
      this.game.hud.showHitmarker();
      this.game.sfx.hit();
    }

    if (charged) this.spawnShockwave(player.pos, fwd, dmg);
  }

  spawnShockwave(pos, dir, dmg) {
    // Onde de choc arcanique : anneau expansif
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.5, 32),
      new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.2, pos.z);
    this.scene.add(ring);
    this.effects.push({
      mesh: ring, t: 0, life: 0.5,
      update: (e, dt) => {
        e.t += dt;
        const r = 0.3 + e.t * 14;
        e.mesh.geometry.dispose();
        e.mesh.geometry = new THREE.RingGeometry(r, r + 0.4, 32);
        e.mesh.material.opacity = 0.9 * (1 - e.t / e.life);
      },
    });
    this.game.sfx.charge();
  }

  useAbility(i) {
    const player = this.game.player;
    const stats = player.stats;
    if (this.abilityCds[i] > 0 || !player.alive) return;
    const ab = stats.abilities[i];
    this.abilityCds[i] = ab.cd;

    const fwd = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));

    switch (ab.label) {
      case "LAME FILAIRE": {
        // Tranchant projeté en ligne
        const slash = new THREE.Mesh(
          new THREE.PlaneGeometry(2.4, 0.35),
          new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
        );
        slash.position.set(player.pos.x + fwd.x, 1.2, player.pos.z + fwd.z);
        slash.rotation.y = player.yaw + Math.PI / 2;
        slash.rotation.z = 0.3;
        this.scene.add(slash);
        this.effects.push({
          mesh: slash, t: 0, life: 0.4,
          update: (e, dt) => {
            e.t += dt;
            e.mesh.position.x += fwd.x * 22 * dt;
            e.mesh.position.z += fwd.z * 22 * dt;
            e.mesh.material.opacity = 0.95 * (1 - e.t / e.life);
          },
          tickHit: (game) => {
            for (const bot of game.bots) {
              if (!bot.alive) continue;
              if (Math.hypot(bot.pos.x - slash.position.x, bot.pos.z - slash.position.z) < 1.4 && !bot._slashHit) {
                bot.takeDamage(35, player);
                bot._slashHit = true;
                game.hud.showHitmarker();
                setTimeout(() => (bot._slashHit = false), 500);
              }
            }
          },
        });
        this.game.sfx.slash();
        break;
      }
      case "BARRIÈRE": {
        // Bouclier temporaire : réduit les dégâts
        player.barrier = 2.5; // secondes
        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(1.4, 16, 12),
          new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.22, wireframe: true })
        );
        dome.position.set(player.pos.x, player.pos.y - 1.2, player.pos.z);
        this.scene.add(dome);
        this.effects.push({
          mesh: dome, t: 0, life: 2.5,
          update: (e, dt) => {
            e.t += dt;
            e.mesh.position.set(player.pos.x, player.pos.y - 1.2, player.pos.z);
            e.mesh.rotation.y += dt * 2;
            e.mesh.material.opacity = 0.22 * (1 - e.t / e.life) + 0.05;
          },
        });
        this.game.sfx.shield();
        break;
      }
      case "PAS OMBRE":
        player.dash();
        this.game.sfx.dash();
        break;
      case "ONDE ARCANIQUE":
      case "SECOUSSE": {
        // Burst radial autour du joueur
        this.spawnShockwave(player.pos, fwd, 20);
        for (const bot of this.game.bots) {
          if (!bot.alive) continue;
          const d = Math.hypot(bot.pos.x - player.pos.x, bot.pos.z - player.pos.z);
          if (d < 5) {
            bot.takeDamage(ab.label === "SECOUSSE" ? 25 : 30, player);
            this.game.hud.showHitmarker();
          }
        }
        break;
      }
      case "ÉVENTRAIL":
      case "MARQUE FATALE": {
        // Coup critique rapide en cône
        this.doAttack(stats.dmg * 2.2, true);
        break;
      }
      case "CHARGE SAUVAGE": {
        player.dash();
        setTimeout(() => this.doAttack(stats.chargeDmg, true), 150);
        break;
      }
    }
  }

  update(dt) {
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.abilityCds = this.abilityCds.map((c) => Math.max(0, c - dt));
    const stats = this.game.player.stats;

    for (let i = 0; i < 2; i++) {
      this.game.hud.updateAbility(i, this.abilityCds[i], stats.abilities[i].cd);
    }

    // Effets visuels
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.update(e, dt);
      if (e.tickHit) e.tickHit(this.game);
      if (e.t >= e.life) {
        this.scene.remove(e.mesh);
        e.mesh.geometry?.dispose?.();
        this.effects.splice(i, 1);
      }
    }
  }
}
