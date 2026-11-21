export class SoundFX {
  constructor() {
    this.ctx = null;
    this.musicPlaying = false;
    this.musicNodes = [];
    this.fluteTimer = null;
  }
  _init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  toggleAmbientMusic() {
    this._init();
    if (this.musicPlaying) {
      this._stopAmbientMusic();
      return false;
    } else {
      this._startAmbientMusic();
      return true;
    }
  }
  _startAmbientMusic() {
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.11, now + 1.5);
    masterGain.connect(this.ctx.destination);
    const droneFreqs = [130.81, 196.0, 261.63];
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(480, now);
    filter.connect(masterGain);
    droneFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = idx === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx - 1) * 4, now);
      oscGain.gain.setValueAtTime(idx === 0 ? 0.35 : 0.25, now);
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(now);
      this.musicNodes.push(osc, oscGain);
    });
    this.musicNodes.push(filter, masterGain);
    const fluteScale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const playFluteNote = () => {
      if (!this.musicPlaying) return;
      const t = this.ctx.currentTime;
      const noteFreq = fluteScale[Math.floor(Math.random() * fluteScale.length)];
      const duration = 1.6 + Math.random() * 1.4;
      const fluteOsc = this.ctx.createOscillator();
      const fluteGain = this.ctx.createGain();
      fluteOsc.type = 'sine';
      fluteOsc.frequency.setValueAtTime(noteFreq * 0.985, t);
      fluteOsc.frequency.exponentialRampToValueAtTime(noteFreq, t + 0.18);
      fluteGain.gain.setValueAtTime(0.0005, t);
      fluteGain.gain.linearRampToValueAtTime(0.055, t + 0.35);
      fluteGain.gain.exponentialRampToValueAtTime(0.0005, t + duration);
      fluteOsc.connect(fluteGain);
      fluteGain.connect(this.ctx.destination);
      fluteOsc.start(t);
      fluteOsc.stop(t + duration + 0.05);
      this.fluteTimer = setTimeout(playFluteNote, (duration + 0.8 + Math.random() * 1.8) * 1000);
    };
    this.fluteTimer = setTimeout(playFluteNote, 1200);
  }
  _stopAmbientMusic() {
    this.musicPlaying = false;
    if (this.fluteTimer) {
      clearTimeout(this.fluteTimer);
      this.fluteTimer = null;
    }
    for (const node of this.musicNodes) {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
      }
    }
    this.musicNodes = [];
  }
  playBowArrow() {
    this._init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.09);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }
  playAstra(skillLevel = 1) {
    this._init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = skillLevel >= 3 ? 'sawtooth' : 'triangle';
    const startFreq = 720 + skillLevel * 140;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.16);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }
  playExplosion() {
    this._init();
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.28;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.exponentialRampToValueAtTime(65, now + 0.28);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }
  playTempleChime() {
    this._init();
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);
      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.11, now + idx * 0.06 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.06 + 0.9);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.95);
    });
  }
}
