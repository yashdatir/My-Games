import * as THREE from 'three';
import { getTerrainHeight, buildBharatWorld } from './world.js';
import { SpaceArena, ASTRA_ARSENAL } from './space.js';
import { SkyPatrolManager } from './skyPatrol.js';
import { SoundFX } from './audio.js';
import { HeroController } from './player.js';
import { TempleGuards } from './guards.js';
import { TownsfolkManager } from './townsfolk.js';
import { WorldMapOverlay } from './mapOverlay.js';
const SAVE_KEY = 'swarnabhumi_chronicles_v1';
function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw
      ? JSON.parse(raw)
      : { skillLevel: 1, visitedCodes: [], defeated: 0, vimanaUnlocked: false };
  } catch {
    return { skillLevel: 1, visitedCodes: [], defeated: 0, vimanaUnlocked: false };
  }
}
function saveProgress(skillLevel, temples, defeatedCount, vimanaUnlocked) {
  const visitedCodes = temples
    .filter((t) => t.visited && t.type === 'ASTRA')
    .map((t) => t.shortName);
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({ skillLevel, visitedCodes, defeated: defeatedCount, vimanaUnlocked })
  );
}
const savedData = loadProgress();
const scene = new THREE.Scene();
const spaceSkyColor = new THREE.Color('#050816');
scene.background = new THREE.Color('#7dd3fc');
scene.fog = new THREE.Fog('#7dd3fc', 120, 420);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1300);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);
const ambientLight = new THREE.AmbientLight('#ffe8d6', 0.8);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight('#fff1e6', 1.8);
sunLight.position.set(120, 200, 90);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
const d = 220;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
scene.add(sunLight);
let vimanaUnlocked = Boolean(savedData.vimanaUnlocked);
const { temples, updateWorld } = buildBharatWorld(scene, savedData.visitedCodes, vimanaUnlocked);
const vimanaTemple = temples.find((t) => t.type === 'VIMANA');
function buildPushpakaVimana() {
  const vimana = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    metalness: 0.45,
    roughness: 0.25,
    flatShading: true
  });
  const crimsonMat = new THREE.MeshStandardMaterial({
    color: '#9f1239',
    roughness: 0.4,
    flatShading: true
  });
  const glowMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.85, 0.65, 8), crimsonMat);
  hull.scale.set(1.0, 1.0, 1.65);
  hull.position.y = 0.65;
  hull.castShadow = true;
  vimana.add(hull);
  const deckRim = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.15, 0.16, 8), goldMat);
  deckRim.scale.set(1.0, 1.0, 1.68);
  deckRim.position.y = 1.02;
  vimana.add(deckRim);
  const prow = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.7, 6), goldMat);
  prow.rotation.x = -Math.PI / 2;
  prow.position.set(0, 0.78, -2.35);
  prow.castShadow = true;
  vimana.add(prow);
  const wingGeo = new THREE.BoxGeometry(1.8, 0.12, 1.1);
  const leftWing = new THREE.Mesh(wingGeo, goldMat);
  leftWing.position.set(-1.55, 0.85, 0.2);
  leftWing.rotation.y = 0.32;
  leftWing.rotation.z = 0.14;
  leftWing.castShadow = true;
  vimana.add(leftWing);
  const rightWing = new THREE.Mesh(wingGeo, goldMat);
  rightWing.position.set(1.55, 0.85, 0.2);
  rightWing.rotation.y = -0.32;
  rightWing.rotation.z = -0.14;
  rightWing.castShadow = true;
  vimana.add(rightWing);
  [
    [-0.68, -0.68],
    [0.68, -0.68],
    [-0.68, 0.68],
    [0.68, 0.68]
  ].forEach(([px, pz]) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.05, 6), goldMat);
    pillar.position.set(px, 1.55, pz);
    vimana.add(pillar);
  });
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.95, 8), crimsonMat);
  canopy.position.set(0, 2.45, 0);
  canopy.castShadow = true;
  vimana.add(canopy);
  const kalasha = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), goldMat);
  kalasha.position.set(0, 3.05, 0);
  vimana.add(kalasha);
  [-0.55, 0.55].forEach((tx) => {
    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.4, 8), glowMat);
    thruster.rotation.x = Math.PI / 2;
    thruster.position.set(tx, 0.72, 1.85);
    vimana.add(thruster);
  });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.06, 6, 20), glowMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.28;
  vimana.add(halo);
  return { group: vimana, halo };
}
const { group: vehicle, halo: vimanaHalo } = buildPushpakaVimana();
const vStartX = vimanaTemple.pos.x;
const vStartZ = vimanaTemple.pos.z + 5.5;
vehicle.position.set(vStartX, Math.max(0.2, getTerrainHeight(vStartX, vStartZ)), vStartZ);
scene.add(vehicle);
const sfx = new SoundFX();
const hero = new HeroController(scene, vehicle, getTerrainHeight, sfx, vimanaUnlocked);
const startX = 68;
const startZ = -32;
hero.mesh.position.set(startX, Math.max(0.2, getTerrainHeight(startX, startZ)), startZ);
const templeGuards = new TempleGuards(scene, getTerrainHeight, sfx);
templeGuards.spawnForTemples(temples);
const townsfolk = new TownsfolkManager(scene, getTerrainHeight);
townsfolk.populateWorld(temples);
const spaceArena = new SpaceArena(scene, sfx);
spaceArena.defeatedCount = savedData.defeated || 0;
const skyPatrol = new SkyPatrolManager(scene, sfx);
let speed = 0;
let verticalVel = 0;
let skillLevel = savedData.skillLevel || 1;
let lastSavedDefeated = spaceArena.defeatedCount;
let isSpaceMode = false;
let timeOfDay = 0.42;
let cameraYaw = 0;
let cameraPitch = 0.35;
let isMouseDown = false;
let isRightDragging = false;
const worldMap = new WorldMapOverlay(temples, getTerrainHeight, (targetTemple) => {
  const destX = targetTemple.pos.x;
  const destZ = targetTemple.pos.z + 6.5;
  const destY = Math.max(0.2, getTerrainHeight(destX, destZ));
  if (vimanaUnlocked) {
    vehicle.position.set(destX, destY, destZ);
  }
  speed = 0;
  verticalVel = 0;
  if (hero.mode === 'ON_FOOT') {
    hero.mesh.position.set(destX - 2.4, destY, destZ);
  }
  sfx.playTempleChime();
  showTransientNotice(`✨ Astral Teleported to ${targetTemple.name}`);
});
const codexModalEl = document.getElementById('codex-modal');
let isCodexOpen = false;
function renderCodex() {
  const liberatedCount = temples.filter((t) => t.visited).length;
  document.getElementById('codex-shrine-progress').textContent = `${liberatedCount}/${temples.length}`;
  const shrineListEl = document.getElementById('codex-shrine-list');
  shrineListEl.innerHTML = temples
    .map(
      (t) => `
      <div class="codex-item ${t.visited ? 'unlocked' : ''}">
        <div class="codex-item-top">
          <span>[${t.shortName}] ${t.name}</span>
          <span class="codex-badge">${t.visited ? 'LIBERATED' : 'GUARDED'}</span>
        </div>
        <div class="codex-item-sub">${t.region} • ${t.rewardText}</div>
      </div>`
    )
    .join('');
  const astraListEl = document.getElementById('codex-astra-list');
  astraListEl.innerHTML = Object.entries(ASTRA_ARSENAL)
    .map(([slot, spec]) => {
      const unlocked = skillLevel >= spec.minLevel;
      return `
        <div class="codex-item ${unlocked ? 'unlocked' : ''}">
          <div class="codex-item-top">
            <span style="color:${spec.color}">[${slot}] ${spec.name}</span>
            <span class="codex-badge">${unlocked ? 'UNLOCKED' : `REQ LVL ${spec.minLevel}`}</span>
          </div>
          <div class="codex-item-sub">Bolts: ${spec.spreads.length} • Power: ${spec.damage}x • Cooldown: ${spec.cooldown}ms</div>
        </div>`;
    })
    .join('');
}
function toggleCodex(forceState) {
  isCodexOpen = typeof forceState === 'boolean' ? forceState : !isCodexOpen;
  if (isCodexOpen) {
    if (document.pointerLockElement) document.exitPointerLock();
    if (worldMap.isOpen) worldMap.toggle(false);
    renderCodex();
    codexModalEl.style.display = 'flex';
  } else {
    codexModalEl.style.display = 'none';
  }
}
document.getElementById('open-codex-btn').addEventListener('click', () => toggleCodex());
document.getElementById('close-codex-btn').addEventListener('click', () => toggleCodex(false));
const keys = {};
const modeBadgeEl = document.getElementById('mode-badge');
const locationEl = document.getElementById('location');
const timeDisplayEl = document.getElementById('time-display');
const skillEl = document.getElementById('skill');
const shrineCountEl = document.getElementById('shrine-count');
const activeAstraEl = document.getElementById('active-astra');
const scoreEl = document.getElementById('score');
const shieldBarEl = document.getElementById('shield-bar');
const shieldTextEl = document.getElementById('shield-text');
const alertBannerEl = document.getElementById('alert-banner');
const radarLabelEl = document.getElementById('radar-label');
const promptEl = document.getElementById('interaction-prompt');
const bossHudEl = document.getElementById('boss-hud');
const bossBarEl = document.getElementById('boss-bar');
const bossHpTextEl = document.getElementById('boss-hp-text');
const musicBtnEl = document.getElementById('toggle-music-btn');
modeBadgeEl.textContent = 'ON FOOT';
modeBadgeEl.style.background = 'linear-gradient(135deg, #38bdf8, #0284c7)';
function refreshSkillHUD() {
  const unlockedCount = Math.min(3, skillLevel);
  skillEl.textContent = `Lvl ${skillLevel} (${unlockedCount}/3 Astras)`;
  const liberatedCount = temples.filter((t) => t.visited).length;
  shrineCountEl.textContent = `${liberatedCount} / ${temples.length} Liberated`;
  const spec = ASTRA_ARSENAL[spaceArena.selectedAstra];
  activeAstraEl.textContent = `[${spaceArena.selectedAstra}] ${spec.name}`;
  activeAstraEl.style.color = spec.color;
}
refreshSkillHUD();
function showTransientNotice(text) {
  promptEl.textContent = text;
  promptEl.style.display = 'block';
  setTimeout(() => {
    if (!hero.isNearVehicle()) promptEl.style.display = 'none';
  }, 2400);
}
function handleToggleMusic() {
  const playing = sfx.toggleAmbientMusic();
  musicBtnEl.classList.toggle('active', playing);
  musicBtnEl.textContent = playing ? 'MUSIC ON' : 'MUSIC';
  showTransientNotice(playing ? '🎶 Tanpura & Bansuri Ambient Audio Enabled' : '🔇 Ambient Audio Muted');
}
musicBtnEl.addEventListener('click', handleToggleMusic);
document.getElementById('open-map-btn').addEventListener('click', () => {
  if (document.pointerLockElement) document.exitPointerLock();
  if (isCodexOpen) toggleCodex(false);
  worldMap.toggle();
});
document.getElementById('reset-save-btn').addEventListener('click', () => {
  localStorage.removeItem(SAVE_KEY);
  window.location.reload();
});
renderer.domElement.addEventListener('mousedown', (e) => {
  if (!gameStarted || worldMap.isOpen || isCodexOpen) return;
  if (e.button === 0) {
    isMouseDown = true;
    if (document.pointerLockElement !== renderer.domElement) {
      renderer.domElement.requestPointerLock?.();
    }
  } else if (e.button === 2) {
    isRightDragging = true;
  }
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 0) isMouseDown = false;
  if (e.button === 2) isRightDragging = false;
});
window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('mousemove', (e) => {
  if (!gameStarted || worldMap.isOpen || isCodexOpen) return;
  if (document.pointerLockElement === renderer.domElement || isRightDragging) {
    cameraYaw -= e.movementX * 0.0045;
    cameraPitch = THREE.MathUtils.clamp(cameraPitch + e.movementY * 0.0035, 0.08, 1.15);
  }
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Tab') e.preventDefault();
  if (!gameStarted) return;
  if (e.code === 'Tab' && !e.repeat) {
    toggleCodex();
    return;
  }
  if (e.code === 'Escape') {
    if (isCodexOpen) {
      toggleCodex(false);
      return;
    }
    if (worldMap.isOpen) {
      worldMap.toggle(false);
      return;
    }
  }
  if (e.code === 'KeyM' && !e.repeat) {
    if (document.pointerLockElement) document.exitPointerLock();
    if (isCodexOpen) toggleCodex(false);
    worldMap.toggle();
    return;
  }
  if (!gameStarted || worldMap.isOpen || isCodexOpen) return;
  if (['Digit1', 'Digit2', 'Digit3'].includes(e.code) && !e.repeat) {
    const slot = Number(e.code.replace('Digit', ''));
    const res = spaceArena.selectAstra(slot, skillLevel);
    if (res.ok) {
      refreshSkillHUD();
      showTransientNotice(`⚡ Equipped ${res.spec.name}`);
    } else if (res.reason) {
      showTransientNotice(res.reason);
    }
    return;
  }
  if (e.code === 'KeyN' && !e.repeat) {
    handleToggleMusic();
    return;
  }
  if (e.code === 'KeyE' && !e.repeat) {
    const result = hero.toggleMode(isSpaceMode);
    if (result.changed) {
      speed = 0;
      verticalVel = 0;
      modeBadgeEl.textContent = result.mode === 'ON_FOOT' ? 'ON FOOT' : 'VIMANA';
      modeBadgeEl.style.background =
        result.mode === 'ON_FOOT'
          ? 'linear-gradient(135deg, #38bdf8, #0284c7)'
          : 'linear-gradient(135deg, #f59e0b, #d97706)';
    } else if (result.reason) {
      showTransientNotice(result.reason);
    }
  }
  keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});
const minimapCanvas = document.getElementById('minimap');
const ctx = minimapCanvas.getContext('2d');
function drawMinimap(activeEntity) {
  const w = minimapCanvas.width;
  const h = minimapCanvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radarScale = 0.34;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = isSpaceMode ? 'rgba(15, 10, 35, 0.9)' : 'rgba(13, 38, 54, 0.9)';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
  ctx.lineWidth = 1;
  [30, 58].forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(cameraYaw);
  if (!isSpaceMode) {
    ctx.fillStyle = 'rgba(132, 169, 140, 0.25)';
    ctx.beginPath();
    ctx.arc(-activeEntity.position.x * radarScale, -activeEntity.position.z * radarScale, 375 * radarScale, 0, Math.PI * 2);
    ctx.fill();
    for (const t of temples) {
      const dx = (t.pos.x - activeEntity.position.x) * radarScale;
      const dz = (t.pos.z - activeEntity.position.z) * radarScale;
      ctx.fillStyle = t.type === 'VIMANA' ? '#e879f9' : t.visited ? '#38bdf8' : '#ffd700';
      ctx.beginPath();
      ctx.arc(dx, dz, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(t.shortName, dx + 6, dz + 3);
    }
    for (const g of templeGuards.guards) {
      const gx = (g.mesh.position.x - activeEntity.position.x) * radarScale;
      const gz = (g.mesh.position.z - activeEntity.position.z) * radarScale;
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(gx, gz, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const s of skyPatrol.scouts) {
      const sx = (s.mesh.position.x - activeEntity.position.x) * radarScale;
      const sz = (s.mesh.position.z - activeEntity.position.z) * radarScale;
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(sx, sz, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (hero.mode === 'ON_FOOT') {
      const vx = (vehicle.position.x - activeEntity.position.x) * radarScale;
      const vz = (vehicle.position.z - activeEntity.position.z) * radarScale;
      ctx.fillStyle = '#e879f9';
      ctx.fillRect(vx - 4, vz - 4, 8, 8);
    }
  } else {
    for (const r of spaceArena.rakshasas) {
      const dx = (r.mesh.position.x - activeEntity.position.x) * radarScale;
      const dz = (r.mesh.position.z - activeEntity.position.z) * radarScale;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(dx, dz, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (spaceArena.boss) {
      const bx = (spaceArena.boss.mesh.position.x - activeEntity.position.x) * radarScale;
      const bz = (spaceArena.boss.mesh.position.z - activeEntity.position.z) * radarScale;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(bx, bz, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 7);
  ctx.lineTo(cx - 5, cy + 5);
  ctx.lineTo(cx, cy + 2);
  ctx.lineTo(cx + 5, cy + 5);
  ctx.closePath();
  ctx.fill();
}
function updateShieldHUD(shieldValue) {
  const pct = Math.max(0, Math.round(shieldValue));
  shieldBarEl.style.width = `${pct}%`;
  shieldTextEl.textContent = `${pct}%`;
  shieldBarEl.style.background =
    pct < 30 ? '#ef4444' : 'linear-gradient(90deg, #38bdf8, #ffd700)';
}
let gameStarted = false;
const homeScreenEl = document.getElementById('home-screen');
const gameUiEl = document.getElementById('game-ui');
const playBtnLabelEl = document.getElementById('play-btn-label');
const howToPlayBoxEl = document.getElementById('how-to-play-box');
if (savedData.vimanaUnlocked || savedData.visitedCodes.length > 0 || savedData.defeated > 0) {
  playBtnLabelEl.textContent = 'CONTINUE THE JOURNEY';
}
document.getElementById('play-game-btn').addEventListener('click', () => {
  gameStarted = true;
  homeScreenEl.style.opacity = '0';
  setTimeout(() => {
    homeScreenEl.style.display = 'none';
    gameUiEl.style.display = 'block';
  }, 350);
  renderer.domElement.requestPointerLock?.();
});
document.getElementById('home-menu-btn').addEventListener('click', () => {
  gameStarted = false;
  if (document.pointerLockElement) document.exitPointerLock();
  gameUiEl.style.display = 'none';
  homeScreenEl.style.display = 'flex';
  requestAnimationFrame(() => {
    homeScreenEl.style.opacity = '1';
  });
});
function wireDrawer(btnId, boxEl, otherBtnId, otherBoxEl) {
  document.getElementById(btnId).addEventListener('click', (e) => {
    const open = !boxEl.classList.contains('open');
    boxEl.classList.toggle('open', open);
    e.currentTarget.classList.toggle('active', open);
    if (open) {
      otherBoxEl.classList.remove('open');
      document.getElementById(otherBtnId).classList.remove('active');
    }
  });
}
const storyBoxEl = document.getElementById('story-box');
wireDrawer('home-lore-btn', howToPlayBoxEl, 'home-story-btn', storyBoxEl);
wireDrawer('home-story-btn', storyBoxEl, 'home-lore-btn', howToPlayBoxEl);
const supportToggleEl = document.getElementById('support-toggle');
const supportPopEl = document.getElementById('support-pop');
supportToggleEl.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = !supportPopEl.classList.contains('open');
  supportPopEl.classList.toggle('open', open);
  supportToggleEl.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', (e) => {
  if (!supportPopEl.contains(e.target)) {
    supportPopEl.classList.remove('open');
    supportToggleEl.setAttribute('aria-expanded', 'false');
  }
});
const copyUpiBtn = document.getElementById('copy-upi-btn');
const upiBtnText = document.getElementById('upi-btn-text');
copyUpiBtn.addEventListener('click', async () => {
  const upiId = copyUpiBtn.getAttribute('data-upi');
  try {
    await navigator.clipboard.writeText(upiId);
    upiBtnText.textContent = `Copied: ${upiId}`;
  } catch {
    upiBtnText.textContent = `UPI: ${upiId}`;
  }
  setTimeout(() => { upiBtnText.textContent = 'Copy UPI ID'; }, 2500);
});
function animate() {
  requestAnimationFrame(animate);
  const timeSpeed = keys['KeyT'] ? 0.0045 : 0.00012;
  timeOfDay = (timeOfDay + timeSpeed) % 1.0;
  const skyState = updateWorld(timeOfDay, sunLight, ambientLight);
  scene.background.copy(skyState.earthSkyColor);
  scene.fog.color.copy(skyState.earthSkyColor);
  if (!gameStarted) {
    const t = Date.now() * 0.00025;
    camera.position.set(
      68 + Math.cos(t) * 48,
      28 + Math.sin(t * 1.5) * 5,
      -45 + Math.sin(t) * 48
    );
    camera.lookAt(68, 4, -55);
    renderer.render(scene, camera);
    return;
  }
  timeDisplayEl.textContent = skyState.isNight ? '🌙 Starry Night (Chandra)' : '☀️ Golden Day (Surya)';
  const haloScale = 1 + Math.sin(Date.now() * 0.008) * 0.06;
  vimanaHalo.scale.set(haloScale, haloScale, 1);
  const activeEntity = hero.getActiveEntity();
  const isFiring = Boolean(keys['KeyF'] || isMouseDown);
  if (worldMap.isOpen || isCodexOpen) {
    if (worldMap.isOpen) worldMap.render(activeEntity, isSpaceMode);
    renderer.render(scene, camera);
    return;
  }
  if (hero.mode === 'IN_VIMANA') {
    const boost = keys['ShiftLeft'] || keys['ShiftRight'] ? 2.2 : 1.0;
    if (keys['KeyW'] || keys['ArrowUp']) speed += 0.036 * boost;
    if (keys['KeyS'] || keys['ArrowDown']) speed -= 0.022;
    speed = Math.max(-0.55, Math.min(1.35 * boost, speed));
    speed *= 0.95;
    const turnInput = (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0) - (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0);
    if (turnInput !== 0) {
      const dir = speed < -0.01 ? -1 : 1;
      vehicle.rotation.y += 0.045 * turnInput * dir;
      cameraYaw += 0.045 * turnInput * dir;
    }
    if (isFiring && vehicle.position.y > 5) {
      vehicle.rotation.y = cameraYaw;
    }
    vehicle.position.x -= Math.sin(vehicle.rotation.y) * speed;
    vehicle.position.z -= Math.cos(vehicle.rotation.y) * speed;
    const groundY = Math.max(-0.35, getTerrainHeight(vehicle.position.x, vehicle.position.z));
    if (keys['Space']) {
      verticalVel += 0.035;
    } else if (keys['KeyC']) {
      verticalVel -= 0.035;
    } else if (vehicle.position.y > groundY + 0.5) {
      verticalVel *= 0.88;
    }
    verticalVel = Math.max(-0.65, Math.min(0.65, verticalVel));
    vehicle.position.y += verticalVel;
    if (vehicle.position.y <= groundY) {
      vehicle.position.y = THREE.MathUtils.lerp(vehicle.position.y, groundY, 0.25);
      verticalVel = 0;
    }
    const spaceAltitude = 62;
    if (vehicle.position.y > spaceAltitude + 18) {
      vehicle.position.y = spaceAltitude + 18;
    }
    const spaceBlend = THREE.MathUtils.clamp((vehicle.position.y - 28) / (spaceAltitude - 28), 0, 1);
    scene.background.lerpColors(skyState.earthSkyColor, spaceSkyColor, spaceBlend);
    scene.fog.color.copy(scene.background);
    isSpaceMode = spaceBlend > 0.65;
  } else {
    isSpaceMode = false;
    scene.background.copy(skyState.earthSkyColor);
    scene.fog.color.copy(skyState.earthSkyColor);
    if (hero.isNearVehicle()) {
      promptEl.innerHTML = vimanaUnlocked
        ? 'Press <kbd>E</kbd> to Board Garuda Vimana'
        : '🔒 Defeat the Shrine Guards first to unlock Vimana!';
      promptEl.style.display = 'block';
    } else if (
      promptEl.textContent.includes('Board') ||
      promptEl.textContent.includes('Shrine Guards')
    ) {
      promptEl.style.display = 'none';
    }
  }
  const aimPitch = (0.35 - cameraPitch) * 0.65;
  hero.update(keys, templeGuards, cameraYaw, aimPitch, isFiring);
  if (hero.mode === 'ON_FOOT') {
    modeBadgeEl.textContent = hero.isSwimming ? 'SWIMMING' : 'ON FOOT';
  }
  templeGuards.update(hero, spaceArena);
  if (!isSpaceMode && hero.mode === 'IN_VIMANA' && isFiring && vehicle.position.y > 4) {
    skyPatrol.fireSkyAstra(vehicle, skillLevel, spaceArena.selectedAstra);
  }
  skyPatrol.update(vehicle, isSpaceMode, spaceArena);
  const greeting = townsfolk.update(hero, isSpaceMode);
  if (greeting && hero.mode === 'ON_FOOT' && !hero.isNearVehicle()) {
    promptEl.textContent = greeting.text;
    promptEl.style.display = 'block';
    if (greeting.isSage) {
      spaceArena.rechargeShield(greeting.honored ? 0.65 : 0.15);
    }
  } else if (
    hero.mode === 'ON_FOOT' &&
    !hero.isNearVehicle() &&
    (promptEl.textContent.startsWith('🙏') ||
      promptEl.textContent.startsWith('🪔') ||
      promptEl.textContent.startsWith('🌾') ||
      promptEl.textContent.startsWith('🏺') ||
      promptEl.textContent.startsWith('🐚'))
  ) {
    promptEl.style.display = 'none';
  }
  spaceArena.setActive(isSpaceMode, vehicle.position, skillLevel);
  if (isSpaceMode && hero.mode === 'IN_VIMANA' && isFiring) {
    spaceArena.fireAstra(vehicle, skillLevel);
  }
  const status = spaceArena.update(vehicle, isSpaceMode);
  scoreEl.textContent = `${status.defeated} Defeated`;
  updateShieldHUD(status.shield);
  if (status.boss) {
    bossHudEl.style.display = 'block';
    const bossPct = Math.max(0, (status.boss.hp / status.boss.maxHp) * 100);
    bossBarEl.style.width = `${bossPct}%`;
    bossHpTextEl.textContent = `${status.boss.hp} / ${status.boss.maxHp}`;
  } else {
    bossHudEl.style.display = 'none';
  }
  if (status.defeated > lastSavedDefeated) {
    lastSavedDefeated = status.defeated;
    saveProgress(skillLevel, temples, status.defeated, vimanaUnlocked);
  }
  if (status.destroyed) {
    alertBannerEl.style.display = 'block';
    const spawnY = Math.max(0.2, getTerrainHeight(startX, startZ));
    if (hero.mode === 'ON_FOOT') {
      hero.mesh.position.set(startX, spawnY, startZ);
    }
    vehicle.position.set(vStartX, spawnY, vStartZ);
    verticalVel = 0;
    speed = 0;
    spaceArena.resetArena(vehicle.position);
    setTimeout(() => {
      alertBannerEl.style.display = 'none';
    }, 2400);
  }
  const camDist = hero.mode === 'ON_FOOT' ? 9.5 : isSpaceMode ? 24 : 19;
  const horizontalDist = camDist * Math.cos(cameraPitch);
  const verticalOffset = camDist * Math.sin(cameraPitch) + (hero.mode === 'ON_FOOT' ? 1.8 : 2.5);
  const shoulderOffset = hero.mode === 'ON_FOOT' ? 0.9 : 0;
  const rightX = Math.cos(cameraYaw) * shoulderOffset;
  const rightZ = -Math.sin(cameraYaw) * shoulderOffset;
  const targetCamPos = new THREE.Vector3(
    activeEntity.position.x + Math.sin(cameraYaw) * horizontalDist + rightX,
    activeEntity.position.y + verticalOffset,
    activeEntity.position.z + Math.cos(cameraYaw) * horizontalDist + rightZ
  );
  camera.position.lerp(targetCamPos, 0.16);
  const lookTarget = new THREE.Vector3(
    activeEntity.position.x - Math.sin(cameraYaw) * 6 + rightX,
    activeEntity.position.y + (hero.mode === 'ON_FOOT' ? 1.4 : 1.0),
    activeEntity.position.z - Math.cos(cameraYaw) * 6 + rightZ
  );
  camera.lookAt(lookTarget);
  if (isSpaceMode) {
    locationEl.textContent = 'Antariksha (Orbit)';
    radarLabelEl.textContent = 'ANTARIKSHA RADAR';
  } else {
    radarLabelEl.textContent = 'RADAR';
    let currentZone = vimanaUnlocked
      ? 'Suryapuri Plains'
      : 'Walk North (VMN on Radar) to Awaken Garuda Vimana!';
    for (const t of temples) {
      const guarded = templeGuards.hasActiveGuards(t);
      if (!guarded && !t.guardsCleared) {
        t.guardsCleared = true;
        t.onGuardsDefeated();
        sfx.playTempleChime();
        showTransientNotice(`🚩 ${t.name} Guards Defeated! Saffron Flag Hoisted!`);
      }
      const dist = Math.hypot(activeEntity.position.x - t.pos.x, activeEntity.position.z - t.pos.z);
      if (dist < 5.5 && activeEntity.position.y < t.pos.y + 5) {
        if (guarded) {
          currentZone = `${t.name} (Defeat the Chhaya-Sena with your Bow!)`;
        } else {
          currentZone = `${t.name} ✨`;
          spaceArena.rechargeShield(0.4);
          if (!t.visited) {
            t.visited = true;
            t.ringMat.color.set('#38bdf8');
            sfx.playTempleChime();
            if (t.type === 'VIMANA') {
              vimanaUnlocked = true;
              hero.vimanaUnlocked = true;
              showTransientNotice('🚀 Garuda Vimana Unlocked! Press E near it to board!');
            } else {
              skillLevel++;
              if (skillLevel <= 3) {
                spaceArena.selectAstra(skillLevel, skillLevel);
              }
              showTransientNotice(`✨ ${t.name} Liberated! ${t.rewardText}`);
            }
            refreshSkillHUD();
            saveProgress(skillLevel, temples, status.defeated, vimanaUnlocked);
          }
        }
      }
    }
    locationEl.textContent = currentZone;
  }
  drawMinimap(activeEntity);
  renderer.render(scene, camera);
}
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
animate();
