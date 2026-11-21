import * as THREE from 'three';
const SAGE_BLESSINGS = [
  '🙏 Sage: "May wisdom and courage guide your arrows, O Guardian!"',
  '🙏 Rishi: "Svarbhanu’s shadow fleets in Antariksha yield only to the Pashupatastra."',
  '🙏 Sage: "Meditate near the sacred river ghats to restore your Kavacha."',
  '🙏 Rishi: "Beyond Mount Ratnagiri lies the Grahan-Durg, where Svarbhanu waits."'
];
const VILLAGER_LINES = [
  '🪔 Villager: "Lantern boats from Jyotirgram drift down the Amritanadi, each carrying a prayer for the nectar."',
  '🌾 Townsfolk: "Thank you for freeing our sanctums from the Chhaya-Sena!"',
  '🏺 Villager: "Follow the ancient stone Rajapatha highways to reach distant realms."',
  '🐚 Townsfolk: "The Garuda Vimana can soar straight into the starry expanse!"'
];
export class TownsfolkManager {
  constructor(scene, getTerrainHeight) {
    this.scene = scene;
    this.getTerrainHeight = getTerrainHeight;
    this.npcs = [];
  }
  populateWorld(temples) {
    for (const temple of temples) {
      for (let i = 0; i < 2; i++) {
        this._spawnNPC({
          role: 'SAGE',
          homePos: temple.pos,
          radius: 7.5 + i * 2.5,
          startAngle: i * Math.PI + 0.5
        });
      }
      for (let i = 0; i < 2; i++) {
        this._spawnNPC({
          role: 'VILLAGER',
          homePos: temple.pos,
          radius: 11.5 + i * 3.0,
          startAngle: i * Math.PI + 1.8
        });
      }
    }
    const ghatSpots = [
      new THREE.Vector3(140, 0, -22),
      new THREE.Vector3(152, 0, -24),
      new THREE.Vector3(72, 0, -30)
    ];
    ghatSpots.forEach((spot, idx) => {
      this._spawnNPC({
        role: idx % 2 === 0 ? 'SAGE' : 'VILLAGER',
        homePos: spot,
        radius: 6.5,
        startAngle: idx * 1.4
      });
    });
  }
  _spawnNPC({ role, homePos, radius, startAngle }) {
    const isSage = role === 'SAGE';
    const mesh = this._buildNPCMesh(isSage);
    const x = homePos.x + Math.cos(startAngle) * radius;
    const z = homePos.z + Math.sin(startAngle) * radius;
    const y = Math.max(0.1, this.getTerrainHeight(x, z));
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    const dialoguePool = isSage ? SAGE_BLESSINGS : VILLAGER_LINES;
    const line = dialoguePool[Math.floor(Math.random() * dialoguePool.length)];
    this.npcs.push({
      mesh,
      role,
      homePos: homePos.clone(),
      radius,
      angle: startAngle,
      speed: (isSage ? 0.006 : 0.009) * (Math.random() > 0.5 ? 1 : -1),
      walkPhase: Math.random() * Math.PI * 2,
      line
    });
  }
  _buildNPCMesh(isSage) {
    const group = new THREE.Group();
    const robeColors = ['#eab308', '#14b8a6', '#ec4899', '#8b5cf6'];
    const tunicColor = isSage
      ? '#f97316'
      : robeColors[Math.floor(Math.random() * robeColors.length)];
    const robeMat = new THREE.MeshStandardMaterial({ color: tunicColor, flatShading: true });
    const skinMat = new THREE.MeshStandardMaterial({ color: '#d99b66', flatShading: true });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.36, 1.15, 7), robeMat);
    body.position.y = 0.58;
    body.castShadow = true;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 7), skinMat);
    head.position.y = 1.32;
    head.castShadow = true;
    group.add(head);
    if (isSage) {
      const hairMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', flatShading: true });
      const topknot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 6), hairMat);
      topknot.position.y = 1.54;
      group.add(topknot);
      const beard = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 5), hairMat);
      beard.rotation.x = Math.PI;
      beard.position.set(0, 1.14, -0.14);
      group.add(beard);
      const staff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.04, 1.65, 5),
        new THREE.MeshStandardMaterial({ color: '#78350f', flatShading: true })
      );
      staff.position.set(0.34, 0.82, -0.1);
      group.add(staff);
    } else {
      const turban = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.06, 5, 10),
        new THREE.MeshStandardMaterial({ color: '#fef3c7', flatShading: true })
      );
      turban.rotation.x = Math.PI / 2;
      turban.position.y = 1.42;
      group.add(turban);
    }
    return group;
  }
  update(hero, isSpaceMode) {
    if (isSpaceMode) return null;
    let activeGreeting = null;
    for (const npc of this.npcs) {
      const distToHero =
        hero.mode === 'ON_FOOT' ? npc.mesh.position.distanceTo(hero.mesh.position) : Infinity;
      if (distToHero < 3.8) {
        const toHero = new THREE.Vector3().subVectors(hero.mesh.position, npc.mesh.position);
        npc.mesh.rotation.y = Math.atan2(-toHero.x, -toHero.z);
        npc.mesh.children[0].position.y = 0.58;
        if (hero.isGreeting) {
          npc.mesh.rotation.x = THREE.MathUtils.lerp(npc.mesh.rotation.x, 0.14, 0.2);
        } else {
          npc.mesh.rotation.x = THREE.MathUtils.lerp(npc.mesh.rotation.x, 0, 0.2);
        }
        if (!activeGreeting) {
          const text =
            hero.isGreeting && npc.role === 'SAGE'
              ? '🙏 Rishi Blesses You: "Ayushman Bhava! Kavacha rapidly restored!"'
              : hero.isGreeting
              ? '🙏 Villager: "Pranama, Amrit-Rakshak of Jambudweep!"'
              : `${npc.line} (Hold G for Pranama)`;
          activeGreeting = {
            text,
            isSage: npc.role === 'SAGE',
            honored: hero.isGreeting
          };
        }
      } else {
        npc.mesh.rotation.x = THREE.MathUtils.lerp(npc.mesh.rotation.x, 0, 0.2);
        npc.angle += npc.speed;
        const nx = npc.homePos.x + Math.cos(npc.angle) * npc.radius;
        const nz = npc.homePos.z + Math.sin(npc.angle) * npc.radius;
        const dx = nx - npc.mesh.position.x;
        const dz = nz - npc.mesh.position.z;
        npc.mesh.position.x = nx;
        npc.mesh.position.z = nz;
        npc.mesh.rotation.y = Math.atan2(-dx, -dz);
        npc.walkPhase += 0.14;
        npc.mesh.children[0].position.y = 0.58 + Math.abs(Math.sin(npc.walkPhase)) * 0.04;
      }
      const groundY = Math.max(-0.2, this.getTerrainHeight(npc.mesh.position.x, npc.mesh.position.z));
      npc.mesh.position.y = THREE.MathUtils.lerp(npc.mesh.position.y, groundY, 0.25);
    }
    return activeGreeting;
  }
}
