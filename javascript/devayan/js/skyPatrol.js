import * as THREE from 'three';
import { ASTRA_ARSENAL } from './space.js';
export class SkyPatrolManager {
  constructor(scene, sfx) {
    this.scene = scene;
    this.sfx = sfx;
    this.scouts = [];
    this.skyBolts = [];
    this.lastShotTime = 0;
    this._spawnInitialPatrols();
  }
  _buildSkyScoutMesh() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: '#450a0a',
      emissive: '#991b1b',
      emissiveIntensity: 0.4,
      flatShading: true
    });
    const wingMat = new THREE.MeshStandardMaterial({
      color: '#b91c1c',
      side: THREE.DoubleSide,
      flatShading: true
    });
    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.6, 5), bodyMat);
    hull.rotation.x = -Math.PI / 2;
    hull.castShadow = true;
    group.add(hull);
    const wingGeo = new THREE.BoxGeometry(3.4, 0.1, 0.9);
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.z = 0.2;
    group.add(wings);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 6, 6),
      new THREE.MeshBasicMaterial({ color: '#ff4d00' })
    );
    core.position.z = -0.9;
    group.add(core);
    return { group, wings };
  }
  _spawnInitialPatrols() {
    const patrolCenters = [
      { x: 95, z: -40, alt: 16 },
      { x: -35, z: -55, alt: 18 },
      { x: -120, z: -30, alt: 17 },
      { x: -240, z: 40, alt: 19 },
      { x: -65, z: 55, alt: 16 },
      { x: 25, z: 220, alt: 20 },
      { x: 240, z: -80, alt: 18 },
      { x: 0, z: -175, alt: 24 }
    ];
    patrolCenters.forEach((p, idx) => {
      const { group, wings } = this._buildSkyScoutMesh();
      group.position.set(p.x, p.alt, p.z);
      this.scene.add(group);
      this.scouts.push({
        mesh: group,
        wings,
        centerX: p.x,
        centerZ: p.z,
        altitude: p.alt,
        angle: idx * 0.9,
        orbitRadius: 24 + (idx % 3) * 8,
        hp: 2,
        flapPhase: idx
      });
    });
  }
  fireSkyAstra(vehicle, skillLevel, selectedSlot) {
    const slot = ASTRA_ARSENAL[selectedSlot].minLevel <= skillLevel ? selectedSlot : 1;
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
      this.scene.add(bolt);
      this.skyBolts.push({
        mesh: bolt,
        velocity: dir.multiplyScalar(spec.speed),
        damage: spec.damage,
        life: 85
      });
    }
  }
  update(vehicle, isSpaceMode, spaceArena) {
    for (let i = this.skyBolts.length - 1; i >= 0; i--) {
      const b = this.skyBolts[i];
      b.mesh.position.add(b.velocity);
      b.life--;
      if (b.life <= 0) {
        this.scene.remove(b.mesh);
        this.skyBolts.splice(i, 1);
      }
    }
    const visibleInSky = !isSpaceMode;
    for (let i = this.scouts.length - 1; i >= 0; i--) {
      const s = this.scouts[i];
      s.mesh.visible = visibleInSky;
      if (!visibleInSky) continue;
      s.angle += 0.012;
      s.flapPhase += 0.14;
      s.wings.rotation.z = Math.sin(s.flapPhase) * 0.22;
      const nextX = s.centerX + Math.cos(s.angle) * s.orbitRadius;
      const nextZ = s.centerZ + Math.sin(s.angle) * s.orbitRadius;
      const dx = nextX - s.mesh.position.x;
      const dz = nextZ - s.mesh.position.z;
      s.mesh.position.set(nextX, s.altitude + Math.sin(s.flapPhase * 0.5) * 0.8, nextZ);
      s.mesh.rotation.y = Math.atan2(-dx, -dz);
      for (let j = this.skyBolts.length - 1; j >= 0; j--) {
        const b = this.skyBolts[j];
        if (b.mesh.position.distanceTo(s.mesh.position) < 2.6) {
          s.hp -= b.damage;
          this.scene.remove(b.mesh);
          this.skyBolts.splice(j, 1);
          if (s.hp <= 0) {
            if (this.sfx) this.sfx.playExplosion();
            spaceArena.defeatedCount++;
            s.hp = 2;
            s.angle += Math.PI;
            s.mesh.position.set(
              s.centerX + Math.cos(s.angle) * s.orbitRadius,
              s.altitude + 2,
              s.centerZ + Math.sin(s.angle) * s.orbitRadius
            );
            break;
          }
        }
      }
    }
  }
}
