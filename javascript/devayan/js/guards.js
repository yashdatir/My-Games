import * as THREE from 'three';
export class TempleGuards {
  constructor(scene, getTerrainHeight, sfx) {
    this.scene = scene;
    this.getTerrainHeight = getTerrainHeight;
    this.sfx = sfx;
    this.guards = [];
  }
  spawnForTemples(temples) {
    for (const temple of temples) {
      if (temple.visited) continue;
      for (let i = 0; i < 2; i++) {
        const guard = this._buildAsuraMesh();
        const angle = i * Math.PI;
        const gx = temple.pos.x + Math.cos(angle) * 5.5;
        const gz = temple.pos.z + Math.sin(angle) * 5.5;
        const gy = Math.max(-0.3, this.getTerrainHeight(gx, gz));
        guard.position.set(gx, gy, gz);
        this.scene.add(guard);
        this.guards.push({
          mesh: guard,
          temple,
          homePos: temple.pos.clone(),
          patrolAngle: angle,
          hp: 2,
          attackCooldown: 0
        });
      }
    }
  }
  _buildAsuraMesh() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.38, 1.1, 6),
      new THREE.MeshStandardMaterial({ color: '#7f1d1d', flatShading: true })
    );
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.42, 0.42),
      new THREE.MeshStandardMaterial({ color: '#991b1b', flatShading: true })
    );
    head.position.y = 1.3;
    head.castShadow = true;
    group.add(head);
    const hornMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', flatShading: true });
    const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 5), hornMat);
    leftHorn.position.set(-0.22, 1.55, 0);
    leftHorn.rotation.z = 0.35;
    group.add(leftHorn);
    const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 5), hornMat);
    rightHorn.position.set(0.22, 1.55, 0);
    rightHorn.rotation.z = -0.35;
    group.add(rightHorn);
    return group;
  }
  hasActiveGuards(temple) {
    return this.guards.some((g) => g.temple === temple);
  }
  update(hero, spaceArena) {
    for (let i = this.guards.length - 1; i >= 0; i--) {
      const g = this.guards[i];
      if (g.attackCooldown > 0) g.attackCooldown--;
      const distToHero =
        hero.mode === 'ON_FOOT' ? g.mesh.position.distanceTo(hero.mesh.position) : Infinity;
      if (distToHero < 14) {
        const dir = new THREE.Vector3().subVectors(hero.mesh.position, g.mesh.position);
        dir.y = 0;
        if (dir.length() > 1.4) {
          dir.normalize();
          g.mesh.position.addScaledVector(dir, 0.065);
          g.mesh.rotation.y = Math.atan2(-dir.x, -dir.z);
        } else if (g.attackCooldown <= 0) {
          spaceArena.shield = Math.max(0, spaceArena.shield - 10);
          g.attackCooldown = 75;
          if (this.sfx) this.sfx.playExplosion();
        }
      } else {
        g.patrolAngle += 0.015;
        const px = g.homePos.x + Math.cos(g.patrolAngle) * 5.8;
        const pz = g.homePos.z + Math.sin(g.patrolAngle) * 5.8;
        g.mesh.position.x = px;
        g.mesh.position.z = pz;
        g.mesh.rotation.y = -g.patrolAngle;
      }
      const gy = Math.max(-0.3, this.getTerrainHeight(g.mesh.position.x, g.mesh.position.z));
      g.mesh.position.y = gy;
    }
  }
  checkArrowHit(arrowPos) {
    for (let i = this.guards.length - 1; i >= 0; i--) {
      const g = this.guards[i];
      if (arrowPos.distanceTo(g.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0))) < 1.2) {
        g.hp--;
        g.mesh.scale.setScalar(1.25);
        setTimeout(() => {
          if (g.mesh) g.mesh.scale.setScalar(1.0);
        }, 80);
        if (g.hp <= 0) {
          this.scene.remove(g.mesh);
          this.guards.splice(i, 1);
          if (this.sfx) this.sfx.playExplosion();
          return true;
        }
        return true;
      }
    }
    return false;
  }
}
