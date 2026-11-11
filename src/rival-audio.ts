/** Nearby rival engine + tire sound. Three recycled spatial voices, no per-car AudioContext. */
export interface RivalAudioState {
 id:string;distance:number;lateral:number;speed:number;rpm:number;slip:number;
 braking:boolean;finishTime:number|null;
}
export interface RivalAudioListener {distance:number;lateral:number;speed:number}
export interface RivalMix {id:string;distance:number;pan:number;gain:number;doppler:number;engineHz:number;skid:number}
export const RIVAL_AUDIO_MAX_VOICES=3;
export const RIVAL_AUDIO_RADIUS=105;
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));

/** Pure deterministic mix for testing; longitudinal distance is along the actual road. */
export function rivalAudioMix(listener:RivalAudioListener,cars:readonly RivalAudioState[],burnout=false):RivalMix[]{
 const result:RivalMix[]=[];
 for(const car of cars){
  if(car.finishTime!==null)continue;
  const dz=car.distance-listener.distance,dx=car.lateral-listener.lateral;
  const distance=Math.hypot(dz,dx);
  if(distance>RIVAL_AUDIO_RADIUS)continue;
  const closing=-Math.sign(dz)*(car.speed-listener.speed)*1.5;
  const doppler=clamp(1+closing/330,.84,1.16);
  const pan=clamp(dx/Math.max(3,Math.abs(dz)*.30+3),-.92,.92);
  const gain=.17/(1+(distance/23)**2);
  const rpm=burnout&&car.speed<4?4400:clamp(car.rpm||1100,850,7800);
  result.push({id:car.id,distance,pan,gain,doppler,engineHz:(28+rpm*1.1/60)*doppler,
   skid:clamp(Math.max(car.slip,burnout&&car.speed<4 ? .65 : 0),0,1)});
 }
 result.sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id));
 return result.slice(0,RIVAL_AUDIO_MAX_VOICES);
}
interface Voice {
 engine:OscillatorNode;undertone:OscillatorNode;noise:AudioBufferSourceNode;
 engineGain:GainNode;skidGain:GainNode;pan:StereoPannerNode;filter:BiquadFilterNode;
 id?:string;
}
export class RivalAudio {
 private readonly voices:Voice[]=[];
 private mix:RivalMix[]=[];
 constructor(private context:AudioContext,master:GainNode,noise:AudioBuffer){
  for(let i=0;i<RIVAL_AUDIO_MAX_VOICES;i++){
   const pan=context.createStereoPanner(),filter=context.createBiquadFilter(),engineGain=context.createGain();
   pan.pan.value=0;filter.type='lowpass';filter.frequency.value=950;engineGain.gain.value=0;
   const engine=context.createOscillator();engine.type='triangle';engine.frequency.value=80;
   const undertone=context.createOscillator();undertone.type='sine';undertone.frequency.value=40;
   const subGain=context.createGain();subGain.gain.value=.34;
   engine.connect(filter);undertone.connect(subGain);subGain.connect(filter);
   filter.connect(engineGain);engineGain.connect(pan);
   const skid=context.createBufferSource(),band=context.createBiquadFilter(),skidGain=context.createGain();
   skid.buffer=noise;skid.loop=true;band.type='bandpass';band.frequency.value=1150;band.Q.value=.6;
   skidGain.gain.value=0;skid.connect(band);band.connect(skidGain);skidGain.connect(pan);
   pan.connect(master);
   engine.start();undertone.start();skid.start(0,i*.3);
   this.voices.push({engine,undertone,noise:skid,engineGain,skidGain,pan,filter});
  }
 }
 update(listener:RivalAudioListener,cars:readonly RivalAudioState[],burnout=false,active=true){
  this.mix=active?rivalAudioMix(listener,cars,burnout):[];
  const now=this.context.currentTime;
  for(let i=0;i<this.voices.length;i++){
   const voice=this.voices[i],row=this.mix[i];
   voice.id=row?.id;
   voice.engineGain.gain.setTargetAtTime(row?.gain??0,now,.065);
   voice.skidGain.gain.setTargetAtTime(row?.skid?row.gain*row.skid*.62:0,now,.045);
   if(!row)continue;
   voice.pan.pan.setTargetAtTime(row.pan,now,.07);
   voice.engine.frequency.setTargetAtTime(row.engineHz,now,.065);
   voice.undertone.frequency.setTargetAtTime(row.engineHz*.5,now,.065);
   voice.filter.frequency.setTargetAtTime(600+900*row.gain/.17,now,.12);
  }
 }
 silence(){
  this.mix=[];
  const now=this.context.currentTime;
  for(const voice of this.voices){voice.id=undefined;voice.engineGain.gain.setTargetAtTime(0,now,.025);voice.skidGain.gain.setTargetAtTime(0,now,.025);}
 }
 inspect(){return {maxVoices:this.voices.length,active:this.mix.map(r=>({...r}))};}
 dispose(){
  this.silence();
  for(const v of this.voices){v.engine.stop();v.undertone.stop();v.noise.stop();v.engine.disconnect();v.undertone.disconnect();v.noise.disconnect();v.pan.disconnect();}
  this.voices.length=0;
 }
}
