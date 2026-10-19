import * as THREE from "three";
import { CLASSES, ALLY_COLOR, ENEMY_COLOR, CAPTURE_RADIUS } from "./config.js";
import { buildCharacterMesh, buildHPBar } from "./characters.js";

const SPAWNS = [
  new THREE.Vector3(-16, 0, 16), new THREE.Vector3(16, 0, 16), new THREE.Vector3(-16, 0, -16),
  new THREE.Vector3(16, 0, -16), new THREE.Vector3(0, 0, 18), new THREE.Vector3(0, 0, -18),
];

export class Bot {
  constructor(scene, soulManager, game, team, className, name, id) {
    this.scene = scene; this.soulManager = soulManager; this.game = game;
    this.team = team; this.className = className; this.name = name; this.id = id;
    this.stats = CLASSES[className];
    this.hp = this.stats.hp;
    this.maxHp = this.stats.hp;
    this.alive = true;
    this.pos = SPAWNS[id % SPAWNS.length].clone();
    this.target = new THREE.Vector3();
    this.attackCd = 0;
    this.repathCd = 0;
    this.hitFlash = 0;

    this.mesh = buildCharacterMesh(className, ENEMY_COLOR);
    this.mesh.position.copy(this.pos);
    scene.add(this.mesh);

    const hpBar = buildHPBar();
    this.hpBar = hpBar.group; this.hpFill = hpBar.fill;
    this.hpBar.position.set(0, 2.2, 0);
    this.mesh.add(this.hpBar);
  }

  takeDamage(amount, attacker) {
    if (!this.alive) return;
    const dmg = this.stats.armor ? amount * this.stats.armor : amount;
    this.hp -= dmg;
    this.hitFlash = 0.12;
    this.attacker = attacker;
    if (this.hp <= 0) this.die(attacker);
  }

  die(attacker) {
    this.alive = false;
    this.soulManager.dropSoul(this.pos, this.className, this.name);
    this.game.onBotDeath(this, attacker);
    this.scene.remove(this.mesh);
    this.respawnTimer = 5.0;
  }

  respawn() {
    this.className = this.game.randomEnemyClass();
    this.stats = CLASSES[this.className];
    this.maxHp = this.stats.hp; this.hp = this.maxHp;
    this.alive = true;
    this.pos.copy(SPAWNS[Math.floor(Math.random() * SPAWNS.length)]);
    // Reconstruire le modèle avec la nouvelle silhouette
    this.scene.remove(this.mesh);
    this.mesh = buildCharacterMesh(this.className, ENEMY_COLOR);
    this.mesh.position.copy(this.pos);
    const hpBar = buildHPBar();
    this.hpBar = hpBar.group; this.hpFill = hpBar.fill;
    this.hpBar.position.set(0, 2.2, 0);
    this.mesh.add(this.hpBar);
    this.scene.add(this.mesh);
  }

  update(dt, player) {
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawn();
      return;
    }

    // IA : cibler le joueur s'il est proche, sinon la zone de capture
    const distToPlayer = this.pos.distanceTo(player.pos);
    if (player.alive && distToPlayer < 14) {
      this.target.copy(player.pos);
    } else {
      if (this.repathCd <= 0) {
        this.repathCd = 2 + Math.random() * 2;
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * CAPTURE_RADIUS;
        this.target.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      }
    }
    this.repathCd -= dt;

    // Déplacement
    const dir = new THREE.Vector3().subVectors(this.target, this.pos);
    const dist = dir.length();
    if (dist > (this.target === player.pos ? this.stats.range : 1)) {
      dir.normalize();
      const step = this.stats.speed * 0.8 * dt;
      const nx = this.pos.x + dir.x * step;
      const nz = this.pos.z + dir.z * step;
      if (!this.game.isBlocked(nx, this.pos.z, 0.5)) this.pos.x = nx;
      if (!this.game.isBlocked(this.pos.x, nz, 0.5)) this.pos.z = nz;
      this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    }

    // Attaque
    this.attackCd -= dt;
    if (player.alive && distToPlayer < this.stats.range + 0.4 && this.attackCd <= 0) {
      this.attackCd = 1.2 + Math.random() * 0.6;
      player.takeDamage(this.stats.dmg * 0.8, this);
      this.mesh.position.y = 0.15; // petit saut d'attaque
    }
    this.mesh.position.x = this.pos.x;
    this.mesh.position.z = this.pos.z;
    this.mesh.position.y = Math.max(0, this.mesh.position.y - dt * 0.6);

    // Barre de vie billboard
    this.hpFill.scale.x = Math.max(0.001, this.hp / this.maxHp);
    this.hpFill.position.x = -(1 - this.hpFill.scale.x) * 0.53;
    this.hpBar.lookAt(this.game.camera.getWorldPosition(new THREE.Vector3()));
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }
}
