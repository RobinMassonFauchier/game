import * as THREE from "three";
import { ARENA } from "./config.js";

export class Player {
  constructor(camera, game) {
    this.camera = camera;
    this.game = game;
    this.pos = new THREE.Vector3(0, 1.7, 18);
    this.vel = new THREE.Vector3();
    this.yaw = Math.PI;
    this.pitch = 0;
    this.onGround = true;
    this.alive = true;
    this.keys = {};
    this.height = 1.7;
    this.radius = 0.5;
    this.dashCd = 0;
    this.dashTime = 0;
    this.dashDir = new THREE.Vector3();
    this.regenDelay = 0;
  }

  setClass(stats) {
    this.stats = stats;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
  }

  takeDamage(amount, attacker) {
    if (!this.alive) return;
    let dmg = this.stats.armor ? amount * this.stats.armor : amount;
    if (this.barrier > 0) dmg *= 0.25;
    this.hp -= dmg;
    this.regenDelay = 4;
    if (this.barrier > 0) this.barrier = Math.max(0, this.barrier - 0.1);
    this.game.hud.flashDamage();
    if (this.hp <= 0) {
      this.hp = 0;
      this.game.onPlayerDeath(attacker);
    }
  }

  update(dt) {
    if (!this.alive) return;
    const k = this.keys;
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const move = new THREE.Vector3();
    if (k["KeyW"] || k["KeyZ"] || k["ArrowUp"]) move.add(fwd);
    if (k["KeyS"]) move.sub(fwd);
    if (k["KeyA"] || k["KeyQ"] || k["ArrowLeft"]) move.sub(right);
    if (k["KeyD"] || k["ArrowRight"]) move.add(right);

    const sprint = k["ShiftLeft"] && !this.game.combat.charging;
    const speed = this.stats.speed * (sprint ? 1.45 : 1);
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed);

    // Dash assassin
    if (this.dashTime > 0) {
      this.dashTime -= dt;
      move.copy(this.dashDir).multiplyScalar(this.stats.speed * 3.2);
    }

    // Gravité + saut
    if (k["Space"] && this.onGround) {
      this.vel.y = 6.5;
      this.onGround = false;
    }
    this.vel.y -= 16 * dt;

    const nx = this.pos.x + move.x * dt;
    const nz = this.pos.z + move.z * dt;
    if (!this.game.isBlocked(nx, this.pos.z, this.radius)) this.pos.x = nx;
    if (!this.game.isBlocked(this.pos.x, nz, this.radius)) this.pos.z = nz;
    this.pos.y += this.vel.y * dt;
    if (this.pos.y <= this.height) {
      this.pos.y = this.height;
      this.vel.y = 0;
      this.onGround = true;
    }

    // Barrière temporaire
    if (this.barrier > 0) this.barrier = Math.max(0, this.barrier - dt);

    // Régénération lente hors combat
    this.regenDelay -= dt;
    if (this.regenDelay <= 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + 3 * dt);
    }

    this.camera.position.copy(this.pos);
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
    this.horizontalSpeed = Math.hypot(move.x, move.z);
  }

  dash() {
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.dashDir.copy(fwd);
    this.dashTime = 0.18;
  }
}
