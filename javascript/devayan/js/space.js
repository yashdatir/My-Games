import * as THREE from 'three';
export const ASTRA_ARSENAL = {
  1: { name: 'Agneyastra (Fire)', minLevel: 1, color: '#fb923c', cooldown: 220, damage: 1, spreads: [-0.05, 0.05], size: 0.32, speed: 1.45 },
  2: { name: 'Varunastra (Wave)', minLevel: 2, color: '#38bdf8', cooldown: 280, damage: 1, spreads: [-0.22, -0.11, 0, 0.11, 0.22], size: 0.3, speed: 1.35 },
  3: { name: 'Pashupatastra (Supreme)', minLevel: 3, color: '#e879f9', cooldown: 340, damage: 2, spreads: [-0.12, 0, 0.12], size: 0.48, speed: 1.6 }
};
export class SpaceArena {
  constructor(scene, sfx) {
    this.scene = scene;
    this.sfx = sfx;
    this.spaceGroup = new THREE.Group();
    this.spaceGroup.visible = false;
    this.scene.add(this.spaceGroup);
    this.astras = [];
    this.enemyBolts = [];
    this.particles = [];
    this.rakshasas = [];
    this.boss = null;
    this.bossDefeatedCount = 0;
    this.selectedAstra = 1;
    this.lastShotTime = 0;
    this.defeatedCount = 0;
    this.maxShield = 100;
    this.shield = 100;
    this._buildStarfield();
  }
  _buildStarfield() {
    const starCount = 900;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 320;
      positions[i * 3 + 1] = 35 + Math.random() * 140;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 320;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 0.65,
      transparent: true,
      opacity: 0.9
    });
    this.stars = new THREE.Points(starGeo, starMat);
    this.spaceGroup.add(this.stars);
  }
  selectAstra(slot, skillLevel) {
    const spec = ASTRA_ARSENAL[slot];
    if (!spec) return { ok: false };
    if (skillLevel < spec.minLevel) {
      return {
        ok: false,
        reason: `🔒 ${spec.name} requires Tapasya Lvl ${spec.minLevel}! Liberate more sanctums.`
      };
    }
    this.selectedAstra = slot;
    return { ok: true, spec };
  }
  setActive(active, playerPos, skillLevel = 1) {
    this.spaceGroup.visible = active;
    if (!active) return;
    if (this.rakshasas.length === 0) {
      this.spawnWave(playerPos, 4);
    }
    if (skillLevel >= 3 && !this.boss) {
      this.spawnBoss(playerPos);
    }
  }
  spawnBoss(playerPos) {
    const bossGroup = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 4.8, 3.6, 8),
      new THREE.MeshStandardMaterial({
        color: '#450a0a',
        emissive: '#7f1d1d',
        emissiveIntensity: 0.5,
        flatShading: true
      })
    );
    bossGroup.add(core);
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(2.2, 4.5, 8),
      new THREE.MeshStandardMaterial({
        color: '#fbbf24',
        emissive: '#d97706',
        emissiveIntensity: 0.4,
        flatShading: true
      })
    );
    spire.position.y = 3.8;
    bossGroup.add(spire);
    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(6.8, 0.35, 8, 24),
      new THREE.MeshBasicMaterial({ color: '#ff3b00' })
    );
    outerRing.rotation.x = Math.PI / 2;
    bossGroup.add(outerRing);
    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(5.2, 0.22, 6, 18),
      new THREE.MeshBasicMaterial({ color: '#ffd700' })
    );
    innerRing.rotation.x = Math.PI / 2;
    bossGroup.add(innerRing);
    bossGroup.position.set(playerPos.x, playerPos.y + 2, playerPos.z - 42);
    this.spaceGroup.add(bossGroup);
    const maxHp = 45 + this.bossDefeatedCount * 20;
    this.boss = {
      mesh: bossGroup,
      outerRing,
      innerRing,
      hp: maxHp,
      maxHp,
      orbitAngle: 0,
      barrageCooldown: 140
    };
  }
  rechargeShield(amount) {
    this.shield = Math.min(this.maxShield, this.shield + amount);
  }
  resetArena(playerPos) {
    this.shield = this.maxShield;
    for (const b of this.enemyBolts) this.spaceGroup.remove(b.mesh);
    for (const a of this.astras) this.spaceGroup.remove(a.mesh);
    this.enemyBolts = [];
    this.astras = [];
    if (this.boss) {
      this.spaceGroup.remove(this.boss.mesh);
      this.boss = null;
    }
    if (this.rakshasas.length === 0) {
      this.spawnWave(playerPos, 4);
    }
  }
  spawnExplosion(position, colorHex = '#ff9e00', count = 16) {
    const geo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < count; i++) {
      const spark = new THREE.Mesh(geo, mat);
      spark.position.copy(position);
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 1.05,
        (Math.random() - 0.5) * 1.05,
        (Math.random() - 0.5) * 1.05
      );
      this.spaceGroup.add(spark);
      this.particles.push({
        mesh: spark,
        velocity,
        life: 35 + Math.floor(Math.random() * 18)
      });
    }
  }
  spawnWave(centerPos, count) {
    for (let i = 0; i < count; i++) {
      const enemy = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.6, 0),
        new THREE.MeshStandardMaterial({
          color: '#7f1d1d',
          emissive: '#991b1b',
          emissiveIntensity: 0.45,
          flatShading: true
        })
      );
      enemy.add(body);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.1, 0.15, 6, 16),
        new THREE.MeshBasicMaterial({ color: '#ff4d00' })
      );
      ring.rotation.x = Math.PI / 2;
      enemy.add(ring);
      const angle = (i / count) * Math.PI * 2;
      const radius = 26 + Math.random() * 14;
      enemy.position.set(
        centerPos.x + Math.cos(angle) * radius,
        centerPos.y + (Math.random() - 0.5) * 6,
        centerPos.z + Math.sin(angle) * radius
      );
      this.spaceGroup.add(enemy);
      this.rakshasas.push({
        mesh: enemy,
        ring,
        hp: 3,
        speed: 0.08 + Math.random() * 0.04,
        fireCooldown: 90 + Math.floor(Math.random() * 120)
      });
    }
  }
  fireAstra(vehicle, skillLevel) {
    const slot = ASTRA_ARSENAL[this.selectedAstra].minLevel <= skillLevel ? this.selectedAstra : 1;
    const spec = ASTRA_ARSENAL[slot];
    const now = performance.now();
    if (now - this.lastShotTime < spec.cooldown) return;
    this.lastShotTime = now;
    if (this.sfx) this.sfx.playAstra(slot);
    for (const offsetAngle of spec.spreads) {
      const bolt = new THREE.Mesh(
        new THREE.SphereGeometry(spec.size, 8, 8),
        new THREE.MeshBasicMaterial({ color: spec.color })
      );
      bolt.position.copy(vehicle.position);
      bolt.position.y += 0.6;
      const angle = vehicle.rotation.y + offsetAngle;
      const dir = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle)).normalize();
      this.spaceGroup.add(bolt);
      this.astras.push({
        mesh: bolt,
        velocity: dir.multiplyScalar(spec.speed),
        damage: spec.damage,
        color: spec.color,
        life: 95
      });
    }
  }
  _fireEnemyBolt(originPos, targetPos, spreadAngle = 0, speed = 0.55) {
    const bolt = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#ef4444' })
    );
    bolt.position.copy(originPos);
    const dir = new THREE.Vector3().subVectors(targetPos, originPos).normalize();
    if (spreadAngle !== 0) {
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);
    }
    this.spaceGroup.add(bolt);
    this.enemyBolts.push({
      mesh: bolt,
      velocity: dir.multiplyScalar(speed),
      life: 150
    });
  }
  update(vehicle, isSpaceMode) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.add(p.velocity);
      p.mesh.rotation.x += 0.12;
      p.mesh.rotation.y += 0.12;
      p.life--;
      p.mesh.scale.setScalar(Math.max(0.01, p.life / 40));
      if (p.life <= 0) {
        this.spaceGroup.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
    if (!isSpaceMode) {
      return {
        defeated: this.defeatedCount,
        shield: this.shield,
        destroyed: false,
        boss: null
      };
    }
    for (let i = this.astras.length - 1; i >= 0; i--) {
      const a = this.astras[i];
      a.mesh.position.add(a.velocity);
      a.life--;
      if (a.life <= 0) {
        this.spaceGroup.remove(a.mesh);
        this.astras.splice(i, 1);
      }
    }
    for (let i = this.enemyBolts.length - 1; i >= 0; i--) {
      const b = this.enemyBolts[i];
      b.mesh.position.add(b.velocity);
      b.life--;
      if (b.mesh.position.distanceTo(vehicle.position) < 1.8) {
        this.shield = Math.max(0, this.shield - 12);
        this.spawnExplosion(b.mesh.position, '#ef4444', 8);
        this.spaceGroup.remove(b.mesh);
        this.enemyBolts.splice(i, 1);
        continue;
      }
      if (b.life <= 0) {
        this.spaceGroup.remove(b.mesh);
        this.enemyBolts.splice(i, 1);
      }
    }
    if (this.boss) {
      const b = this.boss;
      b.outerRing.rotation.z += 0.03;
      b.innerRing.rotation.z -= 0.05;
      b.orbitAngle += 0.008;
      const targetX = Math.cos(b.orbitAngle) * 32;
      const targetZ = Math.sin(b.orbitAngle) * 32;
      b.mesh.position.x = THREE.MathUtils.lerp(b.mesh.position.x, targetX, 0.02);
      b.mesh.position.z = THREE.MathUtils.lerp(b.mesh.position.z, targetZ, 0.02);
      b.mesh.position.y = THREE.MathUtils.lerp(b.mesh.position.y, vehicle.position.y, 0.03);
      b.barrageCooldown--;
      if (b.barrageCooldown <= 0) {
        [-0.32, -0.16, 0, 0.16, 0.32].forEach((spread) => {
          this._fireEnemyBolt(b.mesh.position, vehicle.position, spread, 0.62);
        });
        b.barrageCooldown = 135;
      }
      for (let j = this.astras.length - 1; j >= 0; j--) {
        const a = this.astras[j];
        if (a.mesh.position.distanceTo(b.mesh.position) < 6.5) {
          b.hp -= a.damage;
          this.spawnExplosion(a.mesh.position, a.color, 7);
          this.spaceGroup.remove(a.mesh);
          this.astras.splice(j, 1);
          b.mesh.scale.setScalar(1.06);
          setTimeout(() => {
            if (this.boss) this.boss.mesh.scale.setScalar(1.0);
          }, 70);
          if (b.hp <= 0) {
            for (let k = 0; k < 4; k++) {
              const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 8
              );
              this.spawnExplosion(b.mesh.position.clone().add(offset), '#ffd700', 24);
            }
            if (this.sfx) this.sfx.playExplosion();
            this.spaceGroup.remove(b.mesh);
            this.boss = null;
            this.bossDefeatedCount++;
            this.defeatedCount += 5;
            break;
          }
        }
      }
    }
    for (let i = this.rakshasas.length - 1; i >= 0; i--) {
      const r = this.rakshasas[i];
      r.ring.rotation.z += 0.04;
      const toPlayer = new THREE.Vector3().subVectors(vehicle.position, r.mesh.position);
      const dist = toPlayer.length();
      if (dist > 10) {
        toPlayer.normalize();
        r.mesh.position.addScaledVector(toPlayer, r.speed);
      }
      r.mesh.lookAt(vehicle.position);
      r.fireCooldown--;
      if (r.fireCooldown <= 0 && dist < 48) {
        this._fireEnemyBolt(r.mesh.position, vehicle.position);
        r.fireCooldown = 120 + Math.floor(Math.random() * 90);
      }
      for (let j = this.astras.length - 1; j >= 0; j--) {
        const a = this.astras[j];
        if (a.mesh.position.distanceTo(r.mesh.position) < 2.4) {
          r.hp -= a.damage;
          this.spawnExplosion(a.mesh.position, a.color, 6);
          this.spaceGroup.remove(a.mesh);
          this.astras.splice(j, 1);
          r.mesh.scale.setScalar(1.25);
          setTimeout(() => {
            if (r.mesh) r.mesh.scale.setScalar(1.0);
          }, 80);
          if (r.hp <= 0) {
            if (this.sfx) this.sfx.playExplosion();
            this.spawnExplosion(r.mesh.position, '#ff5400', 22);
            this.spaceGroup.remove(r.mesh);
            this.rakshasas.splice(i, 1);
            this.defeatedCount++;
            break;
          }
        }
      }
    }
    if (this.rakshasas.length === 0) {
      this.spawnWave(vehicle.position, 4);
    }
    return {
      defeated: this.defeatedCount,
      shield: this.shield,
      destroyed: this.shield <= 0,
      boss: this.boss ? { hp: this.boss.hp, maxHp: this.boss.maxHp } : null
    };
  }
}
