import * as THREE from 'three';
export const WORLD_SPAN = 1000;
function distToRiverPath(x, z, points) {
  let minDist = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const abx = bx - ax;
    const abz = bz - az;
    const apx = x - ax;
    const apz = z - az;
    const abLenSq = abx * abx + abz * abz;
    const t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / abLenSq));
    const cx = ax + abx * t;
    const cz = az + abz * t;
    const d = Math.hypot(x - cx, z - cz);
    if (d < minDist) minDist = d;
  }
  return minDist;
}
const GANGA_PATH = [
  [-10, -165],
  [14, -115],
  [42, -68],
  [75, -24],
  [145, -12],
  [235, 18],
  [365, 38]
];
const YAMUNA_PATH = [
  [-52, -165],
  [-45, -102],
  [-28, -45],
  [18, -26],
  [75, -24]
];
const NARMADA_PATH = [
  [65, 65],
  [-25, 78],
  [-135, 88],
  [-275, 95]
];
export function getTerrainHeight(x, z) {
  const dwarkaPeninsulaDist = Math.hypot(x + 305, z - 45);
  const lankaIslandDist = Math.hypot(x - 32, z - 395);
  const easternIsleDist = Math.hypot(x - 325, z + 115);
  const radialDist = Math.hypot(x * 0.94, z * 0.92);
  const onMainland = radialDist <= 385;
  const onDwarka = dwarkaPeninsulaDist <= 52;
  const onLanka = lankaIslandDist <= 62;
  const onEastIsle = easternIsleDist <= 50;
  if (!onMainland && !onDwarka && !onLanka && !onEastIsle) {
    return -3.2;
  }
  let h = Math.sin(x * 0.016) * Math.cos(z * 0.016) * 3.4;
  h += Math.sin(x * 0.045 + z * 0.038) * 1.2;
  const distMeru = Math.hypot(x, z + 265);
  if (distMeru < 78) {
    const meruFactor = 1 - distMeru / 78;
    h += meruFactor * meruFactor * 68;
  }
  if (z < -160 && z > -225) {
    const ridge = Math.cos(((z + 192) / 32) * (Math.PI / 2));
    if (ridge > 0) h += ridge * 28;
  }
  if (z > 95 && z < 195 && Math.abs(x) < 190) {
    h += Math.cos(((z - 145) / 50) * (Math.PI / 2)) * 7.5;
  }
  if (lankaIslandDist < 36) {
    h += (1 - lankaIslandDist / 36) * 18;
  }
  const dGanga = distToRiverPath(x, z, GANGA_PATH);
  const dYamuna = distToRiverPath(x, z, YAMUNA_PATH);
  const dNarmada = distToRiverPath(x, z, NARMADA_PATH);
  const riverDist = Math.min(dGanga, dYamuna, dNarmada);
  if (riverDist < 8.5 && z > -166 && z < 280) {
    const channelDepth = (1 - riverDist / 8.5) * 4.8;
    h -= channelDepth;
  }
  if (onMainland && radialDist > 335 && !onDwarka) {
    h -= (radialDist - 335) * 0.16;
  }
  if (onLanka && lankaIslandDist > 42) {
    h -= (lankaIslandDist - 42) * 0.25;
  }
  if (onEastIsle && easternIsleDist > 35) {
    h -= (easternIsleDist - 35) * 0.25;
  }
  return Math.max(-3.2, h);
}
export function buildBharatWorld(scene, savedVisitedCodes, hasVimanaUnlocked) {
  const glowingMaterials = [];
  const segments = 260;
  const terrainGeo = new THREE.PlaneGeometry(WORLD_SPAN, WORLD_SPAN, segments, segments);
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position;
  const colors = [];
  const color = new THREE.Color();
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = getTerrainHeight(x, z);
    posAttr.setY(i, y);
    const distMeru = Math.hypot(x, z + 265);
    if (distMeru < 40 && y > 26) {
      color.set('#fbbf24');
    } else if (y < -0.1) {
      color.set('#e9c46a');
    } else if (y < 5.5) {
      color.set('#84a98c');
    } else if (y < 18.0) {
      color.set('#52796f');
    } else {
      color.set('#f8f9fa');
    }
    colors.push(color.r, color.g, color.b);
  }
  terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();
  const terrain = new THREE.Mesh(
    terrainGeo,
    new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 })
  );
  terrain.receiveShadow = true;
  scene.add(terrain);
  const waterMat = new THREE.MeshStandardMaterial({
    color: '#0284c7',
    transparent: true,
    opacity: 0.82,
    roughness: 0.18
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2600), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.35;
  scene.add(water);
  const nightStarCount = 1000;
  const starPos = new Float32Array(nightStarCount * 3);
  for (let i = 0; i < nightStarCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * (Math.PI * 0.45);
    const r = 680;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi) + 15;
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const nightStarGeo = new THREE.BufferGeometry();
  nightStarGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const nightStarMat = new THREE.PointsMaterial({
    color: '#fef08a',
    size: 1.8,
    transparent: true,
    opacity: 0
  });
  const nightStars = new THREE.Points(nightStarGeo, nightStarMat);
  scene.add(nightStars);
  const diyaMat = new THREE.MeshStandardMaterial({
    color: '#ffd700',
    emissive: '#ff9e00',
    emissiveIntensity: 0.4
  });
  glowingMaterials.push(diyaMat);
  function spawnGhatLamp(x, z) {
    const y = getTerrainHeight(x, z);
    if (y < -0.25) return;
    const lampPost = new THREE.Group();
    lampPost.position.set(x, y, z);
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.16, 1.3, 5),
      new THREE.MeshStandardMaterial({ color: '#78350f', flatShading: true })
    );
    pillar.position.y = 0.65;
    lampPost.add(pillar);
    const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), diyaMat);
    flame.position.y = 1.42;
    lampPost.add(flame);
    scene.add(lampPost);
  }
  for (let gx = 122; gx <= 168; gx += 5) {
    spawnGhatLamp(gx, -22);
  }
  for (let px = 64; px <= 88; px += 5) {
    spawnGhatLamp(px, -33);
  }
  const boats = [];
  const woodMat = new THREE.MeshStandardMaterial({ color: '#7f4f24', flatShading: true });
  const sailMat = new THREE.MeshStandardMaterial({
    color: '#fef3c7',
    emissive: '#f59e0b',
    emissiveIntensity: 0.15,
    side: THREE.DoubleSide,
    flatShading: true
  });
  glowingMaterials.push(sailMat);
  function createRiverBoat(startSegment, startT, speed) {
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.48, 3.0), woodMat);
    hull.position.y = 0.05;
    hull.castShadow = true;
    boat.add(hull);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.1, 4), woodMat);
    bow.rotation.x = -Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.position.set(0, 0.08, -1.85);
    boat.add(bow);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.3, 5), woodMat);
    mast.position.set(0, 1.15, -0.1);
    boat.add(mast);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.6), sailMat);
    sail.position.set(0, 1.3, -0.05);
    sail.rotation.y = Math.PI / 5;
    boat.add(sail);
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), diyaMat);
    lantern.position.set(0, 0.55, -1.6);
    boat.add(lantern);
    scene.add(boat);
    boats.push({
      mesh: boat,
      segIdx: startSegment,
      t: startT,
      speed,
      bobOffset: Math.random() * Math.PI * 2
    });
  }
  createRiverBoat(1, 0.2, 0.0022);
  createRiverBoat(2, 0.5, 0.002);
  createRiverBoat(3, 0.2, 0.0024);
  createRiverBoat(3, 0.7, 0.0021);
  createRiverBoat(4, 0.3, 0.0019);
  createRiverBoat(5, 0.4, 0.0018);
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#6f4e37', flatShading: true });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#2d6a4f', flatShading: true });
  const ruinMat = new THREE.MeshStandardMaterial({ color: '#d4a373', flatShading: true });
  for (let i = 0; i < 750; i++) {
    const rx = (Math.random() - 0.5) * 760;
    const rz = (Math.random() - 0.5) * 840;
    const ry = getTerrainHeight(rx, rz);
    if (ry < 0.45 || ry > 15) continue;
    const tree = new THREE.Group();
    tree.position.set(rx, ry, rz);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 1.4, 5), trunkMat);
    trunk.position.y = 0.7;
    trunk.castShadow = true;
    tree.add(trunk);
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.8, 6), leafMat);
    leaves.position.y = 2.5;
    leaves.castShadow = true;
    tree.add(leaves);
    scene.add(tree);
  }
  for (let i = 0; i < 110; i++) {
    const rx = (Math.random() - 0.5) * 720;
    const rz = (Math.random() - 0.5) * 800;
    const ry = getTerrainHeight(rx, rz);
    if (ry < 0.35 || ry > 16) continue;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 3.2, 6), ruinMat);
    pillar.position.set(rx, ry + 1.4, rz);
    pillar.rotation.z = (Math.random() - 0.5) * 0.25;
    pillar.castShadow = true;
    scene.add(pillar);
  }
  const templeFlags = [];
  function createTemple({ name, shortName, region, rewardText, x, z, wallColor, type = 'ASTRA', style = 'NAGARA' }) {
    const y = Math.max(0.2, getTerrainHeight(x, z));
    const visited =
      type === 'VIMANA' ? hasVimanaUnlocked : savedVisitedCodes.includes(shortName);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const lowerPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(7.6, 1.2, 7.6),
      new THREE.MeshStandardMaterial({ color: '#78716c', flatShading: true })
    );
    lowerPlinth.position.y = 0.4;
    lowerPlinth.receiveShadow = true;
    group.add(lowerPlinth);
    const upperPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 0.8, 6.2),
      new THREE.MeshStandardMaterial({ color: '#a8a29e', flatShading: true })
    );
    upperPlinth.position.y = 1.2;
    upperPlinth.receiveShadow = true;
    group.add(upperPlinth);
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, flatShading: true });
    const goldMat = new THREE.MeshStandardMaterial({
      color: '#ffd700',
      emissive: '#ffaa00',
      emissiveIntensity: 0.55,
      flatShading: true
    });
    glowingMaterials.push(goldMat);
    const sanctumMat = new THREE.MeshStandardMaterial({
      color: visited ? '#38bdf8' : '#ef4444',
      emissive: visited ? '#0284c7' : '#dc2626',
      emissiveIntensity: 1.2
    });
    let spireTopY = 7.8;
    if (style === 'VIMANA_HANGAR') {
      const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 2.2, 8), wallMat);
      domeBase.position.y = 2.7;
      domeBase.castShadow = true;
      group.add(domeBase);
      const upperDome = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), goldMat);
      upperDome.position.y = 3.8;
      group.add(upperDome);
      [
        [-2.4, -2.4],
        [2.4, -2.4],
        [-2.4, 2.4],
        [2.4, 2.4]
      ].forEach(([px, pz]) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 3.2, 6), goldMat);
        col.position.set(px, 3.1, pz);
        group.add(col);
      });
      spireTopY = 6.2;
    } else if (style === 'DRAVIDA') {
      const tiers = [
        { w: 4.4, h: 1.6, d: 3.4, y: 2.4 },
        { w: 3.4, h: 1.4, d: 2.6, y: 3.9 },
        { w: 2.4, h: 1.2, d: 1.9, y: 5.2 }
      ];
      tiers.forEach((t) => {
        const block = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), wallMat);
        block.position.y = t.y;
        block.castShadow = true;
        group.add(block);
        const trim = new THREE.Mesh(new THREE.BoxGeometry(t.w + 0.3, 0.22, t.d + 0.3), goldMat);
        trim.position.y = t.y + t.h * 0.5;
        group.add(trim);
      });
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.4, 6), goldMat);
      roof.rotation.z = Math.PI / 2;
      roof.position.y = 6.2;
      group.add(roof);
      spireTopY = 7.1;
    } else {
      const garbhagriha = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 3.6), wallMat);
      garbhagriha.position.y = 2.8;
      garbhagriha.castShadow = true;
      group.add(garbhagriha);
      const portal = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.8, 0.3), sanctumMat);
      portal.position.set(0, 2.5, 1.75);
      group.add(portal);
      const shikhara = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 2.3, 3.6, 8), wallMat);
      shikhara.position.y = 5.6;
      shikhara.castShadow = true;
      group.add(shikhara);
      [
        [-1.45, -1.45],
        [1.45, -1.45],
        [-1.45, 1.45],
        [1.45, 1.45]
      ].forEach(([ux, uz]) => {
        const subSpire = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.0, 6), wallMat);
        subSpire.position.set(ux, 4.6, uz);
        group.add(subSpire);
      });
      const amalaka = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.28, 6, 12), goldMat);
      amalaka.rotation.x = Math.PI / 2;
      amalaka.position.y = 7.5;
      group.add(amalaka);
      const kalasha = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.3, 6), goldMat);
      kalasha.position.y = 8.2;
      group.add(kalasha);
      spireTopY = 8.8;
    }
    const mastHeight = 3.2;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, mastHeight, 6), goldMat);
    mast.position.set(0, spireTopY + mastHeight * 0.5 - 0.2, 0);
    group.add(mast);
    const flagGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0.45, 0,
      0, -0.45, 0,
      2.1, 0.0, 0
    ]);
    flagGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    flagGeo.computeVertexNormals();
    const flagMat = new THREE.MeshStandardMaterial({
      color: visited ? '#ff9e00' : '#7f1d1d',
      emissive: visited ? '#f59e0b' : '#450a0a',
      emissiveIntensity: visited ? 0.85 : 0.2,
      side: THREE.DoubleSide,
      flatShading: true
    });
    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    const loweredY = spireTopY + 0.9;
    const raisedY = spireTopY + mastHeight - 0.55;
    flagMesh.position.set(0, visited ? raisedY : loweredY, 0);
    group.add(flagMesh);
    const flagData = {
      mesh: flagMesh,
      mat: flagMat,
      targetY: visited ? raisedY : loweredY,
      phase: Math.random() * Math.PI * 2
    };
    templeFlags.push(flagData);
    [-3.1, 3.1].forEach((cx) => {
      [-3.1, 3.1].forEach((cz) => {
        const cornerDiya = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), diyaMat);
        cornerDiya.position.set(cx, 1.75, cz);
        group.add(cornerDiya);
      });
    });
    const ringMat = new THREE.MeshBasicMaterial({
      color: visited ? '#38bdf8' : '#ef4444',
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(4.8, 5.4, 32), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 1.62;
    group.add(ring);
    scene.add(group);
    function onGuardsDefeated() {
      flagData.targetY = raisedY;
      flagData.mat.color.set('#ff9e00');
      flagData.mat.emissive.set('#f59e0b');
      flagData.mat.emissiveIntensity = 0.95;
      sanctumMat.color.set('#ffd700');
      sanctumMat.emissive.set('#f59e0b');
      if (!visited) {
        ringMat.color.set('#ffd700');
      }
    }
    return {
      name,
      shortName,
      region,
      rewardText,
      pos: new THREE.Vector3(x, y, z),
      visited,
      ringMat,
      type,
      guardsCleared: visited,
      onGuardsDefeated
    };
  }
  const temples = [
    createTemple({
      name: 'Garuda Vimana Sanctum',
      shortName: 'VMN',
      region: 'Suryapuri North (Sarayu Meadows)',
      rewardText: 'Unlocks Garuda Vimana Sky-Flight',
      x: 68,
      z: -62,
      wallColor: '#7e22ce',
      type: 'VIMANA',
      style: 'VIMANA_HANGAR'
    }),
    createTemple({
      name: 'Jyotirgram River Ghats',
      shortName: 'KSH',
      region: 'East Banks of Amritanadi River',
      rewardText: '+1 Tapasya • Unlocks [2] Varunastra',
      x: 145,
      z: -26,
      wallColor: '#e9c46a',
      type: 'ASTRA',
      style: 'NAGARA'
    }),
    createTemple({
      name: 'Madhuvana River Sanctum',
      shortName: 'MTH',
      region: 'West Bank of Kalindi River',
      rewardText: '+1 Tapasya • Unlocks [3] Pashupatastra',
      x: -48,
      z: -45,
      wallColor: '#f4a261',
      type: 'ASTRA',
      style: 'NAGARA'
    }),
    createTemple({
      name: 'Gajapuri Royal Sanctum',
      shortName: 'HST',
      region: 'Upper Twin-River Confluence',
      rewardText: '+1 Tapasya • Strengthens Astras',
      x: -16,
      z: -125,
      wallColor: '#e07a5f',
      type: 'ASTRA',
      style: 'NAGARA'
    }),
    createTemple({
      name: 'Devanagari Sky-Citadel',
      shortName: 'IND',
      region: 'Emerald Western Heartlands',
      rewardText: '+1 Tapasya • Strengthens Astras',
      x: -135,
      z: -65,
      wallColor: '#d97706',
      type: 'ASTRA',
      style: 'NAGARA'
    }),
    createTemple({
      name: 'Sagarapura Coastal Sanctum',
      shortName: 'DWK',
      region: 'Western Peninsula (Kshira Samudra)',
      rewardText: '+1 Tapasya • Coastal Fast-Travel Hub',
      x: -305,
      z: 45,
      wallColor: '#e76f51',
      type: 'ASTRA',
      style: 'DRAVIDA'
    }),
    createTemple({
      name: 'Avantika Astral Observatory',
      shortName: 'UJN',
      region: 'Vindhya Plateau (North of Reva River)',
      rewardText: '+1 Tapasya • Central Fast-Travel Hub',
      x: -85,
      z: 52,
      wallColor: '#b45309',
      type: 'ASTRA',
      style: 'NAGARA'
    }),
    createTemple({
      name: 'Setubandha & Suvarnadweep',
      shortName: 'LNK',
      region: 'Southern Emerald Archipelago',
      rewardText: '+1 Tapasya • Southern Island Hub',
      x: 32,
      z: 392,
      wallColor: '#dc2626',
      type: 'ASTRA',
      style: 'DRAVIDA'
    }),
    createTemple({
      name: 'Udayagiri Sunrise Sanctum',
      shortName: 'KMR',
      region: 'Eastern Dawn Archipelago',
      rewardText: '+1 Tapasya • Eastern Sea Hub',
      x: 325,
      z: -115,
      wallColor: '#059669',
      type: 'ASTRA',
      style: 'NAGARA'
    }),
    createTemple({
      name: 'Mount Ratnagiri Cosmic Spire',
      shortName: 'MRU',
      region: 'High Northern Himadri Summit',
      rewardText: '+1 Tapasya • Highest Launchpad to Orbit',
      x: 0,
      z: -215,
      wallColor: '#38bdf8',
      type: 'ASTRA',
      style: 'NAGARA'
    })
  ];
  const roadPairs = [
    [temples[0], temples[1]],
    [temples[0], temples[2]],
    [temples[2], temples[3]],
    [temples[2], temples[4]],
    [temples[2], temples[6]],
    [temples[6], temples[5]]
  ];
  const roadStoneMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', flatShading: true });
  for (const [tA, tB] of roadPairs) {
    const dist = tA.pos.distanceTo(tB.pos);
    const steps = Math.floor(dist / 9);
    const angle = Math.atan2(tB.pos.x - tA.pos.x, tB.pos.z - tA.pos.z);
    for (let s = 1; s < steps; s++) {
      const f = s / steps;
      const rx = THREE.MathUtils.lerp(tA.pos.x, tB.pos.x, f);
      const rz = THREE.MathUtils.lerp(tA.pos.z, tB.pos.z, f);
      const ry = getTerrainHeight(rx, rz);
      if (ry < -0.15) continue;
      const paver = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 3.6), roadStoneMat);
      paver.position.set(rx, ry + 0.05, rz);
      paver.rotation.y = angle;
      paver.receiveShadow = true;
      scene.add(paver);
    }
  }
  const daySky = new THREE.Color('#7dd3fc');
  const sunsetSky = new THREE.Color('#f4a261');
  const nightSky = new THREE.Color('#090d24');
  const activeEarthSky = new THREE.Color();
  function updateWorld(timeOfDay, sunLight, ambientLight) {
    const now = Date.now() * 0.003;
    for (const b of boats) {
      b.t += b.speed;
      if (b.t >= 1) {
        b.t = 0;
        b.segIdx = (b.segIdx + 1) % (GANGA_PATH.length - 1);
      }
      const [ax, az] = GANGA_PATH[b.segIdx];
      const [bx, bz] = GANGA_PATH[b.segIdx + 1];
      const x = THREE.MathUtils.lerp(ax, bx, b.t);
      const z = THREE.MathUtils.lerp(az, bz, b.t);
      const bobY = -0.32 + Math.sin(now + b.bobOffset) * 0.05;
      b.mesh.position.set(x, bobY, z);
      b.mesh.rotation.y = Math.atan2(-(bx - ax), -(bz - az));
      b.mesh.rotation.z = Math.sin(now * 0.8 + b.bobOffset) * 0.05;
    }
    for (const f of templeFlags) {
      f.mesh.position.y = THREE.MathUtils.lerp(f.mesh.position.y, f.targetY, 0.06);
      f.mesh.rotation.y = Math.sin(now * 1.8 + f.phase) * 0.28;
    }
    const sunAngle = (timeOfDay - 0.25) * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    sunLight.position.set(Math.cos(sunAngle) * 200, Math.max(25, Math.abs(sunHeight) * 210), 80);
    const nightFactor = THREE.MathUtils.clamp((-sunHeight + 0.15) / 0.75, 0, 1);
    if (sunHeight >= 0) {
      const noonBlend = Math.min(1, sunHeight * 2.2);
      activeEarthSky.lerpColors(sunsetSky, daySky, noonBlend);
    } else {
      const duskBlend = Math.min(1, -sunHeight * 2.2);
      activeEarthSky.lerpColors(sunsetSky, nightSky, duskBlend);
    }
    sunLight.intensity = THREE.MathUtils.lerp(1.85, 0.45, nightFactor);
    sunLight.color.set(nightFactor > 0.55 ? '#93c5fd' : '#fff1e6');
    ambientLight.intensity = THREE.MathUtils.lerp(0.82, 0.35, nightFactor);
    waterMat.color.set(nightFactor > 0.55 ? '#0369a1' : '#0284c7');
    nightStarMat.opacity = THREE.MathUtils.clamp((nightFactor - 0.35) * 1.5, 0, 0.95);
    const flicker = 1 + Math.sin(Date.now() * 0.012) * 0.12;
    const glowStrength = THREE.MathUtils.lerp(0.35, 2.4, nightFactor) * flicker;
    for (const mat of glowingMaterials) {
      mat.emissiveIntensity = glowStrength;
    }
    return {
      earthSkyColor: activeEarthSky,
      isNight: nightFactor > 0.55
    };
  }
  return { temples, updateWorld };
}
