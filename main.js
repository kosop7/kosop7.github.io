// =======================================================
// CANVAS SETUP
// =======================================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hintEl = document.getElementById("hint");
const inventoryEl = document.getElementById("inventory");
const buttons = document.querySelectorAll("#buttons button");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// =======================================================
// INPUT — CLICK / TOUCH ONLY (NO KEYBOARD)
// =======================================================
const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  interact: false,
  observe: false,
  back: false,
};

buttons.forEach((btn) => {
  const act = btn.dataset.action;

  const down = (e) => {
    e.preventDefault();
    input[act] = true;
  };
  const up = (e) => {
    e.preventDefault();
    input[act] = false;
  };

  btn.addEventListener("mousedown", down);
  btn.addEventListener("mouseup", up);
  btn.addEventListener("mouseleave", up);
  btn.addEventListener("touchstart", down);
  btn.addEventListener("touchend", up);
});

// Canvas tap movement (PC + Mobile)
canvas.addEventListener("mousedown", handleCanvasTap);
canvas.addEventListener("touchstart", handleCanvasTap);

function handleCanvasTap(e) {
  const p = e.touches ? e.touches[0] : e;
  const x = p.clientX;
  const y = p.clientY;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  input.left = x < cx - 40;
  input.right = x > cx + 40;
  input.up = y < cy - 40;
  input.down = y > cy + 40;
  input.interact = Math.abs(x - cx) < 40 && Math.abs(y - cy) < 40;

  setTimeout(clearMove, 120);
}

function clearMove() {
  input.up = input.down = input.left = input.right = false;
  input.interact = false;
}

// =======================================================
// 🎧 WEB AUDIO SYSTEM
// =======================================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
let audioStarted = false;

function startAudio() {
  if (!audioStarted) {
    audioCtx.resume();
    audioStarted = true;
  }
}
window.addEventListener("mousedown", startAudio);
window.addEventListener("touchstart", startAudio);

function createNoise() {
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

// 숨소리
function createBreath() {
  const noise = createNoise();
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 600;
  const gain = audioCtx.createGain();
  gain.gain.value = 0;
  noise.connect(filter).connect(gain).connect(audioCtx.destination);
  noise.start();
  return {
    set(v) {
      gain.gain.linearRampToValueAtTime(v * 0.3, audioCtx.currentTime + 0.1);
    },
  };
}

// 물방울
function playDrip() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = 700 + Math.random() * 300;
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}

// 종이 넘김
function playPaper() {
  const noise = createNoise();
  const filter = audioCtx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1200;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.15;
  noise.connect(filter).connect(gain).connect(audioCtx.destination);
  noise.start();
  noise.stop(audioCtx.currentTime + 0.3);
}

// 시계 초침
function playTick() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 1000;
  gain.gain.value = 0.12;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

// 아이템 내려놓기
function playDrop() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 280;
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.25);
}

// 설거지 물소리
function createSink() {
  const noise = createNoise();
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 900;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.05;
  noise.connect(filter).connect(gain).connect(audioCtx.destination);
  noise.start();
  return gain;
}

// =======================================================
// GAME STATE
// =======================================================
let currentScene = 0;
let inventory = [];
let imagination = 0.4;
let trust = 0.3;
let stress = 0;
let auditoryGauge = 0;
let wellCompleted = false;
let escapedHouse = false;
let soldierHelped = false;

// =======================================================
// UTILITIES
// =======================================================
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// =======================================================
// PARTICLES
// =======================================================
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = -Math.random() * 0.4 - 0.2;
    this.life = 1;
    this.color = color;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= 0.01 * dt;
  }
  draw() {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
let particles = [];

// =======================================================
// ANA CHARACTER — FULL HAIR FIXED
// =======================================================
class Ana {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height * 0.7;
    this.vx = 0;
    this.vy = 0;
    this.speed = 1.6;
    this.eyePulse = 0;
    this.skirtAngle = 0;
  }

  update(dt) {
    this.eyePulse = lerp(this.eyePulse, imagination, 0.05);

    let dx = 0,
      dy = 0;
    if (input.left) dx--;
    if (input.right) dx++;
    if (input.up) dy--;
    if (input.down) dy++;

    const mag = Math.hypot(dx, dy);
    if (mag > 0) {
      dx /= mag;
      dy /= mag;
      this.vx = dx * this.speed;
      this.vy = dy * this.speed;
      this.skirtAngle = lerp(this.skirtAngle, dx * 0.25, 0.1);
    } else {
      this.vx = lerp(this.vx, 0, 0.2);
      this.vy = lerp(this.vy, 0, 0.2);
    }

    this.x += this.vx;
    this.y += this.vy;

    this.x = clamp(this.x, 40, canvas.width - 40);
    this.y = clamp(this.y, 80, canvas.height - 40);

    if (imagination > 0.55) {
      let col =
        imagination > 0.75
          ? "rgba(180,140,255,0.8)"
          : trust > 0.5
          ? "rgba(255,215,120,0.8)"
          : "rgba(100,220,200,0.8)";
      particles.push(new Particle(this.x, this.y - 20, col));
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 20, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = "#d8cfc7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, 8);
    ctx.lineTo(-6, 20);
    ctx.moveTo(4, 8);
    ctx.lineTo(6, 20);
    ctx.stroke();

    // Skirt
    ctx.save();
    ctx.rotate(this.skirtAngle);
    ctx.fillStyle = "#5a4a6a";
    ctx.beginPath();
    ctx.moveTo(-11, 8);
    ctx.lineTo(11, 8);
    ctx.lineTo(15, -6);
    ctx.lineTo(-15, -6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Cardigan
    ctx.fillStyle = "#7a7f9a";
    ctx.beginPath();
    ctx.roundRect(-13, -22, 26, 20, 7);
    ctx.fill();

    // Arms
    ctx.strokeStyle = "#d8cfc7";
    ctx.beginPath();
    ctx.moveTo(-11, -16);
    ctx.lineTo(-19, -10);
    ctx.moveTo(11, -16);
    ctx.lineTo(19, -10);
    ctx.stroke();

    // Head
    ctx.fillStyle = "#ead6c9";
    ctx.beginPath();
    ctx.arc(0, -36, 11, 0, Math.PI * 2);
    ctx.fill();

    // =====================
    // FULL BOB HAIR
    // =====================
    ctx.fillStyle = "#1b1b22";

    // Back volume
    ctx.beginPath();
    ctx.ellipse(0, -38, 16, 18, 0, Math.PI * 0.15, Math.PI * 0.85);
    ctx.fill();

    // Right side hair (covers ear)
    ctx.beginPath();
    ctx.ellipse(7, -34, 10, 14, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Left side hair (ear exposed)
    ctx.beginPath();
    ctx.ellipse(-11, -34, 6, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Bangs
    ctx.beginPath();
    ctx.moveTo(-12, -40);
    ctx.quadraticCurveTo(-4, -46, 6, -42);
    ctx.quadraticCurveTo(12, -38, 10, -32);
    ctx.lineTo(-10, -32);
    ctx.closePath();
    ctx.fill();

    // Eyes
    const pupil = 2 + this.eyePulse * 3;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(-4, -36, pupil, 0, Math.PI * 2);
    ctx.arc(5, -36, pupil, 0, Math.PI * 2);
    ctx.fill();

    // Imagination shimmer
    if (imagination > 0.7) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(-3, -37, 1, 0, Math.PI * 2);
      ctx.arc(6, -37, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

const ana = new Ana();

// =======================================================
// FATHER
// =======================================================
class Father {
  constructor() {
    this.x = canvas.width * 0.6;
    this.y = canvas.height * 0.6;
    this.lookTimer = 0;
    this.looking = false;
    this.honeyDrops = [];
  }

  update(dt) {
    this.lookTimer += dt;
    if (this.lookTimer > 600) {
      this.lookTimer = 0;
      this.looking = !this.looking;
      playPaper();
    }

    if (Math.random() < 0.01) {
      this.honeyDrops.push({
        x: this.x + (Math.random() - 0.5) * 30,
        y: this.y + 30,
        life: 1,
      });
    }

    this.honeyDrops.forEach((d) => (d.life -= 0.01 * dt));
    this.honeyDrops = this.honeyDrops.filter((d) => d.life > 0);
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 28, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3a3a55";
    ctx.beginPath();
    ctx.roundRect(-15, -22, 30, 44, 7);
    ctx.fill();

    ctx.fillStyle = "#c9b8a8";
    ctx.beginPath();
    ctx.arc(0, -36, 13, 0, Math.PI * 2);
    ctx.fill();

    // Glasses reflection
    ctx.fillStyle = "rgba(180,200,255,0.6)";
    ctx.beginPath();
    ctx.rect(-11, -40, 9, 7);
    ctx.rect(2, -40, 9, 7);
    ctx.fill();

    // Arms
    ctx.strokeStyle = "#c9b8a8";
    ctx.lineWidth = 2;

    // Left hand with newspaper
    ctx.beginPath();
    ctx.moveTo(-15, -10);
    ctx.lineTo(-26, 0);
    ctx.stroke();
    ctx.fillStyle = "#555";
    ctx.fillRect(-38, -4, 12, 16);

    // Right bandaged hand
    ctx.beginPath();
    ctx.moveTo(15, -10);
    ctx.lineTo(24, 0);
    ctx.stroke();
    ctx.fillStyle = "#ddd";
    ctx.fillRect(20, -4, 12, 12);
    ctx.fillStyle = "rgba(180,60,60,0.5)";
    ctx.beginPath();
    ctx.arc(24, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Honey drops
    this.honeyDrops.forEach((d) => {
      ctx.globalAlpha = d.life;
      ctx.fillStyle = "rgba(255,200,50,0.6)";
      ctx.beginPath();
      ctx.arc(d.x, d.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }
}
const father = new Father();

// =======================================================
// MOTHER
// =======================================================
class Mother {
  constructor() {
    this.x = canvas.width * 0.4;
    this.y = canvas.height * 0.6;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = "#6a5a7a";
    ctx.beginPath();
    ctx.roundRect(-13, -20, 26, 40, 7);
    ctx.fill();
    ctx.fillStyle = "#d8c6b8";
    ctx.beginPath();
    ctx.arc(0, -34, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
const mother = new Mother();

// =======================================================
// SOLDIER / SPIRIT
// =======================================================
class Soldier {
  constructor() {
    this.x = canvas.width * 0.5;
    this.y = canvas.height * 0.55;
    this.state = "wounded";
    this.shadowPulse = 0;
  }

  update(dt) {
    if (trust > 0.6 && imagination > 0.6) this.state = "spirit";
    else this.state = "wounded";
    this.shadowPulse += 0.02 * dt;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    const shadowScale = this.state === "wounded" ? 1 + Math.sin(this.shadowPulse) * 0.25 : 1;
    ctx.save();
    ctx.scale(shadowScale, 1);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(0, 30, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.state === "spirit") {
      ctx.strokeStyle = "rgba(255,230,150,0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -30, 26, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = this.state === "spirit" ? "#aaa" : "#555";
    ctx.beginPath();
    ctx.roundRect(-15, -22, 30, 44, 7);
    ctx.fill();

    if (this.state === "spirit") {
      ctx.strokeStyle = "rgba(255,200,100,0.8)";
      ctx.beginPath();
      ctx.moveTo(-7, -10);
      ctx.lineTo(-2, 10);
      ctx.moveTo(5, -12);
      ctx.lineTo(8, 8);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(120,0,0,0.6)";
      ctx.beginPath();
      ctx.arc(-5, 0, 4, 0, Math.PI * 2);
      ctx.arc(6, 6, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#c9b8a8";
    ctx.beginPath();
    ctx.arc(0, -36, 13, 0, Math.PI * 2);
    ctx.fill();

    if (this.state === "spirit") {
      ctx.fillStyle = "#666";
      ctx.fillRect(-18, -38, 4, 4);
      ctx.fillRect(14, -38, 4, 4);
    }

    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(-4, -36, 2, 0, Math.PI * 2);
    ctx.arc(4, -36, 2, 0, Math.PI * 2);
    ctx.fill();

    // Hands
    ctx.strokeStyle = "#c9b8a8";
    ctx.beginPath();
    ctx.moveTo(-15, -6);
    ctx.lineTo(-24, 4);
    ctx.moveTo(15, -6);
    ctx.lineTo(24, 4);
    ctx.stroke();

    ctx.restore();
  }
}
const soldier = new Soldier();

// =======================================================
// UI
// =======================================================
function updateInventoryUI() {
  inventoryEl.textContent = inventory.map((i) => `[${i}]`).join(" ");
}

// =======================================================
// 🔊 SOUND INSTANCES
// =======================================================
const wellBreath = createBreath();
const soldierBreath = createBreath();
let sinkGain = null;
let dripTimer = 0;
let clockTimer = 0;

// =======================================================
// SCENE 1: WELL
// =======================================================
function sceneWell(dt) {
  hintEl.textContent = wellCompleted
    ? "…우물 아래에서 낯선 존재의 존재감이 느껴진다."
    : "우물을 눌러 숨소리에 집중하라";

  const grd = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    50,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 1.2
  );
  grd.addColorStop(0, "#1a1f2a");
  grd.addColorStop(1, "#04050a");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const wellX = canvas.width / 2;
  const wellY = canvas.height * 0.65;

  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.ellipse(wellX, wellY, 80, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = "#666";
  ctx.beginPath();
  ctx.moveTo(wellX, wellY);
  ctx.lineTo(wellX, canvas.height * 0.3);
  ctx.stroke();

  ana.update(1);
  ana.draw();

  const dist = Math.hypot(ana.x - wellX, ana.y - wellY);
  const pressing = dist < 100 && input.interact;

  if (pressing && !wellCompleted) auditoryGauge += 0.012;
  else auditoryGauge -= 0.006;

  auditoryGauge = clamp(auditoryGauge, 0, 1);
  wellBreath.set(auditoryGauge);

  dripTimer++;
  if (dripTimer > 140) {
    dripTimer = 0;
    playDrip();
  }

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(canvas.width / 2 - 100, 40, 200, 10);
  ctx.fillStyle = "rgba(180,220,255,0.8)";
  ctx.fillRect(canvas.width / 2 - 100, 40, 200 * auditoryGauge, 10);

  ctx.fillStyle = "#ccc";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("청각 집중", canvas.width / 2, 30);

  if (auditoryGauge >= 1 && !wellCompleted) {
    wellCompleted = true;
    imagination += 0.2;
    hintEl.textContent = "지도에 물음표가 새겨졌다…";
    wellBreath.set(0);
    setTimeout(() => {
      currentScene = 1;
    }, 1400);
  }
}

// =======================================================
// SCENE 2: HOUSE STEALTH
// =======================================================
let fatherTimer = 0;
let fatherLooking = false;

function sceneHouse(dt) {
  hintEl.textContent = escapedHouse
    ? "…집을 빠져나왔다."
    : "부모의 시선을 피해 빵과 물을 챙기고 탈출하라";

  ctx.fillStyle = "#2a2433";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 40) {
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.strokeRect(x, y, 40, 40);
    }
  }

  fatherTimer++;
  if (fatherTimer > 600) {
    fatherTimer = 0;
    fatherLooking = !fatherLooking;
    playPaper();
  }

  if (fatherLooking) {
    ctx.fillStyle = "rgba(50,70,120,0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  father.update(1);
  father.draw();
  mother.draw();

  if (!sinkGain) sinkGain = createSink();
  sinkGain.gain.value = fatherLooking ? 0.08 : 0.05;

  clockTimer++;
  if (clockTimer > 180) {
    clockTimer = 0;
    playTick();
  }

  const bread = { x: canvas.width * 0.3, y: canvas.height * 0.7 };
  const water = { x: canvas.width * 0.7, y: canvas.height * 0.7 };

  function drawItem(item, label) {
    ctx.fillStyle = "#caa46a";
    ctx.beginPath();
    ctx.roundRect(item.x - 10, item.y - 6, 20, 12, 4);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "10px sans-serif";
    ctx.fillText(label, item.x, item.y - 10);
  }

  if (!inventory.includes("bread")) drawItem(bread, "빵");
  if (!inventory.includes("water")) drawItem(water, "물");

  ana.update(1);
  ana.draw();

  if (fatherLooking && Math.abs(ana.x - father.x) < 120) {
    stress = clamp(stress + 0.01, 0, 1);
  } else {
    stress = clamp(stress - 0.02, 0, 1);
  }

  if (stress > 0.6) {
    ctx.strokeStyle = "rgba(100,150,255,0.4)";
    ctx.lineWidth = 12;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ana.speed = 1.1;
  } else {
    ana.speed = 1.6;
  }

  function tryPickup(item, name) {
    const d = Math.hypot(ana.x - item.x, ana.y - item.y);
    if (d < 40 && input.interact && !inventory.includes(name)) {
      inventory.push(name);
      updateInventoryUI();
      playDrop();
    }
  }

  tryPickup(bread, "bread");
  tryPickup(water, "water");

  const door = { x: canvas.width / 2, y: 80 };
  ctx.fillStyle = "#444";
  ctx.fillRect(door.x - 20, door.y - 40, 40, 80);
  ctx.fillStyle = "#888";
  ctx.fillRect(door.x + 10, door.y, 4, 4);

  const exitDist = Math.hypot(ana.x - door.x, ana.y - door.y);
  if (exitDist < 50 && inventory.includes("bread") && inventory.includes("water")) {
    if (input.interact) {
      escapedHouse = true;
      if (sinkGain) sinkGain.gain.value = 0;
      setTimeout(() => {
        currentScene = 2;
      }, 1000);
    }
  }
}

// =======================================================
// SCENE 3: HIDEOUT
// =======================================================
let droppedItems = [];

function sceneHideout(dt) {
  hintEl.textContent = soldierHelped
    ? "…그는 조용히 숨을 고른다."
    : "아이템 내려놓고 멀어져 관찰하라";

  ctx.fillStyle = "#0a0a12";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 5; i++) {
    const x = canvas.width * 0.2 + i * canvas.width * 0.15;
    ctx.strokeStyle = "rgba(200,200,255,0.05)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 50, canvas.height);
    ctx.stroke();
  }

  ana.update(1);
  ana.draw();

  soldier.update(1);
  soldier.draw();

  droppedItems.forEach((it) => {
    ctx.fillStyle = it === "bread" ? "#caa46a" : "#6aaacb";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height * 0.65, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  const dist = Math.hypot(ana.x - soldier.x, ana.y - soldier.y);

  if (dist < 80 && !soldierHelped) {
    imagination = clamp(imagination - 0.002, 0, 1);
    trust = clamp(trust - 0.002, 0, 1);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  soldierBreath.set(clamp(1 - dist / 200, 0, 1));

  if (input.interact && inventory.length > 0 && dist > 90) {
    const item = inventory.shift();
    droppedItems.push(item);
    updateInventoryUI();
    trust += 0.2;
    playDrop();
  }

  if (input.observe && dist > 90) {
    imagination += 0.1;
    trust += 0.05;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "14px serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "그의 군복 주머니에서 낡은 가족 사진이 보인다…",
      canvas.width / 2,
      canvas.height * 0.3
    );
    soldierHelped = true;
  }

  if (input.back) ana.y += 1.5;

  imagination = clamp(imagination, 0, 1);
  trust = clamp(trust, 0, 1);
}

// =======================================================
// MAIN LOOP
// =======================================================
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentScene === 0) sceneWell(1);
  if (currentScene === 1) sceneHouse(1);
  if (currentScene === 2) sceneHideout(1);

  particles.forEach((p) => {
    p.update(1);
    p.draw();
  });
  particles = particles.filter((p) => p.life > 0);

  requestAnimationFrame(loop);
}

// =======================================================
// START
// =======================================================
updateInventoryUI();
loop();