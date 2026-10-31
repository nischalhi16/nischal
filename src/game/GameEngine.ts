import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ActivePowerUp,
  CharacterSkin,
  GameState,
  ObstacleType,
  PlayerStats,
  PowerUpType,
  RunSummary,
} from '../types';
import { sound } from '../audio/SoundEffects';
import {
  createCoinTexture,
  createEmberParticleTexture,
  createHazardRunesTexture,
  createStonePaversTexture,
  createTempleStoneTexture,
  createWoodTexture,
} from '../graphics/textures';
import {
  createCoin,
  createDemonBeastModel,
  createGem,
  createObstacle,
  createPlayerModel,
  createPowerUpItem,
  createTrackSegment,
  DemonRig,
  PlayerRig,
} from '../graphics/models';

// Pre-allocated math objects to avoid garbage collection
const _vec3 = new THREE.Vector3();
const _playerBox = new THREE.Box3();
const _obsBox = new THREE.Box3();

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number, distance: number, coins: number, multiplier: number) => void;
  onPowerUpsUpdate: (powerUps: ActivePowerUp[]) => void;
  onBeastProximityUpdate: (proximity: number) => void;
  onGameOver: (summary: RunSummary) => void;
  onStateChange: (state: GameState) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private isDisposed: boolean = false;

  // Textures cache
  private textures!: {
    stonePavers: THREE.CanvasTexture;
    stoneWall: THREE.CanvasTexture;
    wood: THREE.CanvasTexture;
    coin: THREE.CanvasTexture;
    ember: THREE.CanvasTexture;
    hazard: THREE.CanvasTexture;
  };

  // State
  private gameState: GameState = 'TITLE';
  private stats: PlayerStats;
  private skin: CharacterSkin;

  // Player state
  private playerRig!: PlayerRig;
  private playerX: number = 0;
  private targetLane: -1 | 0 | 1 = 0;
  private playerZ: number = 0;
  private playerY: number = 0;
  private isJumping: boolean = false;
  private jumpTime: number = 0;
  private isSliding: boolean = false;
  private slideTime: number = 0;
  private stumbleTimer: number = 0;
  private invincibleTimer: number = 0;
  private baseSpeed: number = 18;
  private currentSpeed: number = 18;

  // Run metrics
  private distanceRun: number = 0;
  private coinsRun: number = 0;
  private scoreRun: number = 0;
  private scoreMultiplier: number = 1;
  private powerUpsUsedCount: number = 0;
  private stumblesCount: number = 0;

  // Demon beast state
  private demonRig!: DemonRig;
  private beastDistance: number = 7.5; // distance behind player
  private beastTargetDistance: number = 7.5;

  // Active power-ups
  private activePowerUps: Map<PowerUpType, ActivePowerUp> = new Map();

  // Track Chunks
  private trackChunks: THREE.Group[] = [];
  private readonly chunkLength = 30;
  private nextChunkZ: number = 15;

  // Dynamic Objects
  private obstacles: {
    group: THREE.Group;
    type: ObstacleType;
    lane: -1 | 0 | 1;
    z: number;
    collided: boolean;
  }[] = [];

  private coins: {
    group: THREE.Group;
    z: number;
    lane: -1 | 0 | 1;
    collected: boolean;
  }[] = [];

  private gems: {
    group: THREE.Group;
    z: number;
    collected: boolean;
  }[] = [];

  private powerUpPickups: {
    group: THREE.Group;
    type: PowerUpType;
    z: number;
    collected: boolean;
  }[] = [];

  // Particles
  private dustParticles!: THREE.Points;
  private dustGeom!: THREE.BufferGeometry;
  private dustPositions!: Float32Array;
  private dustOpacities!: Float32Array;

  // Camera & Effects
  private cameraShake: number = 0;
  private hitstopTimer: number = 0;
  private lastTime: number = 0;
  private stepAccumulator: number = 0;

  // Input handling
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private swipeThreshold = 35;

  constructor(container: HTMLElement, stats: PlayerStats, skin: CharacterSkin, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.stats = stats;
    this.skin = skin;
    this.callbacks = callbacks;

    this.initRenderer();
    this.initScene();
    this.initLights();
    this.initTextures();
    this.initParticles();
    this.initEntities();
    this.initTrack();
    this.bindInputs();

    this.lastTime = performance.now();
    this.animate();
  }

  // 1. Scene & Renderer Setup
  private initRenderer() {
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    // Misty jungle temple atmosphere
    const bgColor = 0x091412;
    this.scene.background = new THREE.Color(bgColor);
    this.scene.fog = new THREE.FogExp2(bgColor, 0.015);

    const aspect = (this.container.clientWidth || window.innerWidth) / (this.container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 200);
    this.camera.position.set(0, 4.2, 7.5);

    // Studio Environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();
  }

  private initLights() {
    // Warm key directional light (casting shadows)
    const sunLight = new THREE.DirectionalLight(0xffdfa8, 1.8);
    sunLight.position.set(15, 28, 12);
    sunLight.castShadow = !this.isSoftwareGl;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 80;
    sunLight.shadow.camera.left = -16;
    sunLight.shadow.camera.right = 16;
    sunLight.shadow.camera.top = 16;
    sunLight.shadow.camera.bottom = -16;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    // Cool ambient sky / jungle canopy fill
    const hemiLight = new THREE.HemisphereLight(0x76b4a2, 0x1f2e1b, 0.9);
    this.scene.add(hemiLight);
  }

  private initTextures() {
    this.textures = {
      stonePavers: createStonePaversTexture(),
      stoneWall: createTempleStoneTexture(),
      wood: createWoodTexture(),
      coin: createCoinTexture(),
      ember: createEmberParticleTexture(),
      hazard: createHazardRunesTexture(),
    };
  }

  private initParticles() {
    // Ambient dust and flame embers
    const particleCount = 120;
    this.dustGeom = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(particleCount * 3);
    this.dustOpacities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      this.dustPositions[i * 3] = (Math.random() - 0.5) * 16;
      this.dustPositions[i * 3 + 1] = Math.random() * 6;
      this.dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      this.dustOpacities[i] = Math.random();
    }

    this.dustGeom.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.35,
      map: this.textures.ember,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffb84d,
    });

    this.dustParticles = new THREE.Points(this.dustGeom, pMat);
    this.scene.add(this.dustParticles);
  }

  private initEntities() {
    // Player
    this.playerRig = createPlayerModel(this.skin);
    this.scene.add(this.playerRig.group);
    this.playerRig.group.position.set(0, 0, 0);

    // Demon Chaser
    this.demonRig = createDemonBeastModel();
    this.scene.add(this.demonRig.group);
    this.demonRig.group.position.set(0, 0, 8);
  }

  private initTrack() {
    // Build initial sequence of chunks
    for (let i = 0; i < 7; i++) {
      const chunk = createTrackSegment(
        {
          stonePavers: this.textures.stonePavers,
          stoneWall: this.textures.stoneWall,
        },
        i
      );
      const zPos = this.nextChunkZ - i * this.chunkLength;
      chunk.position.set(0, 0, zPos);
      this.trackChunks.push(chunk);
      this.scene.add(chunk);

      // Only populate hazards on chunks further down the track
      if (i >= 2) {
        this.populateChunkContent(zPos);
      }
    }
  }

  // Populate dynamic obstacles, coins, and power-ups inside a track chunk
  private populateChunkContent(chunkZ: number) {
    const laneOptions: (-1 | 0 | 1)[] = [-1, 0, 1];
    const halfLen = this.chunkLength / 2;

    // 1. Obstacle placement (1 or 2 per chunk with fair gaps)
    const obstacleCount = Math.random() > 0.4 ? 2 : 1;
    for (let o = 0; o < obstacleCount; o++) {
      const zOffset = -halfLen + 7 + o * 14;
      const obsZ = chunkZ + zOffset;

      const types: ObstacleType[] = [
        'TREE_HURDLE',
        'STONE_ARCH',
        'FIRE_JET',
        'SPIKE_ROLLER',
        'BROKEN_FLOOR',
        'TEMPLE_PILLAR',
      ];
      const selectedType = types[Math.floor(Math.random() * types.length)];

      if (selectedType === 'FIRE_JET' || selectedType === 'BROKEN_FLOOR' || selectedType === 'TEMPLE_PILLAR') {
        // Block 1 or 2 lanes, leaving at least 1 safe lane
        const blockedLane = laneOptions[Math.floor(Math.random() * laneOptions.length)];
        const obs = createObstacle(selectedType, blockedLane, {
          wood: this.textures.wood,
          stoneWall: this.textures.stoneWall,
          hazard: this.textures.hazard,
        });
        obs.group.position.z = obsZ;
        this.scene.add(obs.group);
        this.obstacles.push({ group: obs.group, type: selectedType, lane: blockedLane, z: obsZ, collided: false });
      } else {
        // Full road obstacle (Tree hurdle, Stone Arch, or Spike roller) across all 3 lanes
        for (const lane of laneOptions) {
          const obs = createObstacle(selectedType, lane, {
            wood: this.textures.wood,
            stoneWall: this.textures.stoneWall,
            hazard: this.textures.hazard,
          });
          obs.group.position.z = obsZ;
          this.scene.add(obs.group);
          this.obstacles.push({ group: obs.group, type: selectedType, lane, z: obsZ, collided: false });
        }
      }
    }

    // 2. Coins (Arc or line of 4-6 coins)
    const coinLane = laneOptions[Math.floor(Math.random() * laneOptions.length)];
    const coinZStart = chunkZ - halfLen + 3;
    for (let c = 0; c < 5; c++) {
      const cZ = coinZStart + c * 2.2;
      const coin = createCoin(this.textures.coin);
      coin.position.set(coinLane * 2.8, 1.1, cZ);
      this.scene.add(coin);
      this.coins.push({ group: coin, z: cZ, lane: coinLane, collected: false });
    }

    // 3. Rare Jade Relic Gem (10% chance)
    if (Math.random() < 0.15) {
      const gemLane = laneOptions[Math.floor(Math.random() * laneOptions.length)];
      const gemZ = chunkZ + (Math.random() - 0.5) * (this.chunkLength - 6);
      const gem = createGem();
      gem.position.set(gemLane * 2.8, 1.4, gemZ);
      this.scene.add(gem);
      this.gems.push({ group: gem, z: gemZ, collected: false });
    }

    // 4. Power-up Token (12% chance)
    if (Math.random() < 0.18) {
      const pLane = laneOptions[Math.floor(Math.random() * laneOptions.length)];
      const pZ = chunkZ + (Math.random() - 0.5) * (this.chunkLength - 10);
      const pTypes: PowerUpType[] = ['MAGNET', 'SHIELD', 'BOOST', 'MULTIPLIER'];
      const pType = pTypes[Math.floor(Math.random() * pTypes.length)];
      const pItem = createPowerUpItem(pType);
      pItem.position.set(pLane * 2.8, 1.5, pZ);
      this.scene.add(pItem);
      this.powerUpPickups.push({ group: pItem, type: pType, z: pZ, collected: false });
    }
  }

  // 2. Input Handling
  private bindInputs() {
    const onKeyDown = (e: KeyboardEvent) => {
      if (this.gameState === 'TITLE') {
        if (e.code === 'Space' || e.code === 'Enter') {
          this.startGame();
        }
        return;
      }

      if (this.gameState === 'GAMEOVER') {
        if (e.code === 'Space' || e.code === 'KeyR') {
          this.restartGame();
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.togglePause();
        return;
      }

      if (this.gameState !== 'PLAYING') return;

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.moveLane(-1);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.moveLane(1);
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        this.jump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        this.slide();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    // Touch & Swipe gestures
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (this.gameState === 'TITLE') {
        this.startGame();
        return;
      }
      if (this.gameState === 'GAMEOVER') {
        this.restartGame();
        return;
      }
      if (this.gameState !== 'PLAYING') return;

      if (e.changedTouches.length > 0) {
        const deltaX = e.changedTouches[0].clientX - this.touchStartX;
        const deltaY = e.changedTouches[0].clientY - this.touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
          // Horizontal swipe
          if (deltaX > 0) this.moveLane(1);
          else this.moveLane(-1);
        } else if (Math.abs(deltaY) > this.swipeThreshold) {
          // Vertical swipe
          if (deltaY < 0) this.jump();
          else this.slide();
        }
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    // Resize handler
    const onResize = () => {
      if (this.isDisposed || !this.renderer) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    window.addEventListener('resize', onResize);

    // Blur handler to pause safely
    window.addEventListener('blur', () => {
      if (this.gameState === 'PLAYING') {
        this.togglePause();
      }
    });
  }

  // 3. Movement Actions
  public moveLane(direction: -1 | 1) {
    const nextLane = Math.max(-1, Math.min(1, this.targetLane + direction)) as -1 | 0 | 1;
    if (nextLane !== this.targetLane) {
      this.targetLane = nextLane;
      sound.playFootstep();
    }
  }

  public jump() {
    if (this.isJumping) return;
    this.isJumping = true;
    this.jumpTime = 0;
    this.isSliding = false;
    sound.playJump();
  }

  public slide() {
    if (this.isSliding) return;
    this.isSliding = true;
    this.slideTime = 0;
    if (this.isJumping) {
      // Fast fall down from jump to slide
      this.isJumping = false;
      this.playerY = 0;
    }
    sound.playSlide();
  }

  // 4. Game State Transitions
  public startGame() {
    this.gameState = 'PLAYING';
    this.callbacks.onStateChange('PLAYING');
    sound.startAmbient();
  }

  public togglePause() {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      this.callbacks.onStateChange('PAUSED');
      sound.stopAmbient();
    } else if (this.gameState === 'PAUSED') {
      this.gameState = 'PLAYING';
      this.callbacks.onStateChange('PLAYING');
      this.lastTime = performance.now();
      sound.startAmbient();
    }
  }

  public restartGame() {
    // Reset player position
    this.playerX = 0;
    this.targetLane = 0;
    this.playerZ = 0;
    this.playerY = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.stumbleTimer = 0;
    this.invincibleTimer = 0;
    this.baseSpeed = 18;
    this.currentSpeed = 18;

    // Reset metrics
    this.distanceRun = 0;
    this.coinsRun = 0;
    this.scoreRun = 0;
    this.scoreMultiplier = 1;
    this.powerUpsUsedCount = 0;
    this.stumblesCount = 0;

    // Reset beast
    this.beastDistance = 7.5;
    this.beastTargetDistance = 7.5;

    // Clear active powerups
    this.activePowerUps.clear();
    this.callbacks.onPowerUpsUpdate([]);

    // Clear dynamic entities
    for (const obs of this.obstacles) this.scene.remove(obs.group);
    this.obstacles = [];
    for (const c of this.coins) this.scene.remove(c.group);
    this.coins = [];
    for (const g of this.gems) this.scene.remove(g.group);
    this.gems = [];
    for (const p of this.powerUpPickups) this.scene.remove(p.group);
    this.powerUpPickups = [];

    // Reset track chunks
    for (const chunk of this.trackChunks) this.scene.remove(chunk);
    this.trackChunks = [];
    this.nextChunkZ = 15;
    this.initTrack();

    this.gameState = 'PLAYING';
    this.callbacks.onStateChange('PLAYING');
    this.lastTime = performance.now();
    sound.startAmbient();
  }

  public setSkin(skin: CharacterSkin) {
    this.skin = skin;
    this.scene.remove(this.playerRig.group);
    this.playerRig = createPlayerModel(skin);
    this.scene.add(this.playerRig.group);
    this.playerRig.group.position.set(this.playerX, this.playerY, this.playerZ);
  }

  public setStats(stats: PlayerStats) {
    this.stats = stats;
  }

  // 5. Main Simulation Loop
  private animate = () => {
    if (this.isDisposed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05); // Frame delta clamp

    // Hitstop freeze
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(this.animate);
      return;
    }

    if (this.gameState === 'PLAYING') {
      this.updateSimulation(dt, now / 1000);
    } else if (this.gameState === 'TITLE') {
      this.updateTitleMode(now / 1000);
    } else if (this.gameState === 'GAMEOVER') {
      this.updateGameOverMode(dt, now / 1000);
    }

    // Always update dust / flame particles
    this.updateParticles(dt);

    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(this.animate);
  };

  private updateSimulation(dt: number, time: number) {
    // 1. Speed ramp: gradual speed increase as distance grows
    this.baseSpeed = 18 + Math.min(16, this.distanceRun * 0.015);
    const hasBoost = this.activePowerUps.has('BOOST');
    this.currentSpeed = hasBoost ? this.baseSpeed * 1.6 : this.baseSpeed;

    // Advance forward
    const forwardStep = this.currentSpeed * dt;
    this.playerZ -= forwardStep;
    this.distanceRun += forwardStep * 0.5;

    // Footstep audio rhythm
    this.stepAccumulator += dt * this.currentSpeed;
    if (this.stepAccumulator > 3.8 && !this.isJumping) {
      this.stepAccumulator = 0;
      sound.playFootstep();
    }

    // 2. Smooth lane shift with exponential damping & banking tilt
    const targetX = this.targetLane * 2.8;
    this.playerX = THREE.MathUtils.damp(this.playerX, targetX, 15, dt);
    const laneDelta = targetX - this.playerX;
    this.playerRig.torso.rotation.z = -laneDelta * 0.12;

    // 3. Jump physics
    if (this.isJumping) {
      this.jumpTime += dt;
      const jumpDuration = 0.75;
      if (this.jumpTime < jumpDuration) {
        const normJump = this.jumpTime / jumpDuration;
        // Parabolic arc: 4 * h * norm * (1 - norm)
        this.playerY = 4 * 2.5 * normJump * (1 - normJump);
      } else {
        this.isJumping = false;
        this.playerY = 0;
      }
    } else {
      this.playerY = 0;
    }

    // 4. Slide physics
    if (this.isSliding) {
      this.slideTime += dt;
      const slideDuration = 0.8;
      if (this.slideTime >= slideDuration) {
        this.isSliding = false;
      }
    }

    // 5. Stumble timer decay
    if (this.stumbleTimer > 0) {
      this.stumbleTimer -= dt;
      this.beastTargetDistance = 2.6; // Beast closes right in!
    } else {
      this.beastTargetDistance = 7.5; // Beast retreats back slowly
    }

    // 6. Invincibility timer decay
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      this.playerRig.group.visible = Math.floor(time * 20) % 2 === 0;
    } else {
      this.playerRig.group.visible = true;
    }

    // 7. Power-up timer decay & magnet logic
    const powerUpsList: ActivePowerUp[] = [];
    const magnetActive = this.activePowerUps.has('MAGNET');

    this.activePowerUps.forEach((pup, type) => {
      pup.duration -= dt;
      if (pup.duration <= 0) {
        this.activePowerUps.delete(type);
      } else {
        powerUpsList.push({ ...pup });
      }
    });
    this.callbacks.onPowerUpsUpdate(powerUpsList);

    // Score calculation
    const mult = (this.activePowerUps.has('MULTIPLIER') ? 2 : 1) * this.scoreMultiplier;
    this.scoreRun += Math.floor(forwardStep * mult * 2);

    // Update player model transform & animation
    this.playerRig.group.position.set(this.playerX, this.playerY, this.playerZ);
    const animState = this.stumbleTimer > 0
      ? 'STUMBLE'
      : this.isJumping
      ? 'JUMP'
      : this.isSliding
      ? 'SLIDE'
      : 'RUN';
    this.playerRig.updateAnimation(time, this.currentSpeed, animState);

    // 8. Demon Beast Follower
    this.beastDistance = THREE.MathUtils.damp(this.beastDistance, this.beastTargetDistance, 2.5, dt);
    this.demonRig.group.position.set(
      THREE.MathUtils.damp(this.demonRig.group.position.x, this.playerX, 6, dt),
      0,
      this.playerZ + this.beastDistance
    );
    this.demonRig.updateAnimation(time, this.currentSpeed, this.beastDistance);

    // Beast proximity callback (0 = safe, 1 = right behind)
    const proximity = Math.max(0, Math.min(1, (8 - this.beastDistance) / 5.5));
    this.callbacks.onBeastProximityUpdate(proximity);

    // 9. Track chunk recycling
    const playerChunkZ = Math.floor(this.playerZ / this.chunkLength) * this.chunkLength;
    const lastChunk = this.trackChunks[this.trackChunks.length - 1];
    if (lastChunk && lastChunk.position.z > this.playerZ - 4 * this.chunkLength) {
      // Spawn new chunk ahead
      const nextZ = lastChunk.position.z - this.chunkLength;
      const newChunk = createTrackSegment(
        {
          stonePavers: this.textures.stonePavers,
          stoneWall: this.textures.stoneWall,
        },
        Math.floor(-nextZ / this.chunkLength)
      );
      newChunk.position.set(0, 0, nextZ);
      this.trackChunks.push(newChunk);
      this.scene.add(newChunk);

      this.populateChunkContent(nextZ);

      // Remove chunks that are far behind player
      if (this.trackChunks.length > 9) {
        const oldChunk = this.trackChunks.shift();
        if (oldChunk) this.scene.remove(oldChunk);
      }
    }

    // 10. Coin, Gem, and Power-Up pickups
    // Magnet pull
    for (const c of this.coins) {
      if (c.collected) continue;
      // Magnet pull towards player
      if (magnetActive) {
        const distZ = Math.abs(c.z - this.playerZ);
        if (distZ < 15) {
          c.group.position.x = THREE.MathUtils.damp(c.group.position.x, this.playerX, 10, dt);
          c.group.position.y = THREE.MathUtils.damp(c.group.position.y, this.playerY + 1.0, 10, dt);
          c.group.position.z = THREE.MathUtils.damp(c.group.position.z, this.playerZ, 10, dt);
        }
      }

      // Check collection
      const dx = c.group.position.x - this.playerX;
      const dy = c.group.position.y - (this.playerY + 0.9);
      const dz = c.group.position.z - this.playerZ;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 1.4) {
        c.collected = true;
        this.scene.remove(c.group);
        this.coinsRun++;
        this.scoreRun += 50 * mult;
        sound.playCoin();
      } else {
        // Spin coin
        c.group.rotation.y += dt * 4;
      }
    }

    // Gems
    for (const g of this.gems) {
      if (g.collected) continue;
      const dz = Math.abs(g.z - this.playerZ);
      const dx = Math.abs(g.group.position.x - this.playerX);
      if (dz < 1.4 && dx < 1.4) {
        g.collected = true;
        this.scene.remove(g.group);
        this.coinsRun += 5;
        this.scoreRun += 500 * mult;
        sound.playGem();
      } else {
        g.group.rotation.y += dt * 3;
        g.group.position.y = 1.4 + Math.sin(time * 5) * 0.15;
      }
    }

    // Power-up pickups
    for (const p of this.powerUpPickups) {
      if (p.collected) continue;
      const dz = Math.abs(p.z - this.playerZ);
      const dx = Math.abs(p.group.position.x - this.playerX);
      if (dz < 1.5 && dx < 1.4) {
        p.collected = true;
        this.scene.remove(p.group);
        this.activatePowerUp(p.type);
      } else {
        p.group.rotation.y += dt * 2.5;
        p.group.position.y = 1.5 + Math.sin(time * 4) * 0.2;
      }
    }

    // Cleanup offscreen items
    this.coins = this.coins.filter((c) => {
      if (c.z > this.playerZ + 20) {
        this.scene.remove(c.group);
        return false;
      }
      return !c.collected;
    });

    this.gems = this.gems.filter((g) => {
      if (g.z > this.playerZ + 20) {
        this.scene.remove(g.group);
        return false;
      }
      return !g.collected;
    });

    this.powerUpPickups = this.powerUpPickups.filter((p) => {
      if (p.z > this.playerZ + 20) {
        this.scene.remove(p.group);
        return false;
      }
      return !p.collected;
    });

    // 11. Obstacle Collisions
    for (const obs of this.obstacles) {
      if (obs.collided) continue;
      if (obs.z > this.playerZ + 15) {
        continue;
      }

      // Check proximity along Z
      const distZ = Math.abs(obs.z - this.playerZ);
      if (distZ < 1.1) {
        // Lane check
        const inLane = Math.abs(obs.group.position.x - this.playerX) < 1.1;

        if (inLane) {
          // Check vertical / acrobatic avoidance:
          let avoided = false;

          if (obs.type === 'TREE_HURDLE' || obs.type === 'SPIKE_ROLLER' || obs.type === 'BROKEN_FLOOR') {
            // Can be jumped over! Required Y height >= 1.2
            if (this.playerY >= 1.2) {
              avoided = true;
            }
          } else if (obs.type === 'STONE_ARCH') {
            // Can be slid under! Required sliding state
            if (this.isSliding) {
              avoided = true;
            }
          }

          if (!avoided) {
            obs.collided = true;
            this.handlePlayerCollision(obs.type);
          }
        }
      }
    }

    // Cleanup old obstacles
    this.obstacles = this.obstacles.filter((o) => {
      if (o.z > this.playerZ + 25) {
        this.scene.remove(o.group);
        return false;
      }
      return true;
    });

    // 12. Camera Follow & Screen Shake
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 3.5);
    }
    const shakeX = (Math.random() - 0.5) * this.cameraShake * 0.45;
    const shakeY = (Math.random() - 0.5) * this.cameraShake * 0.45;

    // Follow camera smoothly
    const targetCamX = this.playerX * 0.6 + shakeX;
    const targetCamY = 4.2 + (this.playerY * 0.5) + shakeY;
    const targetCamZ = this.playerZ + 7.8;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 10, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 10, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 20, dt);

    // Look slightly ahead of player
    _vec3.set(this.playerX * 0.3, this.playerY * 0.3 + 1.2, this.playerZ - 12);
    this.camera.lookAt(_vec3);

    // Speed FOV dynamic zoom
    const targetFOV = hasBoost ? 78 : 65 + (this.currentSpeed - 18) * 0.5;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFOV, 5, dt);
    this.camera.updateProjectionMatrix();

    // 13. Callbacks for HUD
    this.callbacks.onScoreUpdate(
      Math.floor(this.scoreRun),
      Math.floor(this.distanceRun),
      this.coinsRun,
      mult
    );
  }

  // Handle Collision with Obstacle
  private handlePlayerCollision(type: ObstacleType) {
    if (this.invincibleTimer > 0) return;

    // 1. Boost invulnerability: plow straight through!
    if (this.activePowerUps.has('BOOST')) {
      this.cameraShake = 0.4;
      sound.playCrash();
      return;
    }

    // 2. Shield: absorbs the blow!
    if (this.activePowerUps.has('SHIELD')) {
      this.activePowerUps.delete('SHIELD');
      this.callbacks.onPowerUpsUpdate(Array.from(this.activePowerUps.values()));
      sound.playShieldBreak();
      this.cameraShake = 0.5;
      this.invincibleTimer = 1.5;
      this.hitstopTimer = 0.05; // 50ms punchy hitstop
      return;
    }

    // 3. Stumble vs Fatal Crash
    // If beast is already close (< 4m), any obstacle hit is fatal!
    if (this.beastDistance < 4.2) {
      this.triggerGameOver();
    } else {
      // First stumble: beast roars and surges forward!
      this.stumbleTimer = 2.5;
      this.stumblesCount++;
      this.cameraShake = 0.6;
      this.hitstopTimer = 0.04;
      sound.playDemonRoar();
    }
  }

  private triggerGameOver() {
    this.gameState = 'GAMEOVER';
    this.callbacks.onStateChange('GAMEOVER');
    sound.stopAmbient();
    sound.playCrash();
    sound.playDemonRoar();
    this.cameraShake = 1.0;

    const isNewHigh = this.scoreRun > this.stats.highScore;
    const summary: RunSummary = {
      distance: Math.floor(this.distanceRun),
      coins: this.coinsRun,
      score: Math.floor(this.scoreRun),
      isNewHigh,
      powerUpsUsed: this.powerUpsUsedCount,
      stumbles: this.stumblesCount,
    };

    this.callbacks.onGameOver(summary);
  }

  private activatePowerUp(type: PowerUpType) {
    sound.playPowerUp();
    this.powerUpsUsedCount++;

    // Calculate upgraded duration
    let maxDur = 10;
    if (type === 'MAGNET') {
      maxDur = 8 + (this.stats.upgrades.magnetDuration - 1) * 2.5;
    } else if (type === 'SHIELD') {
      maxDur = 12 + (this.stats.upgrades.shieldDuration - 1) * 3;
    } else if (type === 'BOOST') {
      maxDur = 5 + (this.stats.upgrades.boostSpeed - 1) * 1.5;
    } else if (type === 'MULTIPLIER') {
      maxDur = 12 + (this.stats.upgrades.coinMultiplier - 1) * 3;
    }

    this.activePowerUps.set(type, {
      type,
      duration: maxDur,
      maxDuration: maxDur,
    });
  }

  // Title Screen mode: atmospheric live camera pan & hero centerpiece holding golden relic
  private updateTitleMode(time: number) {
    this.playerRig.group.position.set(0, 0, 0);
    this.playerRig.updateAnimation(time, 0, 'TITLE');

    // Lurking beast in the shadows behind
    this.demonRig.group.position.set(0, 0, 7.5);
    this.demonRig.updateAnimation(time, 0, 8);

    // Orbiting slow cinematic camera
    const orbitRadius = 6.5;
    const camAngle = time * 0.25;
    this.camera.position.set(
      Math.sin(camAngle) * orbitRadius,
      2.8 + Math.sin(time * 0.5) * 0.3,
      Math.cos(camAngle) * orbitRadius
    );
    this.camera.lookAt(0, 1.4, 0);
  }

  // Game Over mode: dramatic freeze/pan around the fallen hero and triumphant beast
  private updateGameOverMode(dt: number, time: number) {
    // Beast standing over hero
    this.demonRig.group.position.set(this.playerX, 0, this.playerZ + 2.0);
    this.demonRig.updateAnimation(time, 0, 2);

    // Cinematic slow rotation
    const rotSpeed = 0.4;
    const radius = 5.5;
    this.camera.position.x = this.playerX + Math.sin(time * rotSpeed) * radius;
    this.camera.position.y = 2.4;
    this.camera.position.z = this.playerZ + Math.cos(time * rotSpeed) * radius;
    this.camera.lookAt(this.playerX, 1.0, this.playerZ);
  }

  private updateParticles(dt: number) {
    // Scroll and bob ambient dust / embers
    const pos = this.dustPositions;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] += dt * 0.4;
      if (pos[i + 1] > 6) {
        pos[i + 1] = 0.2;
      }
      // Follow player depth
      if (pos[i + 2] > this.playerZ + 30) {
        pos[i + 2] = this.playerZ - 30;
      }
    }
    this.dustGeom.attributes.position.needsUpdate = true;
  }

  public dispose() {
    this.isDisposed = true;
    sound.stopAmbient();
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
  }
}
