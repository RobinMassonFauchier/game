import { CLASSES } from "./config.js";

const $ = (id) => document.getElementById(id);

export class HUD {
  constructor() {
    this.minimap = $("minimap");
    this.mmCtx = this.minimap.getContext("2d");
    this.mmSize = 172;
    this.minimap.width = this.mmSize;
    this.minimap.height = this.mmSize;
    this.timer = $("timer");
    this.feed = $("feed");
    this.hpFill = $("hp-fill");
    this.announceEl = $("announce");
    this.chargeWrap = $("charge-wrap");
    this.chargeFill = $("charge-fill");
    this.classTag = $("class-tag");
    this.hitmarker = $("hitmarker");
    this.abEls = [$("ab1"), $("ab2")];
    this.abCd = [null, null];
  }

  setClass(clsKey) {
    const c = CLASSES[clsKey];
    this.classTag.textContent = `${c.name} ${c.tier === 2 ? "★★" : "★"}`;
    c.abilities.forEach((ab, i) => {
      const el = this.abEls[i];
      el.querySelector(".icon").dataset.icon = ab.icon;
      el.title = ab.label;
    });
  }

  updateHp(hp, maxHp) {
    this.hpFill.style.width = `${Math.max(0, (hp / maxHp) * 100)}%`;
  }

  updateTimer(t) {
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    this.timer.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  updateScores(ally, enemy) {
    $("score-ally").textContent = ally;
    $("score-enemy").textContent = enemy;
  }

  addFeed(html) {
    const div = document.createElement("div");
    div.className = "feed-item";
    div.innerHTML = html;
    this.feed.prepend(div);
    setTimeout(() => { div.style.opacity = "0"; div.style.transition = "opacity 0.5s"; }, 6000);
    setTimeout(() => div.remove(), 6600);
    while (this.feed.children.length > 6) this.feed.lastChild.remove();
  }

  announce(text, duration = 2200) {
    this.announceEl.textContent = text;
    this.announceEl.style.opacity = "1";
    clearTimeout(this._annT);
    this._annT = setTimeout(() => { this.announceEl.style.opacity = "0"; }, duration);
  }

  showHitmarker() {
    this.hitmarker.classList.remove("show");
    void this.hitmarker.offsetWidth;
    this.hitmarker.classList.add("show");
  }

  flashDamage() {
    document.body.style.boxShadow = "inset 0 0 120px rgba(200, 71, 42, 0.5)";
    clearTimeout(this._dmgT);
    this._dmgT = setTimeout(() => { document.body.style.boxShadow = "none"; }, 180);
  }

  setCharge(show, ratio) {
    this.chargeWrap.classList.toggle("show", show);
    this.chargeFill.style.width = `${Math.min(100, ratio * 100)}%`;
  }

  updateAbility(i, cdLeft, cdTotal) {
    const el = this.abEls[i];
    let cd = el.querySelector(".cd");
    let txt = el.querySelector(".cd-text");
    if (!txt) {
      txt = document.createElement("div");
      txt.className = "cd-text";
      el.appendChild(txt);
    }
    if (cdLeft > 0) {
      cd.style.transform = `scaleY(${cdLeft / cdTotal})`;
      txt.textContent = Math.ceil(cdLeft);
      el.dataset.ready = "false";
    } else {
      cd.style.transform = "scaleY(0)";
      el.dataset.ready = "true";
    }
  }

  drawMinimap(game) {
    const ctx = this.mmCtx, S = this.mmSize, world = game.worldSize;
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = "rgba(18,14,10,0.9)";
    ctx.fillRect(0, 0, S, S);
    const toMap = (x, z) => [(x / world) * S + S / 2, (z / world) * S + S / 2];

    // Zone de capture
    const [cx, cz] = toMap(0, 0);
    ctx.strokeStyle = "#f5b544";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cz, (game.captureRadius / world) * S, 0, Math.PI * 2);
    ctx.stroke();

    // Obstacles
    ctx.fillStyle = "#4a3b2d";
    for (const o of game.obstacles) {
      const [ox, oz] = toMap(o.x, o.z);
      ctx.fillRect(ox - 3, oz - 3, 6, 6);
    }

    // Âmes
    ctx.fillStyle = "#f5b544";
    for (const s of game.soulManager.souls) {
      const [sx, sz] = toMap(s.pos.x, s.pos.z);
      ctx.beginPath();
      ctx.arc(sx, sz, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bots
    ctx.fillStyle = "#c8472a";
    for (const b of game.bots) {
      if (!b.alive) continue;
      const [bx, bz] = toMap(b.pos.x, b.pos.z);
      ctx.beginPath();
      ctx.arc(bx, bz, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Joueur (triangle orienté)
    const [px, pz] = toMap(game.player.pos.x, game.player.pos.z);
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(-game.player.yaw + Math.PI);
    ctx.fillStyle = "#4f8fb8";
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4.5, 5);
    ctx.lineTo(-4.5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Cadre
    ctx.strokeStyle = "rgba(212,145,42,0.35)";
    ctx.strokeRect(0.5, 0.5, S - 1, S - 1);
  }
}
