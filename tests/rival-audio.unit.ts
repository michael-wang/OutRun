import {describe,it,expect} from 'vitest';
import {rivalAudioMix,RIVAL_AUDIO_MAX_VOICES,RIVAL_AUDIO_RADIUS,type RivalAudioState} from '../src/rival-audio';
import {PassBy,type PassActor} from '../src/pass-by';
const car=(id:string,distance:number,lateral:number,speed=52,slip=0):RivalAudioState=>
 ({id,distance,lateral,speed,rpm:4600,slip,braking:false,finishTime:null});
const player={distance:1000,lateral:0,speed:55};
describe('Rival spatial audio (pure mix)',()=>{
 it('pans left/right from relative road position and attenuates with distance',()=>{
  const left=rivalAudioMix(player,[car('left',1004,-4.5)])[0];
  const right=rivalAudioMix(player,[car('right',1004,4.5)])[0];
  const far=rivalAudioMix(player,[car('far',1050,-4.5)])[0];
  expect(left.pan).toBeLessThan(-.5);expect(right.pan).toBeGreaterThan(.5);
  expect(left.gain).toBeGreaterThan(far.gain);
  expect(rivalAudioMix(player,[car('too-far',1000+RIVAL_AUDIO_RADIUS+1,0)])).toEqual([]);
 });
 it('changes pitch predictably for approaching versus receding cars',()=>{
  const approaching=rivalAudioMix(player,[car('approach',1020,-4.5,40)])[0];
  const receding=rivalAudioMix(player,[car('away',1020,-4.5,75)])[0];
  expect(approaching.doppler).toBeGreaterThan(1);
  expect(receding.doppler).toBeLessThan(1);
  expect(approaching.engineHz).toBeGreaterThan(receding.engineHz);
 });
 it('caps the voices and ignores finishers; countdown burnouts trigger tire audio',()=>{
  const cars=Array.from({length:7},(_,i)=>car('R'+i,1004+i*7,i%2?3.5:-3.5,0));
  const mix=rivalAudioMix(player,cars,true);
  expect(mix).toHaveLength(RIVAL_AUDIO_MAX_VOICES);
  expect(mix.every(v=>v.skid>=.65)).toBe(true);
  cars[0].finishTime=80;
  expect(rivalAudioMix(player,[cars[0]])).toEqual([]);
 });
});
describe('Rival pass-by reuses capped traffic wind voices',()=>{
 it('whistles past nearby Rivals on either side, including moderate relative speeds',()=>{
  for(const side of [-4,4]){
   const pass=new PassBy();let heard=false;
   for(let i=0;i<160;i++){
    const actor:PassActor={id:-10000,type:0,distance:17-i*.16,lateral:side,visible:true,rival:true};
    const voices=pass.update(i/60,0,0,1.5,[actor]);
    if(voices.some(v=>v?.rival&&v.gain>0)){heard=true;expect(Math.sign(voices.find(v=>v?.rival)!.pan)).toBe(Math.sign(side));}
   }
   expect(pass.starts).toBe(1);
   expect(heard).toBe(true);
   expect(pass.inspect().active.length).toBeLessThanOrEqual(2);
  }
 });
});
