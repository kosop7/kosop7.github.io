// ===============================
// CANVAS SETUP
// ===============================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hintEl = document.getElementById("hint");
const inventoryEl = document.getElementById("inventory");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// ===============================
// INPUT SYSTEM (Keyboard + Touch)
// ===============================
const input = {
  left: false,
  right: false,
  up: false,
  down: false,
  q: false,
  w: false,
  e: false,
  r: false,
};

const keyMap = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  q: "q",
  w: "w",
  e: "e",
  r: "r",
};

window.addEventListener("keydown", (e) => {
  const k = keyMap[e.key];
  if (k) input[k] = true;
});
window.addEventListener("keyup", (e) => {
  const k = keyMap[e.key];
  if (k) input[k] = false;
});

// Touch: 화면 좌측 이동 / 우측 액션
let touchStart = null;
canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY };
});
canvas.addEventListener("touchmove", (e) => {
  if (!touchStart) return;
  const t = e.touches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  input.left = dx < -20;
  input.right = dx > 20;
  input.up = dy < -20;
  input.down = dy > 20;
});
canvas.addEventListener("touchend", () => {
  input.left = input.right = input.up = input.down = false;
  input.q = true; // tap = interact
  setTimeout(() => (input.q = false), 100);
});

// ===============================
// GAME STATE
// ===============================
let currentScene = 0;
let time = 0;
let inventory = [];
let imagination = 0.4;
let trust = 0.3;
let stress = 0;
let auditoryGauge = 0;
let auditoryTarget = 1;
let wellCompleted = false;
let escapedHouse = false;
let soldierHelped = false;

// ===============================
// UTILITIES
// ===============================
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ===============================
// PARTICLE SYSTEM
// ===============================
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

// ===============================
// ANA CHARACTER
// ===============================
class Ana {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height * 0.7;
    this.vx = 0;
    this.vy = 0;
    this.speed = 1.6;
    this.eyePulse = 0;
    this.skirtAngle = 0;
    this.breathe = 0;
  }

  update(dt) {
    this.breathe += 0.03 * dt;
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
      this.skirtAngle = lerp(this.skirtAngle, dx * 0.3, 0.1);
    } else {
      this.vx = lerp(this.vx, 0, 0.2);
      this.vy = lerp(this.vy, 0, 0.2);
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.x = clamp(this.x, 50, canvas.width - 50);
    this.y = clamp(this.y, 100, canvas.height - 50);

    // Imagination particles
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
    ctx.strokeStyle = "#d0c8c8";
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
    ctx.moveTo(-10, 8);
    ctx.lineTo(10, 8);
    ctx.lineTo(14, -6);
    ctx.lineTo(-14, -6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Cardigan
    ctx.fillStyle = "#7a7f9a";
    ctx.beginPath();
    ctx.roundRect(-12, -22, 24, 20, 6);
    ctx.fill();

    // Arms
    ctx.strokeStyle = "#d0c8c8";
    ctx.beginPath();
    ctx.moveTo(-10, -16);
    ctx.lineTo(-18, -10);
    ctx.moveTo(10, -16);
    ctx.lineTo(18, -10);
    ctx.stroke();

    // Head
    ctx.fillStyle = "#e2cfc2";
    ctx.beginPath();
    ctx.arc(0, -34, 10, 0, Math.PI * 2);
    ctx.fill();

    // Hair (asymmetric bob)
    ctx.fillStyle = "#1a1a1f";
    ctx.beginPath();
    ctx.moveTo(-12, -38);
    ctx.quadraticCurveTo(-10, -48, 0, -48);
    ctx.quadraticCurveTo(10, -48, 12, -38);
    ctx.lineTo(8, -26);
    ctx.lineTo(-10, -26);
    ctx.closePath();
    ctx.fill();

    // Hair covering one eye
    ctx.beginPath();
    ctx.moveTo(-10, -38);
    ctx.lineTo(-2, -38);
    ctx.lineTo(-4, -26);
    ctx.closePath();
    ctx.fill();

    // Eyes
    const pupilSize = 2 + this.eyePulse * 3;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(-3, -34, pupilSize, 0, Math.PI * 2);
    ctx.arc(4, -34, pupilSize, 0, Math.PI * 2);
    ctx.fill();

    // Imagination shimmer in eyes
    if (imagination > 0.7) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(-2, -35, 1, 0, Math.PI * 2);
      ctx.arc(5, -35, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

const ana = new Ana();

// ===============================
// FATHER CHARACTER
// ===============================
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

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 28, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = "#3a3a55";
    ctx.beginPath();
    ctx.roundRect(-14, -20, 28, 40, 6);
    ctx.fill();

    // Head
    ctx.fillStyle = "#c9b8a8";
    ctx.beginPath();
    ctx.arc(0, -34, 12, 0, Math.PI * 2);
    ctx.fill();

    // Glasses reflection
    ctx.fillStyle = "rgba(180,200,255,0.6)";
    ctx.beginPath();
    ctx.rect(-10, -38, 8, 6);
    ctx.rect(2, -38, 8, 6);
    ctx.fill();

    // Arms
    ctx.strokeStyle = "#c9b8a8";
    ctx.lineWidth = 2;

    // Left hand holding newspaper
    ctx.beginPath();
    ctx.moveTo(-14, -10);
    ctx.lineTo(-24, 0);
    ctx.stroke();
    ctx.fillStyle = "#555";
    ctx.fillRect(-34, -2, 10, 12);

    // Right hand (bandaged)
    ctx.beginPath();
    ctx.moveTo(14, -10);
    ctx.lineTo(22, 0);
    ctx.stroke();
    ctx.fillStyle = "#ddd";
    ctx.fillRect(18, -4, 10, 10);

    // Bandage stain
    ctx.fillStyle = "rgba(180,60,60,0.5)";
    ctx.beginPath();
    ctx.arc(22, 0, 3, 0, Math.PI * 2);
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

// ===============================
// MOTHER CHARACTER (Simplified)
// ===============================
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
    ctx.roundRect(-12, -18, 24, 36, 6);
    ctx.fill();
    ctx.fillStyle = "#d8c6b8";
    ctx.beginPath();
    ctx.arc(0, -30, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const mother = new Mother();

// ===============================
// SOLDIER / SPIRIT
// ===============================
class Soldier {
  constructor() {
    this.x = canvas.width * 0.5;
    this.y = canvas.height * 0.55;
    this.state = "fear";
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

    // Shadow (fear distortion)
    const shadowScale = this.state === "wounded" ? 1 + Math.sin(this.shadowPulse) * 0.2 : 1;
    ctx.save();
    ctx.scale(shadowScale, 1);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(0, 30, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Halo if spirit
    if (this.state === "spirit") {
      ctx.strokeStyle = "rgba(255,230,150,0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -30, 26, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Body
    ctx.fillStyle = this.state === "spirit" ? "#aaa" : "#555";
    ctx.beginPath();
    ctx.roundRect(-14, -20, 28, 40, 6);
    ctx.fill();

    // Cracks / wounds
    if (this.state === "spirit") {
      ctx.strokeStyle = "rgba(255,200,100,0.8)";
      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.lineTo(-2, 10);
      ctx.moveTo(4, -12);
      ctx.lineTo(6, 8);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(120,0,0,0.6)";
      ctx.beginPath();
      ctx.arc(-4, 0, 3, 0, Math.PI * 2);
      ctx.arc(5, 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Head
    ctx.fillStyle = "#c9b8a8";
    ctx.beginPath();
    ctx.arc(0, -34, 12, 0, Math.PI * 2);
    ctx.fill();

    // Frankenstein bolts if spirit
    if (this.state === "spirit") {
      ctx.fillStyle = "#666";
      ctx.fillRect(-16, -36, 4, 4);
      ctx.fillRect(12, -36, 4, 4);
    }

    // Eyes
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(-4, -34, 2, 0, Math.PI * 2);
    ctx.arc(4, -34, 2, 0, Math.PI * 2);
    ctx.fill();

    // Hands (gestures)
    ctx.strokeStyle = "#c9b8a8";
    ctx.beginPath();
    ctx.moveTo(-14, -6);
    ctx.lineTo(-22, 4);
    ctx.moveTo(14, -6);
    ctx.lineTo(22, 4);
    ctx.stroke();

    ctx.restore();
  }
}

const soldier = new Soldier();

// ===============================
// UI
// ===============================
function updateInventoryUI() {
  inventoryEl.innerHTML = inventory.map((i) => `[${i}]`).join(" ");
}

// ===============================
// SCENE 1: WELL - AUDITORY FOCUS
// ===============================
function sceneWell(dt) {
  hintEl.textContent = wellCompleted
    ? "…우물 아래에서 낯선 존재의 존재감이 느껴진다."
    : "Q: 우물을 살펴보기 — 숨소리에 집중하라";

  // Background
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

  // Well
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2, canvas.height * 0.65, 80, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Rope
  ctx.strokeStyle = "#666";
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, canvas.height * 0.65);
  ctx.lineTo(canvas.width / 2, canvas.height * 0.3);
  ctx.stroke();

  // Ambient noise visualization
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(100,100,140,${Math.random() * 0.1})`;
    ctx.beginPath();
    ctx.arc(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      Math.random() * 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Ana
  ana.update(dt);
  ana.draw();

  // Interaction
  const dist = Math.hypot(ana.x - canvas.width / 2, ana.y - canvas.height * 0.65);
  if (dist < 100 && input.q && !wellCompleted) {
    auditoryGauge += 0.01 * dt;
  } else {
    auditoryGauge -= 0.005 * dt;
  }
  auditoryGauge = clamp(auditoryGauge, 0, 1);

  // UI Gauge
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
    setTimeout(() => {
      currentScene = 1;
    }, 1500);
  }
}

// ===============================
// SCENE 2: HOUSE STEALTH
// ===============================
let fatherTimer = 0;
let fatherLooking = false;

function sceneHouse(dt) {
  hintEl.textContent = escapedHouse
    ? "…집을 빠져나왔다."
    : "부모의 시선을 피해 빵과 물을 챙기고 탈출하라 (Q: 집기)";

  // Background
  ctx.fillStyle = "#2a2433";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Kitchen tiles
  for (let y = 0; y < canvas.height; y += 40) {
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.strokeRect(x, y, 40, 40);
    }
  }

  // Father pattern
  fatherTimer += dt;
  if (fatherTimer > 600) {
    fatherTimer = 0;
    fatherLooking = !fatherLooking;
  }

  // Color temperature drop when father looks
  if (fatherLooking) {
    ctx.fillStyle = "rgba(50,70,120,0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  father.update(dt);
  father.draw();
  mother.draw();

  // Items
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

  ana.update(dt);
  ana.draw();

  // Stress if father looks and Ana in sight
  if (fatherLooking && Math.abs(ana.x - father.x) < 120) {
    stress = clamp(stress + 0.01 * dt, 0, 1);
  } else {
    stress = clamp(stress - 0.02 * dt, 0, 1);
  }

  if (stress > 0.6) {
    ctx.strokeStyle = "rgba(100,150,255,0.4)";
    ctx.lineWidth = 12;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ana.speed = 1.1;
  } else {
    ana.speed = 1.6;
  }

  // Interaction pickup
  function tryPickup(item, name) {
    const d = Math.hypot(ana.x - item.x, ana.y - item.y);
    if (d < 40 && input.q && !inventory.includes(name)) {
      inventory.push(name);
      updateInventoryUI();
    }
  }

  tryPickup(bread, "bread");
  tryPickup(water, "water");

  // Exit door
  const door = { x: canvas.width / 2, y: 80 };
  ctx.fillStyle = "#444";
  ctx.fillRect(door.x - 20, door.y - 40, 40, 80);
  ctx.fillStyle = "#888";
  ctx.fillRect(door.x + 10, door.y, 4, 4);

  const exitDist = Math.hypot(ana.x - door.x, ana.y - door.y);
  if (exitDist < 50 && inventory.includes("bread") && inventory.includes("water")) {
    if (input.q) {
      escapedHouse = true;
      setTimeout(() => {
        currentScene = 2;
      }, 1000);
    }
  }
}

// ===============================
// SCENE 3: SOLDIER / SPIRIT INTERACTION
// ===============================
let droppedItems = [];

function sceneHideout(dt) {
  hintEl.textContent = soldierHelped
    ? "…그는 조용히 숨을 고른다."
    : "E: 아이템 내려놓기 / W: 관찰 / R: 뒤로 물러서기";

  // Background
  ctx.fillStyle = "#0a0a12";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dust light rays
  for (let i = 0; i < 5; i++) {
    const x = canvas.width * 0.2 + i * canvas.width * 0.15;
    ctx.strokeStyle = "rgba(200,200,255,0.05)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 50, canvas.height);
    ctx.stroke();
  }

  ana.update(dt);
  ana.draw();

  soldier.update(dt);
  soldier.draw();

  // Dropped items
  droppedItems.forEach((it) => {
    ctx.fillStyle = it === "bread" ? "#caa46a" : "#6aaacb";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height * 0.65, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  const dist = Math.hypot(ana.x - soldier.x, ana.y - soldier.y);

  // Fear reaction if too close
  if (dist < 80 && !soldierHelped) {
    imagination = clamp(imagination - 0.002 * dt, 0, 1);
    trust = clamp(trust - 0.002 * dt, 0, 1);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Drop item
  if (input.e && inventory.length > 0 && dist > 90) {
    const item = inventory.shift();
    droppedItems.push(item);
    updateInventoryUI();
    trust += 0.2;
  }

  // Observe
  if (input.w && dist > 90) {
    imagination += 0.1;
    trust += 0.05;

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "14px serif";
    ctx.textAlign = "center";
    ctx.fillText("그의 군복 주머니에서 낡은 가족 사진이 보인다…", canvas.width / 2, canvas.height * 0.3);

    soldierHelped = true;
  }

  // Step back
  if (input.r) {
    ana.y += 1.5 * dt;
  }

  imagination = clamp(imagination, 0, 1);
  trust = clamp(trust, 0, 1);
}

// ===============================
// MAIN LOOP
// ===============================
function update(dt) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentScene === 0) sceneWell(dt);
  if (currentScene === 1) sceneHouse(dt);
  if (currentScene === 2) sceneHideout(dt);

  // Draw particles
  particles.forEach((p) => {
    p.update(dt);
    p.draw();
  });
  particles = particles.filter((p) => p.life > 0);

  time += dt;
  requestAnimationFrame((t) => update(1));
}

// ===============================
// START
// ===============================
updateInventoryUI();
update(1);
