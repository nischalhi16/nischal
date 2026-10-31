/**
 * Procedural Web Audio Synthesizer for Temple Escape 3D
 * Generates all sound effects and ambient tribal drums purely in-code with 0 external dependencies.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private ambientTimer: number | null = null;
  private isAmbientPlaying: boolean = false;
  private coinCombo: number = 0;
  private lastCoinTime: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
    const savedMute = localStorage.getItem('temple_run_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.6;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('temple_run_muted', String(this.isMuted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // Jump swoosh
  public playJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.18);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(900, t + 0.18);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Slide swoosh
  public playSlide() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(250, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  // Footstep thud
  public playFootstep() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const pitch = 70 + Math.random() * 20;
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.05);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Coin collect ping (dynamic combo scale)
  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const now = performance.now();
    if (now - this.lastCoinTime < 500) {
      this.coinCombo = Math.min(this.coinCombo + 1, 8);
    } else {
      this.coinCombo = 0;
    }
    this.lastCoinTime = now;

    const t = this.ctx.currentTime;
    const baseFreq = 987.77; // B5
    // Pentatonic scale multipliers
    const scale = [1.0, 1.122, 1.26, 1.498, 1.682, 2.0, 2.245, 2.52, 2.996];
    const freq = baseFreq * (scale[this.coinCombo] || 1.0);

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.18);
    osc2.stop(t + 0.18);
  }

  // Jade Gem pickup
  public playGem() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C Major arpeggio
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const noteTime = t + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.28);
    });
  }

  // Power-up activation fanfare
  public playPowerUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const chord = [440, 554.37, 659.25, 880]; // A Major
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const noteTime = t + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, noteTime);
      filter.frequency.exponentialRampToValueAtTime(3000, noteTime + 0.3);

      gain.gain.setValueAtTime(0.15, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.42);
    });
  }

  // Shield break
  public playShieldBreak() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.2);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Demon Roar
  public playDemonRoar() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const mainGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.6);

    mod.type = 'sawtooth';
    mod.frequency.setValueAtTime(35, t);
    modGain.gain.setValueAtTime(80, t);

    mod.connect(modGain);
    modGain.connect(osc.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.value = 5;

    mainGain.gain.setValueAtTime(0.05, t);
    mainGain.gain.linearRampToValueAtTime(0.4, t + 0.1);
    mainGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(this.masterGain);

    mod.start(t);
    osc.start(t);
    mod.stop(t + 0.7);
    osc.stop(t + 0.7);
  }

  // Crash / Game Over Impact
  public playCrash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Sub bass punch
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(180, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    sub.connect(subGain);
    subGain.connect(this.masterGain);

    // Stone rubble burst
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, t);
    filter.Q.value = 2;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    sub.start(t);
    noise.start(t);
    sub.stop(t + 0.5);
  }

  // Start procedural ambient tribal drums
  public startAmbient() {
    if (this.isAmbientPlaying) return;
    this.isAmbientPlaying = true;
    let step = 0;

    const tickAmbient = () => {
      if (!this.isAmbientPlaying) return;
      if (!this.isMuted && this.ctx && this.masterGain) {
        const t = this.ctx.currentTime;
        // Beat 0: Deep tribal low drum
        // Beat 1: Shaker
        // Beat 2: Mid tom
        // Beat 3: Double shaker
        if (step % 4 === 0) {
          const drum = this.ctx.createOscillator();
          const dGain = this.ctx.createGain();
          drum.frequency.setValueAtTime(80, t);
          drum.frequency.exponentialRampToValueAtTime(45, t + 0.12);
          dGain.gain.setValueAtTime(0.18, t);
          dGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
          drum.connect(dGain);
          dGain.connect(this.masterGain);
          drum.start(t);
          drum.stop(t + 0.16);
        } else if (step % 2 === 0) {
          const drum = this.ctx.createOscillator();
          const dGain = this.ctx.createGain();
          drum.frequency.setValueAtTime(140, t);
          drum.frequency.exponentialRampToValueAtTime(80, t + 0.08);
          dGain.gain.setValueAtTime(0.1, t);
          dGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          drum.connect(dGain);
          dGain.connect(this.masterGain);
          drum.start(t);
          drum.stop(t + 0.11);
        }

        // Shaker / rhythmic rustle on every 8th note
        const bSize = Math.floor(this.ctx.sampleRate * 0.03);
        const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < bSize; i++) {
          d[i] = (Math.random() * 2 - 1) * 0.1;
        }
        const s = this.ctx.createBufferSource();
        s.buffer = b;
        const f = this.ctx.createBiquadFilter();
        f.type = 'highpass';
        f.frequency.setValueAtTime(3000, t);
        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(0.04, t);
        sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        s.connect(f);
        f.connect(sGain);
        sGain.connect(this.masterGain);
        s.start(t);
      }
      step = (step + 1) % 16;
      this.ambientTimer = window.setTimeout(tickAmbient, 220); // ~136 BPM
    };

    tickAmbient();
  }

  public stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.ambientTimer !== null) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
  }
}

export const sound = new SoundEngine();
