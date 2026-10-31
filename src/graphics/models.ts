import * as THREE from 'three';
import { CharacterSkin, ObstacleType, PowerUpType } from '../types';

/**
 * Procedural 3D Models for Temple Escape 3D.
 * Follows Three.js Skill Directives:
 * - Multi-part composite models (3-12 parts) with THREE.Group
 * - Varied roughness and metalness
 * - Bottom-center grounded pivots
 * - Zero external assets
 */

export interface PlayerRig {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  backpack: THREE.Group;
  heldIdol: THREE.Group;
  updateAnimation: (time: number, speed: number, state: 'RUN' | 'JUMP' | 'SLIDE' | 'STUMBLE' | 'TITLE') => void;
}

export interface DemonRig {
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  jaw: THREE.Mesh;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  updateAnimation: (time: number, speed: number, distance: number) => void;
}

// 1. HERO CHARACTER MODEL (Guy Dangerous / Scarlett Fox / Karma)
export function createPlayerModel(skin: CharacterSkin): PlayerRig {
  const root = new THREE.Group();

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: skin.skinTone,
    roughness: 0.6,
    metalness: 0.05,
  });

  const shirtMat = new THREE.MeshStandardMaterial({
    color: skin.shirtColor,
    roughness: 0.7,
    metalness: 0.1,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: skin.pantsColor,
    roughness: 0.8,
    metalness: 0.05,
  });

  const hatMat = new THREE.MeshStandardMaterial({
    color: skin.hatColor,
    roughness: 0.5,
    metalness: 0.1,
  });

  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x24170d,
    roughness: 0.4,
    metalness: 0.2,
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x4a2a14,
    roughness: 0.5,
    metalness: 0.15,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    metalness: 0.9,
    roughness: 0.2,
  });

  // Hips / Pelvis
  const pelvis = new THREE.Group();
  pelvis.position.y = 0.95;
  root.add(pelvis);

  // Torso
  const torso = new THREE.Group();
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.3), shirtMat);
  torsoMesh.position.y = 0.35;
  torsoMesh.castShadow = true;
  torso.add(torsoMesh);

  // Belt & buckle
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.32), leatherMat);
  belt.position.y = 0.08;
  torso.add(belt);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.34), goldMat);
  buckle.position.y = 0.08;
  torso.add(buckle);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.15, 8), skinMat);
  neck.position.y = 0.72;
  torso.add(neck);

  // Head
  const head = new THREE.Group();
  head.position.y = 0.85;
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.32), skinMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Explorer Fedora / Hat
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.05, 12), hatMat);
  hatBrim.position.y = 0.18;
  hatBrim.rotation.x = -0.05;
  head.add(hatBrim);

  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.22, 12), hatMat);
  hatCrown.position.y = 0.3;
  hatCrown.rotation.x = -0.05;
  head.add(hatCrown);

  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.06, 12), leatherMat);
  hatBand.position.y = 0.22;
  hatBand.rotation.x = -0.05;
  head.add(hatBand);

  torso.add(head);

  // Backpack
  const backpack = new THREE.Group();
  backpack.position.set(0, 0.38, -0.22);
  const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.48, 0.22), leatherMat);
  backpack.add(packBody);
  // Bedroll on top
  const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.46, 8), hatMat);
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.y = 0.28;
  backpack.add(bedroll);
  // Canteen
  const canteen = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8), goldMat);
  canteen.position.set(0.22, -0.05, 0);
  backpack.add(canteen);
  torso.add(backpack);

  pelvis.add(torso);

  // Arms
  const createArm = (isLeft: boolean) => {
    const armGroup = new THREE.Group();
    const xOffset = isLeft ? -0.35 : 0.35;
    armGroup.position.set(xOffset, 0.6, 0);

    // Shoulder sleeve
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.18), shirtMat);
    sleeve.position.y = -0.14;
    armGroup.add(sleeve);

    // Forearm & Hand
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.14), skinMat);
    forearm.position.y = -0.42;
    armGroup.add(forearm);

    armGroup.castShadow = true;
    return armGroup;
  };

  const leftArm = createArm(true);
  const rightArm = createArm(false);
  torso.add(leftArm);
  torso.add(rightArm);

  // Held Golden Idol (in right hand)
  const heldIdol = new THREE.Group();
  heldIdol.position.set(0, -0.58, 0.15);
  const idolBody = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 6), goldMat);
  const idolHead = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), goldMat);
  idolHead.position.y = 0.14;
  heldIdol.add(idolBody);
  heldIdol.add(idolHead);
  rightArm.add(heldIdol);

  // Legs
  const createLeg = (isLeft: boolean) => {
    const legGroup = new THREE.Group();
    const xOffset = isLeft ? -0.16 : 0.16;
    legGroup.position.set(xOffset, 0, 0);

    // Thigh
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.22), pantsMat);
    thigh.position.y = -0.22;
    thigh.castShadow = true;
    legGroup.add(thigh);

    // Calf
    const calf = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.18), pantsMat);
    calf.position.y = -0.62;
    calf.castShadow = true;
    legGroup.add(calf);

    // Boot
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.16, 0.3), bootMat);
    boot.position.set(0, -0.88, 0.05);
    boot.castShadow = true;
    legGroup.add(boot);

    return legGroup;
  };

  const leftLeg = createLeg(true);
  const rightLeg = createLeg(false);
  pelvis.add(leftLeg);
  pelvis.add(rightLeg);

  // Animation Update Function
  const updateAnimation = (
    time: number,
    speed: number,
    state: 'RUN' | 'JUMP' | 'SLIDE' | 'STUMBLE' | 'TITLE'
  ) => {
    if (state === 'RUN') {
      const runCycle = time * (speed * 0.7 + 5);
      const legAngle = Math.sin(runCycle) * 0.8;
      leftLeg.rotation.x = legAngle;
      rightLeg.rotation.x = -legAngle;

      leftArm.rotation.x = -legAngle * 0.85;
      rightArm.rotation.x = legAngle * 0.85;

      leftLeg.rotation.z = 0;
      rightLeg.rotation.z = 0;
      pelvis.position.y = 0.95 + Math.abs(Math.sin(runCycle * 2)) * 0.09;
      torso.rotation.x = 0.14; // Forward running lean
      torso.rotation.z = Math.sin(runCycle) * 0.04;
      heldIdol.visible = false;
    } else if (state === 'JUMP') {
      // Tuck legs
      leftLeg.rotation.x = -0.7;
      rightLeg.rotation.x = -0.5;
      leftLeg.rotation.z = -0.15;
      rightLeg.rotation.z = 0.15;
      leftArm.rotation.x = -1.2;
      rightArm.rotation.x = -1.2;
      torso.rotation.x = -0.1;
      heldIdol.visible = false;
    } else if (state === 'SLIDE') {
      // Crouch flat slide
      pelvis.position.y = 0.45;
      torso.rotation.x = 1.15;
      leftLeg.rotation.x = 1.2;
      rightLeg.rotation.x = 1.0;
      leftArm.rotation.x = -0.6;
      rightArm.rotation.x = -0.6;
      heldIdol.visible = false;
    } else if (state === 'STUMBLE') {
      // Stumble flail
      torso.rotation.x = 0.4;
      torso.rotation.z = Math.sin(time * 20) * 0.3;
      leftArm.rotation.x = Math.sin(time * 15) * 1.2;
      rightArm.rotation.x = Math.cos(time * 15) * 1.2;
      leftLeg.rotation.x = 0.2;
      rightLeg.rotation.x = -0.2;
      heldIdol.visible = false;
    } else if (state === 'TITLE') {
      // Majestic hero pose holding relic aloft
      const breathe = Math.sin(time * 2) * 0.03;
      pelvis.position.y = 0.95 + breathe;
      torso.rotation.x = 0;
      torso.rotation.z = 0;
      leftLeg.rotation.x = 0.1;
      rightLeg.rotation.x = -0.1;
      leftArm.rotation.x = 0.2;
      leftArm.rotation.z = -0.2;

      // Right arm raised holding golden idol
      rightArm.rotation.x = -1.4;
      rightArm.rotation.y = -0.3;
      rightArm.rotation.z = 0.4;
      heldIdol.visible = true;
    }
  };

  return {
    group: root,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    torso,
    head,
    backpack,
    heldIdol,
    updateAnimation,
  };
}

// 2. DEMON GUARDIAN BEAST (The Chaser)
export function createDemonBeastModel(): DemonRig {
  const root = new THREE.Group();

  const demonMat = new THREE.MeshStandardMaterial({
    color: 0x1b191c,
    roughness: 0.85,
    metalness: 0.3,
  });

  const hornMat = new THREE.MeshStandardMaterial({
    color: 0x0f0e0f,
    roughness: 0.3,
    metalness: 0.8,
  });

  const eyeMat = new THREE.MeshBasicMaterial({
    color: 0xff1a1a,
  });

  const teethMat = new THREE.MeshStandardMaterial({
    color: 0xd8c8b0,
    roughness: 0.4,
  });

  // Massive Torso
  const torso = new THREE.Group();
  torso.position.y = 1.8;
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.2), demonMat);
  torsoMesh.castShadow = true;
  torso.add(torsoMesh);

  // Hunched shoulder pads / spikes
  for (let i = -1; i <= 1; i += 2) {
    const shoulder = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 6), hornMat);
    shoulder.position.set(i * 0.9, 0.6, -0.2);
    shoulder.rotation.z = -i * 0.4;
    torso.add(shoulder);
  }

  // Spine spikes
  for (let s = 0; s < 4; s++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 5), hornMat);
    spike.position.set(0, 0.5 - s * 0.3, -0.65);
    spike.rotation.x = -0.5;
    torso.add(spike);
  }

  // Head
  const head = new THREE.Group();
  head.position.set(0, 0.7, 0.65);
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), demonMat);
  skull.castShadow = true;
  head.add(skull);

  // Curving menacing horns
  for (let side = -1; side <= 1; side += 2) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 6), hornMat);
    horn.position.set(side * 0.48, 0.65, -0.1);
    horn.rotation.z = -side * 0.6;
    horn.rotation.x = -0.3;
    head.add(horn);
  }

  // Glowing red eyes
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
  leftEye.position.set(-0.25, 0.15, 0.48);
  head.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
  rightEye.position.set(0.25, 0.15, 0.48);
  head.add(rightEye);

  // Jaw
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.7), demonMat);
  jaw.position.set(0, -0.35, 0.2);
  head.add(jaw);

  // Tusks
  for (let t = -1; t <= 1; t += 2) {
    const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 5), teethMat);
    tusk.position.set(t * 0.28, -0.15, 0.48);
    tusk.rotation.x = 0.4;
    head.add(tusk);
  }

  torso.add(head);
  root.add(torso);

  // Massive Reaching Forearms
  const createDemonArm = (isLeft: boolean) => {
    const armGroup = new THREE.Group();
    const side = isLeft ? -1 : 1;
    armGroup.position.set(side * 1.05, 0.4, 0.2);

    const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.9, 0.45), demonMat);
    upperArm.position.y = -0.35;
    upperArm.castShadow = true;
    armGroup.add(upperArm);

    const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 0.4), demonMat);
    lowerArm.position.set(0, -1.0, 0.2);
    lowerArm.castShadow = true;
    armGroup.add(lowerArm);

    // Claws
    for (let c = -1; c <= 1; c++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 4), hornMat);
      claw.position.set(c * 0.12, -1.6, 0.3);
      claw.rotation.x = 0.5;
      armGroup.add(claw);
    }

    return armGroup;
  };

  const leftArm = createDemonArm(true);
  const rightArm = createDemonArm(false);
  torso.add(leftArm);
  torso.add(rightArm);

  // Stomping Legs
  const legMat = demonMat;
  for (let l = -1; l <= 1; l += 2) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 0.6), legMat);
    leg.position.set(l * 0.55, 0.65, -0.2);
    leg.castShadow = true;
    root.add(leg);
  }

  const updateAnimation = (time: number, speed: number, distance: number) => {
    // Distance affects lunging behavior: closer distance = more aggressive forward reach
    const bound = Math.sin(time * 12);
    torso.position.y = 1.8 + Math.abs(bound) * 0.3;
    torso.rotation.x = 0.35 + (distance < 4 ? 0.3 : 0);

    // Lunging swipe
    leftArm.rotation.x = -0.8 + Math.sin(time * 10) * 0.7;
    rightArm.rotation.x = -0.8 - Math.sin(time * 10) * 0.7;

    // Jaw chomp
    jaw.position.y = -0.35 - Math.abs(Math.sin(time * 8)) * 0.15;

    // Head bob
    head.rotation.y = Math.sin(time * 4) * 0.15;
  };

  return {
    group: root,
    leftArm,
    rightArm,
    head,
    torso,
    jaw,
    leftEye,
    rightEye,
    updateAnimation,
  };
}

// 3. TRACK SEGMENT GENERATOR
export function createTrackSegment(
  textures: {
    stonePavers: THREE.Texture;
    stoneWall: THREE.Texture;
  },
  segmentIndex: number
): THREE.Group {
  const group = new THREE.Group();
  const segmentLength = 30; // Length of each chunk

  // Road floor
  const roadMat = new THREE.MeshStandardMaterial({
    map: textures.stonePavers,
    roughness: 0.75,
    metalness: 0.15,
  });

  const roadGeom = new THREE.BoxGeometry(8.8, 1.2, segmentLength);
  const road = new THREE.Mesh(roadGeom, roadMat);
  road.position.y = -0.6;
  road.receiveShadow = true;
  group.add(road);

  // Side curbs
  const curbMat = new THREE.MeshStandardMaterial({
    map: textures.stoneWall,
    roughness: 0.85,
    metalness: 0.1,
  });

  const curbGeom = new THREE.BoxGeometry(0.8, 0.7, segmentLength);
  const leftCurb = new THREE.Mesh(curbGeom, curbMat);
  leftCurb.position.set(-4.5, 0.25, 0);
  leftCurb.castShadow = true;
  leftCurb.receiveShadow = true;
  group.add(leftCurb);

  const rightCurb = new THREE.Mesh(curbGeom, curbMat);
  rightCurb.position.set(4.5, 0.25, 0);
  rightCurb.castShadow = true;
  rightCurb.receiveShadow = true;
  group.add(rightCurb);

  // Ancient Totem Pillars along the side every 15 units
  const pillarGeom = new THREE.CylinderGeometry(0.4, 0.55, 4.5, 8);
  const pillarCapital = new THREE.BoxGeometry(1.0, 0.4, 1.0);

  for (let z = -segmentLength / 2 + 5; z <= segmentLength / 2; z += 15) {
    for (const side of [-5.2, 5.2]) {
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(side, 0, z);

      const shaft = new THREE.Mesh(pillarGeom, curbMat);
      shaft.position.y = 2.25;
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      pillarGroup.add(shaft);

      const cap = new THREE.Mesh(pillarCapital, curbMat);
      cap.position.y = 4.4;
      cap.castShadow = true;
      pillarGroup.add(cap);

      // Hanging Bronze Brazier with flame
      const brazier = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.15, 0.3, 6),
        new THREE.MeshStandardMaterial({ color: 0x5c4028, metalness: 0.7, roughness: 0.3 })
      );
      brazier.position.set(side > 0 ? -0.4 : 0.4, 3.8, 0);
      pillarGroup.add(brazier);

      // Glowing flame core
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffaa22 })
      );
      flame.position.set(side > 0 ? -0.4 : 0.4, 4.05, 0);
      pillarGroup.add(flame);

      group.add(pillarGroup);
    }
  }

  // Perimeter Jungle Foliage
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x1f4720,
    roughness: 0.9,
    metalness: 0.05,
  });

  const frondGeom = new THREE.ConeGeometry(1.6, 3.8, 6);
  for (let z = -segmentLength / 2 + 2; z <= segmentLength / 2; z += 10) {
    for (const side of [-8.5, 8.5]) {
      const tree = new THREE.Mesh(frondGeom, foliageMat);
      tree.position.set(side + (Math.random() - 0.5) * 1.5, 1.9, z + (Math.random() - 0.5) * 2);
      tree.scale.set(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4);
      tree.castShadow = true;
      group.add(tree);
    }
  }

  return group;
}

// 4. OBSTACLE MODELS
export function createObstacle(
  type: ObstacleType,
  lane: -1 | 0 | 1,
  textures: {
    wood: THREE.Texture;
    stoneWall: THREE.Texture;
    hazard: THREE.Texture;
  }
): { group: THREE.Group; type: ObstacleType; lane: -1 | 0 | 1; boundingBox: THREE.Box3 } {
  const group = new THREE.Group();
  const laneX = lane * 2.8;
  group.position.set(laneX, 0, 0);

  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.wood,
    roughness: 0.8,
    metalness: 0.1,
  });

  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stoneWall,
    roughness: 0.75,
    metalness: 0.2,
  });

  const hazardMat = new THREE.MeshStandardMaterial({
    map: textures.hazard,
    roughness: 0.6,
    metalness: 0.3,
  });

  if (type === 'TREE_HURDLE') {
    // Low obstacle: Jump over. Height ~ 0.85
    const logGeom = new THREE.CylinderGeometry(0.35, 0.38, 2.6, 8);
    const log = new THREE.Mesh(logGeom, woodMat);
    log.rotation.z = Math.PI / 2;
    log.position.y = 0.45;
    log.castShadow = true;
    group.add(log);

    // Stone support posts
    for (const sx of [-1.2, 1.2]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.35), stoneMat);
      post.position.set(sx, 0.45, 0);
      post.castShadow = true;
      group.add(post);
    }
  } else if (type === 'STONE_ARCH') {
    // High obstacle: Slide under. Bottom clearance ~ 1.45, arch beam at Y = 2.1
    const beam = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.8, 0.6), hazardMat);
    beam.position.y = 2.2;
    beam.castShadow = true;
    group.add(beam);

    // Side pillars
    for (const sx of [-1.25, 1.25]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.6, 0.5), stoneMat);
      col.position.set(sx, 1.3, 0);
      col.castShadow = true;
      group.add(col);
    }
  } else if (type === 'FIRE_JET') {
    // Floor burner box with fiery glow
    const burner = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 2.4), hazardMat);
    burner.position.y = 0.1;
    burner.castShadow = true;
    group.add(burner);

    // Flame core
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff3700 });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.8, 6), flameMat);
    flame.position.y = 0.95;
    group.add(flame);
  } else if (type === 'SPIKE_ROLLER') {
    // Spiked cylinder log
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 2.5, 8), woodMat);
    roller.rotation.z = Math.PI / 2;
    roller.position.y = 0.55;
    roller.castShadow = true;
    group.add(roller);

    // Golden spikes protruding
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.9, roughness: 0.2 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      for (const sx of [-0.8, -0.3, 0.3, 0.8]) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), spikeMat);
        spike.position.set(sx, 0.55 + Math.sin(angle) * 0.4, Math.cos(angle) * 0.4);
        spike.rotation.x = angle;
        group.add(spike);
      }
    }
  } else if (type === 'BROKEN_FLOOR') {
    // Pit / chasm hole
    const pitVoid = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.1, 3.2),
      new THREE.MeshBasicMaterial({ color: 0x050403 })
    );
    pitVoid.position.y = 0.05;
    group.add(pitVoid);

    // Crumbled rock borders
    for (const rz of [-1.5, 1.5]) {
      const rock = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 0.3), stoneMat);
      rock.position.set(0, 0.15, rz);
      group.add(rock);
    }
  } else {
    // TEMPLE_PILLAR (Standing obstacle occupying lane)
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 3.2, 8), stoneMat);
    pillar.position.y = 1.6;
    pillar.castShadow = true;
    group.add(pillar);

    // Fallen ruins chunks at base
    const chunk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), stoneMat);
    chunk.position.set(0.3, 0.2, 0.3);
    group.add(chunk);
  }

  const boundingBox = new THREE.Box3().setFromObject(group);
  return { group, type, lane, boundingBox };
}

// 5. COLLECTIBLES: COIN, GEM, AND POWER-UP TOKENS
export function createCoin(texture: THREE.Texture): THREE.Group {
  const group = new THREE.Group();

  const goldMat = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffd700,
    metalness: 0.9,
    roughness: 0.2,
  });

  const coinGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16);
  const coin = new THREE.Mesh(coinGeom, goldMat);
  coin.rotation.x = Math.PI / 2;
  coin.castShadow = true;
  group.add(coin);

  return group;
}

export function createGem(): THREE.Group {
  const group = new THREE.Group();

  const gemMat = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    metalness: 0.1,
    roughness: 0.1,
    emissive: 0x00aa55,
    emissiveIntensity: 0.6,
  });

  const geom = new THREE.OctahedronGeometry(0.45, 0);
  const gem = new THREE.Mesh(geom, gemMat);
  group.add(gem);

  return group;
}

export function createPowerUpItem(type: PowerUpType): THREE.Group {
  const group = new THREE.Group();

  // Spinning outer energy ring
  const ringMat = new THREE.MeshBasicMaterial({
    color:
      type === 'MAGNET'
        ? 0xffaa00
        : type === 'SHIELD'
        ? 0x00bfff
        : type === 'BOOST'
        ? 0xff3b30
        : 0xbf5af2,
    wireframe: true,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.04, 8, 16), ringMat);
  group.add(ring);

  // Core icon
  if (type === 'MAGNET') {
    // Horseshoe shape
    const magnet = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.09, 8, 12, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xff4500, metalness: 0.8, roughness: 0.2 })
    );
    magnet.rotation.z = Math.PI;
    group.add(magnet);
  } else if (type === 'SHIELD') {
    // Aegis crest
    const shield = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.6, 5),
      new THREE.MeshStandardMaterial({ color: 0x00c8ff, metalness: 0.7, roughness: 0.2 })
    );
    shield.rotation.z = Math.PI;
    group.add(shield);
  } else if (type === 'BOOST') {
    // Winged rocket / boots
    const boost = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.7, 4),
      new THREE.MeshStandardMaterial({ color: 0xff3300, metalness: 0.8, roughness: 0.2 })
    );
    group.add(boost);
  } else {
    // 2X MULTIPLIER (Double Ruby)
    const ruby = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35),
      new THREE.MeshStandardMaterial({ color: 0xe0245e, emissive: 0x880022, roughness: 0.1 })
    );
    group.add(ruby);
  }

  return group;
}
