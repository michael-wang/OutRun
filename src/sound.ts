/** Original synthesized audio, created only after a user gesture. */
export class EngineSound {
  private context?: AudioContext;
  private master?: GainNode;
  private engine?: OscillatorNode;
  private engineGain?: GainNode;
  private skid?: OscillatorNode;
  private skidGain?: GainNode;
  private analyser?: AnalyserNode;
  private muted = false;
  private engineHz = 42;
  private skidLevel = 0;
  private active = false;
  async unlock() {
    if (!this.context) {
      const context = this.context = new AudioContext();
      this.master = context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.35;
      this.analyser = context.createAnalyser();
      this.analyser.fftSize = 256;
      this.master.connect(this.analyser);
      this.analyser.connect(context.destination);
      const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1200;
      this.engine = context.createOscillator(); this.engine.type = 'sawtooth'; this.engine.frequency.value = 42;
      this.engineGain = context.createGain(); this.engineGain.gain.value = 0;
      this.engine.connect(filter); filter.connect(this.engineGain); this.engineGain.connect(this.master); this.engine.start();
      this.skid = context.createOscillator(); this.skid.type = 'triangle'; this.skid.frequency.value = 1500;
      this.skidGain = context.createGain(); this.skidGain.gain.value = 0;
      this.skid.connect(this.skidGain); this.skidGain.connect(this.master); this.skid.start();
      // A tiny modulation makes sustained squeal less like a UI beep.
      const wobble = context.createOscillator(); wobble.frequency.value = 31;
      const amount = context.createGain(); amount.gain.value = 95;
      wobble.connect(amount); amount.connect(this.skid.frequency); wobble.start();
    }
    await this.context.resume();
  }
  setMuted(muted: boolean) { this.muted = muted; if (this.context && this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.35, this.context.currentTime, 0.025); }
  update(speed: number, slip: number, gas: boolean) {
    this.active = true; this.engineHz = 42 + speed * 2.7 + (gas ? 18 : 0); this.skidLevel = slip > 0.15 ? Math.min(0.22, (slip - 0.15) * 0.32) : 0;
    if (!this.context) return;
    const now = this.context.currentTime;
    this.engine!.frequency.setTargetAtTime(this.engineHz, now, 0.08);
    this.engineGain!.gain.setTargetAtTime(gas ? 0.22 : 0.11, now, 0.07);
    this.skid!.frequency.setTargetAtTime(1250 + slip * 600, now, 0.06);
    this.skidGain!.gain.setTargetAtTime(this.skidLevel, now, 0.045);
  }
  pause() { this.active = false; this.skidLevel = 0; if (this.context) { this.engineGain!.gain.setTargetAtTime(0, this.context.currentTime, 0.03); this.skidGain!.gain.setTargetAtTime(0, this.context.currentTime, 0.03); } }
  inspect() {
    let rms = 0;
    if (this.analyser) { const data = new Float32Array(this.analyser.fftSize); this.analyser.getFloatTimeDomainData(data); rms = Math.sqrt(data.reduce((sum, value) => sum + value * value, 0) / data.length); }
    return { contextState: this.context?.state ?? 'locked', muted: this.muted, active: this.active, engineHz: this.engineHz, skidLevel: this.skidLevel, rms };
  }
}
