export class SFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  tone({ freq = 440, type = "sine", dur = 0.15, vol = 0.2, slide = 0, delay = 0 } = {}) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  noise({ dur = 0.2, vol = 0.15, delay = 0 } = {}) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(gain).connect(this.ctx.destination);
    src.start(t0);
  }

  swing() { this.noise({ dur: 0.12, vol: 0.1 }); this.tone({ freq: 220, type: "triangle", dur: 0.1, vol: 0.08, slide: -120 }); }
  hit() { this.tone({ freq: 160, type: "square", dur: 0.08, vol: 0.12, slide: -60 }); this.noise({ dur: 0.08, vol: 0.12 }); }
  charge() { this.tone({ freq: 90, type: "sawtooth", dur: 0.4, vol: 0.2, slide: -50 }); this.noise({ dur: 0.35, vol: 0.18 }); }
  slash() { this.tone({ freq: 700, type: "sawtooth", dur: 0.25, vol: 0.12, slide: -400 }); }
  shield() { this.tone({ freq: 300, type: "sine", dur: 0.5, vol: 0.15, slide: 150 }); }
  dash() { this.noise({ dur: 0.25, vol: 0.14 }); this.tone({ freq: 500, type: "sine", dur: 0.2, vol: 0.08, slide: 300 }); }
  soul() { this.tone({ freq: 520, type: "sine", dur: 0.3, vol: 0.2 }); this.tone({ freq: 780, type: "sine", dur: 0.5, vol: 0.15, delay: 0.12 }); }
  fusion() { [440, 550, 660, 880].forEach((f, i) => this.tone({ freq: f, type: "sine", dur: 0.4, vol: 0.16, delay: i * 0.1 })); }
  death() { this.tone({ freq: 200, type: "sawtooth", dur: 0.8, vol: 0.2, slide: -150 }); }
  kill() { this.tone({ freq: 660, type: "triangle", dur: 0.2, vol: 0.15 }); this.tone({ freq: 990, type: "triangle", dur: 0.3, vol: 0.1, delay: 0.1 }); }
}
