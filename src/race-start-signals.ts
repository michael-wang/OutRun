/** Countdown cues are driven by simulated race time, never wall-clock timers. */
export type RaceStartSignal=3|2|1|'GO';

export function raceStartSignal(remaining:number):RaceStartSignal {
 if(remaining<=0)return 'GO';
 return Math.max(1,Math.min(3,Math.ceil(remaining))) as 3|2|1;
}

/** Exactly one audible cue per countdown light, including the final GO. */
export class RaceStartSignals {
 private last:RaceStartSignal|null=null;
 reset(){this.last=null;}
 advance(remaining:number,play:(signal:RaceStartSignal)=>boolean){
  if(!Number.isFinite(remaining)||remaining<0)return;
  const signal=raceStartSignal(remaining);
  if(signal!==this.last&&play(signal))this.last=signal;
 }
 get current(){return this.last;}
}
