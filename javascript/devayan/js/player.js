import * as THREE from 'three';
export class HeroController {
  constructor(scene, vehicle, getTerrainHeight, sfx, vimanaUnlocked = false) {
    this.scene = scene;
    this.vehicle = vehicle;
    this.getTerrainHeight = getTerrainHeight;
    this.sfx = sfx;
    this.vimanaUnlocked = vimanaUnlocked;
    this.mode = 'ON_FOOT';
    this.isSwimming = false;
    this.isGreeting = false;
    this.arrows = [];
    this.lastBowTime = 0;
    this.walkCycle = 0;
    this.parts = {};
    this.mesh = this._buildHeroMesh();
    this.mesh.visible = true;
    this.scene.add(this.mesh);
  }
  _buildHeroMesh() {
    const hero = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: '#e09f67', flatShading: true });
    const dhotiMat = new THREE.MeshStandardMaterial({ color: '#1d4ed8', flatShading: true });
    const armorMat = new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      metalness: 0.4,
      roughness: 0.3,
      flatShading: true
    });
    const capeMat = new THREE.MeshStandardMaterial({
      color: '#b91c1c',
      side: THREE.DoubleSide,
      flatShading: true
    });
    const rig = new THREE.Group();
    this.parts.rig = rig;
    hero.add(rig);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.34), armorMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    rig.add(torso);
    const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.38, 8), dhotiMat);
    waist.position.y = 0.62;
    waist.castShadow = true;
    rig.add(waist);
    const capeGeo = new THREE.PlaneGeometry(0.62, 1.05);
    capeGeo.translate(0, -0.52, 0);
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 1.38, 0.19);
    cape.rotation.x = 0.18;
    this.parts.cape = cape;
    rig.add(cape);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.4, 0.38), skinMat);
    head.position.y = 1.64;
    head.castShadow = true;
    rig.add(head);
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.42, 6),
      new THREE.MeshStandardMaterial({
        color: '#ffd700',
        emissive: '#f59e0b',
        emissiveIntensity: 0.45,
        flatShading: true
      })
    );
    crown.position.y = 2.02;
    rig.add(crown);
    const legGeo = new THREE.BoxGeometry(0.2, 0.58, 0.22);
    legGeo.translate(0, -0.29, 0);
    const leftLeg = new THREE.Mesh(legGeo, dhotiMat);
    leftLeg.position.set(-0.16, 0.58, 0);
    leftLeg.castShadow = true;
    this.parts.leftLeg = leftLeg;
    rig.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, dhotiMat);
    rightLeg.position.set(0.16, 0.58, 0);
    rightLeg.castShadow = true;
    this.parts.rightLeg = rightLeg;
    rig.add(rightLeg);
    const armGeo = new THREE.BoxGeometry(0.17, 0.56, 0.18);
    armGeo.translate(0, -0.25, 0);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.38, 1.35, 0);
    leftArm.castShadow = true;
    this.parts.leftArm = leftArm;
    rig.add(leftArm);
    const bow = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.045, 6, 14, Math.PI),
      new THREE.MeshStandardMaterial({
        color: '#ffd700',
        emissive: '#ffaa00',
        emissiveIntensity: 0.45
      })
    );
    bow.position.set(0, -0.45, -0.15);
    bow.rotation.y = Math.PI / 2;
    this.parts.bow = bow;
    leftArm.add(bow);
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.38, 1.35, 0);
    rightArm.castShadow = true;
    this.parts.rightArm = rightArm;
    rig.add(rightArm);
    const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.75, 6), armorMat);
    quiver.position.set(0.15, 1.15, 0.22);
    quiver.rotation.z = -0.35;
    rig.add(quiver);
    const ripple = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.85, 24),
      new THREE.MeshBasicMaterial({
        color: '#e0f2fe',
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide
      })
    );
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.y = 0.92;
    ripple.visible = false;
    this.parts.ripple = ripple;
    hero.add(ripple);
    return hero;
  }
  toggleMode(isSpaceMode) {
    if (this.mode === 'IN_VIMANA') {
      const groundY = this.getTerrainHeight(this.vehicle.position.x, this.vehicle.position.z);
      if (isSpaceMode || this.vehicle.position.y > Math.max(-0.35, groundY) + 1.4) {
        return { changed: false, reason: 'Land your Vimana before exiting!' };
      }
      const exitOffset = new THREE.Vector3(-2.4, 0, 0).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.vehicle.rotation.y
      );
      this.mesh.position.copy(this.vehicle.position).add(exitOffset);
      const exitGround = this.getTerrainHeight(this.mesh.position.x, this.mesh.position.z);
      this.mesh.position.y = exitGround < -0.65 ? -1.25 : exitGround;
      this.mesh.rotation.y = this.vehicle.rotation.y;
      this.mesh.visible = true;
      this.mode = 'ON_FOOT';
      return { changed: true, mode: this.mode };
    } else {
      if (!this.vimanaUnlocked) {
        return { changed: false, reason: '🔒 Liberate the Garuda Vimana Sanctum first to unlock flight!' };
      }
      const dist = this.mesh.position.distanceTo(this.vehicle.position);
      if (dist <= 5.5) {
        this.mesh.visible = false;
        this.isSwimming = false;
        this.isGreeting = false;
        this.mode = 'IN_VIMANA';
        return { changed: true, mode: this.mode };
      }
      return { changed: false, reason: 'Walk closer to your Vimana to board!' };
    }
  }
  shootArrow(aimYaw = null, aimPitch = 0) {
    if (this.mode !== 'ON_FOOT' || this.isSwimming || this.isGreeting) return;
    const now = performance.now();
    if (now - this.lastBowTime < 260) return;
    this.lastBowTime = now;
    if (this.sfx) this.sfx.playBowArrow();
    if (aimYaw !== null) {
      this.mesh.rotation.y = aimYaw;
    }
    this.parts.leftArm.rotation.x = Math.PI / 2.2;
    const arrow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.35, 6),
      new THREE.MeshBasicMaterial({ color: '#fde047' })
    );
    arrow.rotation.x = Math.PI / 2;
    arrow.position.copy(this.mesh.position);
    arrow.position.y += 1.15;
    arrow.rotation.y = this.mesh.rotation.y;
    const dir = new THREE.Vector3(
      -Math.sin(this.mesh.rotation.y),
      Math.max(-0.25, Math.min(0.35, aimPitch)),
      -Math.cos(this.mesh.rotation.y)
    ).normalize();
    this.scene.add(arrow);
    this.arrows.push({
      mesh: arrow,
      velocity: dir.multiplyScalar(1.05),
      life: 55
    });
  }
  update(keys, templeGuards, cameraYaw = 0, cameraPitch = 0, isFiring = false) {
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      a.mesh.position.add(a.velocity);
      a.life--;
      if (templeGuards && templeGuards.checkArrowHit(a.mesh.position)) {
        this.scene.remove(a.mesh);
        this.arrows.splice(i, 1);
        continue;
      }
      if (a.life <= 0) {
        this.scene.remove(a.mesh);
        this.arrows.splice(i, 1);
      }
    }
    if (this.mode !== 'ON_FOOT') return;
    const rawGroundY = this.getTerrainHeight(this.mesh.position.x, this.mesh.position.z);
    this.isSwimming = rawGroundY < -0.68;
    this.isGreeting = Boolean(keys['KeyG']) && !this.isSwimming;
    if (isFiring && !this.isSwimming && !this.isGreeting) {
      this.shootArrow(cameraYaw, cameraPitch);
    }
    const sprint = keys['ShiftLeft'] || keys['ShiftRight'] ? 1.75 : 1.0;
    const baseSpeed = this.isSwimming ? 0.12 : 0.2;
    const moveSpeed = this.isGreeting ? 0 : baseSpeed * sprint;
    let forwardInput = 0;
    let strafeInput = 0;
    if (keys['KeyW'] || keys['ArrowUp']) forwardInput += 1;
    if (keys['KeyS'] || keys['ArrowDown']) forwardInput -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) strafeInput += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) strafeInput -= 1;
    const isMoving = (forwardInput !== 0 || strafeInput !== 0) && !this.isGreeting;
    if (isMoving) {
      const forwardVec = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
      const rightVec = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
      const moveVec = new THREE.Vector3()
        .addScaledVector(forwardVec, forwardInput)
        .addScaledVector(rightVec, strafeInput)
        .normalize();
      this.mesh.position.addScaledVector(moveVec, moveSpeed);
      if (!isFiring) {
        this.mesh.rotation.y = Math.atan2(-moveVec.x, -moveVec.z);
      }
    }
    if (this.isSwimming) {
      const swimSurfaceY = -1.25 + Math.sin(Date.now() * 0.006) * 0.04;
      this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, swimSurfaceY, 0.2);
      this.parts.rig.rotation.x = THREE.MathUtils.lerp(this.parts.rig.rotation.x, -0.78, 0.15);
      this.parts.rig.position.y = 0.65;
      this.parts.bow.visible = false;
      this.parts.ripple.visible = true;
      const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.22;
      this.parts.ripple.scale.set(pulse, pulse, 1);
      this.walkCycle += isMoving ? 0.18 : 0.08;
      const stroke = Math.sin(this.walkCycle);
      this.parts.leftArm.rotation.x = 1.2;
      this.parts.rightArm.rotation.x = 1.2;
      this.parts.leftArm.rotation.z = -0.35 - stroke * 0.45;
      this.parts.rightArm.rotation.z = 0.35 + stroke * 0.45;
      this.parts.leftLeg.rotation.x = stroke * 0.45;
      this.parts.rightLeg.rotation.x = -stroke * 0.45;
      this.parts.cape.rotation.x = 0.85;
    } else if (this.isGreeting) {
      this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, rawGroundY, 0.35);
      this.parts.ripple.visible = false;
      this.parts.bow.visible = false;
      this.parts.rig.rotation.x = THREE.MathUtils.lerp(this.parts.rig.rotation.x, 0.18, 0.2);
      this.parts.rig.position.y = THREE.MathUtils.lerp(this.parts.rig.position.y, 0, 0.2);
      this.parts.leftArm.rotation.x = THREE.MathUtils.lerp(this.parts.leftArm.rotation.x, 1.05, 0.25);
      this.parts.rightArm.rotation.x = THREE.MathUtils.lerp(this.parts.rightArm.rotation.x, 1.05, 0.25);
      this.parts.leftArm.rotation.z = THREE.MathUtils.lerp(this.parts.leftArm.rotation.z, 0.56, 0.25);
      this.parts.rightArm.rotation.z = THREE.MathUtils.lerp(this.parts.rightArm.rotation.z, -0.56, 0.25);
      this.parts.leftLeg.rotation.x = THREE.MathUtils.lerp(this.parts.leftLeg.rotation.x, 0, 0.2);
      this.parts.rightLeg.rotation.x = THREE.MathUtils.lerp(this.parts.rightLeg.rotation.x, 0, 0.2);
      this.parts.cape.rotation.x = 0.12;
    } else {
      this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, rawGroundY, 0.35);
      this.parts.ripple.visible = false;
      this.parts.bow.visible = true;
      this.parts.rig.rotation.x = THREE.MathUtils.lerp(this.parts.rig.rotation.x, 0, 0.2);
      this.parts.leftArm.rotation.z = THREE.MathUtils.lerp(this.parts.leftArm.rotation.z, 0, 0.2);
      this.parts.rightArm.rotation.z = THREE.MathUtils.lerp(this.parts.rightArm.rotation.z, 0, 0.2);
      if (isMoving) {
        this.walkCycle += 0.22 * sprint;
        const swing = Math.sin(this.walkCycle) * 0.65;
        this.parts.leftLeg.rotation.x = swing;
        this.parts.rightLeg.rotation.x = -swing;
        if (!isFiring) {
          this.parts.leftArm.rotation.x = -swing * 0.7;
        }
        this.parts.rightArm.rotation.x = swing * 0.7;
        this.parts.rig.position.y = Math.abs(Math.cos(this.walkCycle)) * 0.08;
        this.parts.cape.rotation.x = 0.45 + Math.sin(this.walkCycle * 1.5) * 0.14;
      } else {
        this.parts.leftLeg.rotation.x = THREE.MathUtils.lerp(this.parts.leftLeg.rotation.x, 0, 0.2);
        this.parts.rightLeg.rotation.x = THREE.MathUtils.lerp(this.parts.rightLeg.rotation.x, 0, 0.2);
        if (!isFiring) {
          this.parts.leftArm.rotation.x = THREE.MathUtils.lerp(this.parts.leftArm.rotation.x, 0, 0.2);
        }
        this.parts.rightArm.rotation.x = THREE.MathUtils.lerp(this.parts.rightArm.rotation.x, 0, 0.2);
        this.parts.rig.position.y = THREE.MathUtils.lerp(this.parts.rig.position.y, 0, 0.2);
        this.parts.cape.rotation.x = 0.16 + Math.sin(Date.now() * 0.004) * 0.04;
      }
    }
  }
  getActiveEntity() {
    return this.mode === 'ON_FOOT' ? this.mesh : this.vehicle;
  }
  isNearVehicle() {
    return this.mode === 'ON_FOOT' && this.mesh.position.distanceTo(this.vehicle.position) <= 5.5;
  }
}
