import scoreUrl from './music/neon-relay.ogg?url';
import {resumeStageAudio} from '../stage-audio';

const settingKey='outrun.city.musicLevel';
export function savedMusicLevel(){
 try{const v=localStorage.getItem(settingKey);if(v!==null&&Number.isFinite(+v))return Math.max(0,Math.min(1,+v));}catch{}
 return .65;
}

export function cityRaceAudio(context,master,startingLevel,onState){
 const gain=(to,value)=>{const g=context.createGain();g.gain.value=value;g.connect(to);return g;};
 const filter=(type,hz,q,to)=>{const f=context.createBiquadFilter();f.type=type;f.frequency.value=hz;f.Q.value=q;f.connect(to);return f;};
 const tone=(destination,partials)=>{
  const osc=context.createOscillator();
  osc.setPeriodicWave(context.createPeriodicWave(new Float32Array(partials.length),new Float32Array(partials)));
  osc.connect(destination);osc.start();return osc;
 };
 const exhaust=gain(master,0),intake=gain(master,0),pass=gain(master,0);
 const throat=filter('lowpass',1000,.58,exhaust);
 const exhaustTone=tone(throat,[0,.85,.32,.5,.19,.27,.10,.14,.08,.065]);
 const intakeTone=tone(intake,[0,.88,.44,.14,.22,.07,.09]);
 const passTone=tone(pass,[0,1,.18,.08]);
 const windGain=gain(master,0),tireGain=gain(master,0);
 const wind=filter('lowpass',480,.5,windGain),tire=filter('bandpass',1550,1.4,tireGain);
 const noise=context.createBuffer(1,context.sampleRate*2,context.sampleRate);
 const data=noise.getChannelData(0);let seed=19;
 for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
 const air=context.createBufferSource();air.buffer=noise;air.loop=true;air.connect(wind);air.connect(tire);air.start();
 const musicGain=gain(master,0);let level=startingLevel,score=null,source=null,active=false,disposed=false,offset=0,started=0;
 let pending=null,controller=new AbortController();
 function volume(){musicGain.gain.setTargetAtTime(level*.80,context.currentTime,.035);}
 function play(){
  if(disposed||!active||source||!score)return;
  started=context.currentTime;source=context.createBufferSource();source.buffer=score;source.loop=true;
  source.connect(musicGain);source.start(0,offset%score.duration);volume();
 }
 function stop(){
  if(!source)return;
  offset=(offset+context.currentTime-started)%score.duration;source.stop();source.disconnect();source=null;
 }
 function load(){
  if(score||pending||disposed)return;
  pending=fetch(scoreUrl,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('City score '+r.status);return r.arrayBuffer();})
   .then(data=>context.decodeAudioData(data)).then(buffer=>{if(!disposed){score=buffer;play();}})
   .catch(e=>{if(!disposed)console.warn('City music unavailable',e);}).finally(()=>pending=null);
 }
 function unlock(){void resumeStageAudio(context).catch(()=>{});}
 const changed=()=>onState(context.state);
 context.addEventListener('statechange',changed);changed();
 function setLevel(value){level=value;volume();if(value>0&&active){load();play();}
  try{localStorage.setItem(settingKey,String(level));}catch{}}
 return {
  start(){stop();offset=0;active=true;unlock();if(level>0)load();play();},
  pause(){active=false;stop();},
  resume(){active=true;unlock();if(level>0)load();play();},unlock,setLevel,
  update(v,gas,rpm,traction,slip,near,running){
   const t=context.currentTime,load=running?gas*traction:0;
   const target=(p,n,s=.04)=>p.setTargetAtTime(n,t,s);
   // Two exhaust pulses per crank revolution. Intake follows a lower order at load.
   target(exhaustTone.frequency,rpm/30);target(intakeTone.frequency,rpm/60);
   target(exhaust.gain,running?.36+.63*load:.13);target(throat.frequency,410+rpm*.18+load*520);
   target(intake.gain,running?.20+.31*load:.07);
   target(windGain.gain,running?.18*(v/78)**2:0,.13);
   target(tireGain.gain,running?Math.max(0,Math.abs(slip)-.025)*1.75:0);
   target(pass.gain,running?near*.095:0);target(passTone.frequency,88+near*51);
  },
  impact(force){
   const hit=context.createBufferSource(),bp=filter('bandpass',force>.45?650:1510,.8,master);
   const env=gain(bp,0),t=context.currentTime;hit.buffer=noise;
   env.gain.setValueAtTime(.20+1.18*force,t);env.gain.exponentialRampToValueAtTime(.001,t+.10+.21*force);
   hit.connect(env);hit.onended=()=>{hit.disconnect();env.disconnect();bp.disconnect();};hit.start();hit.stop(t+.34);
  },
  state:()=>({context:context.state,active,musicLoaded:!!score,musicPlaying:!!source,level,offset:source?(offset+context.currentTime-started)%score.duration:offset,tire:tireGain.gain.value,wind:windGain.gain.value}),
  dispose(){disposed=true;active=false;controller.abort();stop();context.removeEventListener('statechange',changed);
   for(const node of [exhaustTone,intakeTone,passTone,air]){node.stop();node.disconnect();}}
 };
}
