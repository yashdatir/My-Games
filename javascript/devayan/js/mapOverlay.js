export class WorldMapOverlay {
  constructor(temples, getTerrainHeight, onTeleport) {
    this.temples = temples;
    this.getTerrainHeight = getTerrainHeight;
    this.onTeleport = onTeleport;
    this.isOpen = false;
    this.modalEl = document.getElementById('world-map-modal');
    this.canvas = document.getElementById('world-map-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.statusEl = document.getElementById('map-status-text');
    this.templeHitboxes = [];
    this._bindEvents();
  }
  _bindEvents() {
    document.getElementById('close-map-btn').addEventListener('click', () => {
      this.toggle(false);
    });
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;
      for (const box of this.templeHitboxes) {
        const dist = Math.hypot(clickX - box.sx, clickY - box.sy);
        if (dist <= 20) {
          if (box.temple.visited) {
            this.toggle(false);
            this.onTeleport(box.temple);
          } else {
            this.statusEl.textContent = `🔒 ${box.temple.name} is still held by the Chhaya-Sena! Liberate it first.`;
            this.statusEl.style.color = '#f87171';
          }
          return;
        }
      }
    });
  }
  toggle(forceState) {
    this.isOpen = typeof forceState === 'boolean' ? forceState : !this.isOpen;
    this.modalEl.style.display = this.isOpen ? 'flex' : 'none';
    if (this.isOpen) {
      this.statusEl.textContent = 'Click any liberated (Cyan) sanctum to Astral Fast-Travel.';
      this.statusEl.style.color = '#cbd5e1';
    }
    return this.isOpen;
  }
  render(activeEntity, isSpaceMode) {
    if (!this.isOpen) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const worldSpan = 940;
    const scale = w / worldSpan;
    this.ctx.fillStyle = '#082f49';
    this.ctx.fillRect(0, 0, w, h);
    const step = 12;
    for (let gx = -465; gx <= 465; gx += step) {
      for (let gz = -465; gz <= 465; gz += step) {
        const elev = this.getTerrainHeight(gx, gz);
        if (elev <= -0.35) {
          if (Math.hypot(gx, gz) < 375) {
            this.ctx.fillStyle = '#0284c7';
            const sx = cx + gx * scale;
            const sy = cy + gz * scale;
            this.ctx.fillRect(sx - 2.5, sy - 2.5, 5, 5);
          }
          continue;
        }
        const distMeru = Math.hypot(gx, gz + 265);
        if (distMeru < 40 && elev > 26) this.ctx.fillStyle = '#fbbf24';
        else if (elev < 0.0) this.ctx.fillStyle = '#e9c46a';
        else if (elev < 5.5) this.ctx.fillStyle = '#588157';
        else if (elev < 18.0) this.ctx.fillStyle = '#3a5a40';
        else this.ctx.fillStyle = '#f8fafc';
        const sx = cx + gx * scale;
        const sy = cy + gz * scale;
        const cellSize = step * scale + 0.9;
        this.ctx.fillRect(sx - cellSize / 2, sy - cellSize / 2, cellSize, cellSize);
      }
    }
    this.templeHitboxes = [];
    for (const t of this.temples) {
      const sx = cx + t.pos.x * scale;
      const sy = cy + t.pos.z * scale;
      this.templeHitboxes.push({ temple: t, sx, sy });
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, 11, 0, Math.PI * 2);
      this.ctx.fillStyle = t.visited ? 'rgba(56, 189, 248, 0.25)' : 'rgba(239, 68, 68, 0.25)';
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
      this.ctx.fillStyle = t.visited ? '#38bdf8' : '#ef4444';
      this.ctx.fill();
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.stroke();
      this.ctx.font = 'bold 10px system-ui, sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(t.shortName, sx, sy - 11);
    }
    const px = cx + activeEntity.position.x * scale;
    const pz = cy + activeEntity.position.z * scale;
    this.ctx.save();
    this.ctx.translate(px, pz);
    this.ctx.rotate(-activeEntity.rotation.y);
    this.ctx.fillStyle = '#ffd700';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -8);
    this.ctx.lineTo(-5, 6);
    this.ctx.lineTo(0, 3);
    this.ctx.lineTo(5, 6);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();
    if (isSpaceMode) {
      this.ctx.fillStyle = 'rgba(5, 8, 22, 0.6)';
      this.ctx.fillRect(0, 0, w, 32);
      this.ctx.fillStyle = '#fde047';
      this.ctx.font = 'bold 11px system-ui, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('🌌 In Orbit — Click any liberated sanctum to descend immediately', cx, 20);
    }
  }
}
