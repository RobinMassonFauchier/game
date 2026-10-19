import * as THREE from "three";
import { CLASSES, fusionClass, ARENA, MATCH_TIME, CAPTURE_RADIUS } from "./config.js";
import { buildWorld, buildSky } from "./world.js";
import { SoulManager } from "./souls.js";
import { Bot } from "./bot.js";
import { Player } from "./player.js";
import { ViewModel } from "./viewmodel.js";
import { Combat } from "./combat.js";
import { HUD } from "./hud.js";
import { SFX } from "./sfx.js";

const ENEMY_CLASSES = ["WARRIOR", "TANK", "ASSASSIN"];
const BOT_NAMES = ["VEX", "MOROK", "SILRA", "THARN", "KAEL", "NYX", "DRAV", "OMEN"];

class Game {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("game"), antialias: true });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    buildSky(this.scene);

    this.camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 200);
    this.scene.add(this.camera);

    const world = buildWorld(this.scene);
    this.worldSize = ARENA.size;
    this.obstacles = world.obstacles;
    this.capture = world.capture;
    this.soulPad = world.soulPad;

    this.soulManager = new SoulManager(this.scene);
    this.hud = new HUD();
    this.sfx = new SFX();

    this.player = new Player(this.camera, this);
    this.viewmodel = new ViewModel(this.camera);
    this.combat = new Combat(this.scene, this);

    this.bots = [];
    this.started = false;
    this.timeLeft = MATCH_TIME;
    this.scoreAlly = 0;
    this.scoreEnemy = 0;
    this.captureProgress = 0; // 0..1
    this.capturing = null; // "player" | "bots" | null

    addEventListener("resize", () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });

    this.setupInput();
    this.setupMenu();

    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  /* ===== Input ===== */
  setupInput() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener("click", () => {
      if (!this.started) return;
      canvas.requestPointerLock();
      this.sfx.init();
    });
    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === canvas;
    });
    document.addEventListener("mousemove", (e) => {
      if (!this.locked || !this.player.alive) return;
      this.player.yaw -= e.movementX * 0.0022;
      this.player.pitch = Math.max(-1.4, Math.min(1.4, this.player.pitch - e.movementY * 0.0022));
    });
    document.addEventListener("mousedown", (e) => {
      if (!this.locked || e.button !== 0) return;
      this.combat.startCharge();
    });
    document.addEventListener("mouseup", (e) => {
      if (e.button !== 0) return;
      this.combat.releaseCharge();
    });
    document.addEventListener("keydown", (e) => {
      this.player.keys[e.code] = true;
      if (!this.locked) return;
      if (e.code === "KeyC") this.combat.useAbility(0);
      if (e.code === "KeyE") this.combat.useAbility(1);
    });
    document.addEventListener("keyup", (e) => (this.player.keys[e.code] = false));
  }

  setupMenu() {
    document.querySelectorAll(".pick").forEach((btn) => {
      btn.addEventListener("click", () => this.start(btn.dataset.class));
    });
  }

  start(cls) {
    this.playerClass = cls;
    this.player.setClass(CLASSES[cls]);
    this.hud.setClass(cls);
    this.viewmodel.build(CLASSES[cls].weapon);

    // 4 bots ennemis
    const names = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 4; i++) {
      this.bots.push(new Bot(this.scene, this.soulManager, this, "enemy", ENEMY_CLASSES[i % 3], names[i], i));
    }

    document.getElementById("menu").style.display = "none";
    this.started = true;
    this.renderer.domElement.requestPointerLock();
    this.sfx.init();
    this.hud.announce("PROTOCOLE DE BATAILLE ENGAGÉ");
    this.hud.addFeed(`<span class="soul">ÂME LIEE — ${CLASSES[cls].name}</span>`);
  }

  randomEnemyClass() {
    return ENEMY_CLASSES[Math.floor(Math.random() * ENEMY_CLASSES.length)];
  }

  /* ===== Collisions ===== */
  isBlocked(x, z, r) {
    const S = this.worldSize / 2 - r;
    if (Math.abs(x) > S || Math.abs(z) > S) return true;
    for (const o of this.obstacles) {
      if (Math.abs(x - o.x) < o.hw + r && Math.abs(z - o.z) < o.hd + r) return true;
    }
    return false;
  }

  /* ===== Capture ===== */
  updateCapture(dt) {
    const inZone = (pos) => Math.hypot(pos.x, pos.z) < CAPTURE_RADIUS;
    const playerIn = this.player.alive && inZone(this.player.pos);
    const botsIn = this.bots.filter((b) => b.alive && inZone(b.pos));

    if (playerIn && botsIn.length === 0) this.capturing = "player";
    else if (!playerIn && botsIn.length > 0) this.capturing = "enemy";
    else if (playerIn && botsIn.length > 0) this.capturing = "contested";
    else this.capturing = null;

    if (this.capturing === "player") this.captureProgress = Math.min(1, this.captureProgress + dt / 8);
    else if (this.capturing === "enemy") this.captureProgress = Math.max(0, this.captureProgress - dt / 8);

    // Visuel : couleur de l'anneau
    const ringCol = this.capturing === "player" ? 0x4f8fb8 : this.capturing === "enemy" ? 0xc8472a : 0xf5b544;
    this.capture.ring.material.color.setHex(ringCol);
    this.capture.inner.material.opacity = 0.1 + this.captureProgress * 0.25;
    this.capture.crystal.rotation.y += dt * (0.5 + this.captureProgress * 3);
    this.capture.crystal.position.y = 1.4 + Math.sin(performance.now() / 600) * 0.15 + this.captureProgress * 0.4;

    // Point marqué
    if (this.captureProgress >= 1) {
      this.captureProgress = 0;
      if (this.capturing === "player") {
        this.scoreAlly++;
        this.hud.announce("ZONE CAPTURÉE");
        this.hud.addFeed(`<span class="k">ZONE</span> capturée par l'équipe alliée`);
      } else {
        this.scoreEnemy++;
        this.hud.announce("ZONE PERDUE");
        this.hud.addFeed(`<span class="k">ZONE</span> capturée par l'ennemi`);
      }
      this.sfx.fusion();
      this.hud.updateScores(this.scoreAlly, this.scoreEnemy);
    }
  }

  /* ===== Mort / fusion ===== */
  onPlayerDeath(attacker) {
    this.player.alive = false;
    this.sfx.death();
    this.soulManager.dropSoul(this.player.pos, this.playerClass, "VOUS");
    this.hud.addFeed(`<span class="k">${attacker ? attacker.name : "L'ARÈNE"}</span> a dissipé votre âme`);
    document.getElementById("death").style.display = "flex";
    document.getElementById("death-info").textContent =
      attacker ? `Éliminé par ${attacker.name} (${CLASSES[attacker.className].name})` : "Éliminé";
    document.exitPointerLock();

    setTimeout(() => this.respawnPlayer(), 4000);
  }

  respawnPlayer() {
    this.playerClass = this.fusedClass || this.playerClass;
    this.player.setClass(CLASSES[this.playerClass]);
    this.hud.setClass(this.playerClass);
    this.viewmodel.build(CLASSES[this.playerClass].weapon);
    this.fusedClass = null;
    this.player.pos.set(0, 1.7, 18);
    this.player.yaw = Math.PI;
    this.player.alive = true;
    document.getElementById("death").style.display = "none";
    this.renderer.domElement.requestPointerLock();
  }

  onBotDeath(bot, attacker) {
    if (attacker === this.player) {
      this.scoreAlly++;
      this.sfx.kill();
      this.hud.addFeed(`<span class="k">VOUS</span> avez éliminé <span class="k">${bot.name}</span>`);
    }
    this.hud.addFeed(`<span class="soul">ÂME</span> de ${bot.name} cristallisée — fusion possible`);
    this.hud.updateScores(this.scoreAlly, this.scoreEnemy);
  }

  tryFusion(soul) {
    const fused = fusionClass(this.playerClass, soul.className);
    this.sfx.soul();
    if (fused && CLASSES[this.playerClass].tier === 1) {
      this.fusedClass = fused;
      this.hud.announce(`FUSION D'ÂME — ${CLASSES[fused].name}`);
      this.hud.addFeed(`<span class="soul">FUSION</span> ${CLASSES[this.playerClass].name} + ${CLASSES[soul.className].name} → ${CLASSES[fused].name}`);
      this.sfx.fusion();
    } else {
      // Âme compatible non fusionnable : bonus de soin
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 40);
      this.hud.announce("ÂME ABSORBÉE — VITALITÉ RESTAURÉE");
    }
  }

  /* ===== Boucle ===== */
  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (!this.started) { this.renderer.render(this.scene, this.camera); return; }

    this.timeLeft -= dt;
    this.hud.updateTimer(Math.max(0, this.timeLeft));

    this.player.update(dt);
    for (const bot of this.bots) bot.update(dt, this.player);

    this.combat.update(dt);
    this.updateCapture(dt);

    const heldRatio = this.combat.charging
      ? Math.min(1, (performance.now() - this.combat.chargeStart) / 1000 / this.player.stats.chargeTime)
      : 0;
    this.hud.setCharge(this.combat.charging, heldRatio);

    const pickedSoul = this.soulManager.update(dt, this.player);
    if (pickedSoul) this.tryFusion(pickedSoul);

    this.hud.updateHp(this.player.hp, this.player.maxHp);
    this.hud.drawMinimap(this);
    this.viewmodel.update(dt, this.player.horizontalSpeed || 0, this.combat.charging, heldRatio);

    if (this.timeLeft <= 0) {
      this.hud.announce(this.scoreAlly > this.scoreEnemy ? "VICTOIRE" : this.scoreAlly < this.scoreEnemy ? "DÉFAITE" : "ÉGALITÉ", 10000);
      this.timeLeft = MATCH_TIME;
      this.scoreAlly = 0;
      this.scoreEnemy = 0;
      this.hud.updateScores(0, 0);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

new Game();
