import {SkidFeedback} from './skid-feedback';
/** Original synthesized audio, created only after a user gesture. */
export class EngineSound {
  private context?: AudioContext;
  private master?: GainNode;
  private engine?: OscillatorNode;
  private engineGain?: GainNode;
  private undertone?: OscillatorNode;
  private windGain?: GainNode;
  private skid?: OscillatorNode;
  private skidGain?: GainNode;
  private analyser?: AnalyserNode;
  private impactGain?:GainNode;private impactCount=0;
  private muted = false;
  private engineHz = 42;
  private engineRpm = 1000;
  private engineGear = 1;
  private skidLevel = 0;
  private windLevel = 0;
  private active = false;
  readonly skidFeedback=new SkidFeedback();
  async unlock() {
    if (!this.context) {
      const context = this.context = new AudioContext();
      this.master = context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.35;
      this.analyser = context.createAnalyser();
      this.analyser.fftSize = 256;
      this.master.connect(this.analyser);
      this.analyser.connect(context.destination);
      const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600; filter.Q.value=.55;
      this.engine = context.createOscillator(); this.engine.type = 'triangle'; this.engine.frequency.value = 42;
      this.engineGain = context.createGain(); this.engineGain.gain.value = 0;
      this.engine.connect(filter); filter.connect(this.engineGain); this.engineGain.connect(this.master); this.engine.start();
      this.undertone=context.createOscillator();this.undertone.type='sine';
      const harmonicGain=context.createGain();harmonicGain.gain.value=.55;
      this.undertone.connect(harmonicGain);harmonicGain.connect(filter);this.undertone.start();
      const wind=context.createBufferSource(),buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate),data=buffer.getChannelData(0);
      let seed=71;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
      wind.buffer=buffer;wind.loop=true;
      const air=context.createBiquadFilter();air.type='lowpass';air.frequency.value=650;
      this.windGain=context.createGain();this.windGain.gain.value=0;
      wind.connect(air);air.connect(this.windGain);this.windGain.connect(this.master);wind.start();
      this.skid = context.createOscillator(); this.skid.type = 'triangle'; this.skid.frequency.value = 650;
      this.skidGain = context.createGain(); this.skidGain.gain.value = 0;
      this.skid.connect(this.skidGain); this.skidGain.connect(this.master); this.skid.start();
      this.impactGain=context.createGain();this.impactGain.gain.value=0;this.impactGain.connect(this.master);
      for(const hz of [1370,2213]){const ring=context.createOscillator();ring.type='sine';ring.frequency.value=hz;ring.connect(this.impactGain);ring.start();}
      // A tiny modulation makes sustained squeal less like a UI beep.
      const wobble = context.createOscillator(); wobble.frequency.value = 16;
      const amount = context.createGain(); amount.gain.value = 35;
      wobble.connect(amount); amount.connect(this.skid.frequency); wobble.start();
    }
    await this.context.resume();
  }
  impact(strength:number){this.impactCount++;if(!this.context||!this.impactGain)return;const now=this.context.currentTime,g=this.impactGain.gain;g.cancelScheduledValues(now);g.setValueAtTime(.12+.32*strength,now);g.exponentialRampToValueAtTime(.001,now+.28);}
  setMuted(muted: boolean) { this.muted = muted; if (this.context && this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.35, this.context.currentTime, 0.025); }
  update(speed: number, slip: number, gas: boolean,dt=1/60, drivetrain?:{rpm:number;gear:number;shiftRemaining:number;requiredSteer?:number;appliedSteer?:number},collisionSlide=0,trafficSkid=0) {
    const intensity=Math.max(trafficSkid,this.skidFeedback.update(speed,slip,dt,drivetrain?.requiredSteer,drivetrain?.appliedSteer,collisionSlide));
    this.active = true;this.engineRpm=drivetrain?.rpm??Math.min(7200,1000+speed*85);this.engineGear=drivetrain?.gear??1;
    this.engineHz = 28+this.engineRpm*1.1/60+(gas ? 3 : 0); this.skidLevel = intensity*.12;
    this.windLevel=.10*Math.min(1,(speed/(300/3.6))**2);
    if (!this.context) return;
    const now = this.context.currentTime;
    this.engine!.frequency.setTargetAtTime(this.engineHz, now, 0.08);
    this.undertone!.frequency.setTargetAtTime(this.engineHz*.5,now,.08);
    this.windGain!.gain.setTargetAtTime(this.windLevel,now,.12);
    this.engineGain!.gain.setTargetAtTime(gas ? (drivetrain?.shiftRemaining ? .15 : .22) : 0.11, now, 0.07);
    this.skid!.frequency.setTargetAtTime(510 + intensity * 250, now, 0.06);
    this.skidGain!.gain.setTargetAtTime(this.skidLevel, now, 0.08);
  }
  pause() { this.active = false;this.skidFeedback.reset();this.skidLevel = 0;this.windLevel=0; if (this.context) { this.impactGain?.gain.cancelScheduledValues(this.context.currentTime);this.impactGain?.gain.setTargetAtTime(0,this.context.currentTime,.02);this.engineGain!.gain.setTargetAtTime(0, this.context.currentTime, 0.03); this.skidGain!.gain.setTargetAtTime(0, this.context.currentTime, 0.03);this.windGain!.gain.setTargetAtTime(0,this.context.currentTime,.03); } }
  inspect() {
    let rms = 0;
    if (this.analyser) { const data = new Float32Array(this.analyser.fftSize); this.analyser.getFloatTimeDomainData(data); rms = Math.sqrt(data.reduce((sum, value) => sum + value * value, 0) / data.length); }
    return { impactCount:this.impactCount,contextState: this.context?.state ?? 'locked', muted: this.muted, active: this.active, engineHz: this.engineHz, engineRpm:this.engineRpm,gear:this.engineGear,skidIntensity:this.skidFeedback.intensity,skidLevel: this.skidLevel, windLevel:this.windLevel, rms };
  }
}
