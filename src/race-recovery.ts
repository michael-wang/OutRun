import type {DrivingState} from './handling';
import type {RivalRace} from './rival-race';
import type {Traffic} from './traffic';
import type {RoadCones} from './road-cones';
import type {FinishStats} from './finish-stats';

/** The one bounded local checkpoint for a race interrupted by the OS/browser. */
export const RACE_CHECKPOINT_KEY='outrun-coast-race-checkpoint-v1';
export const CHECKPOINT_MAX_AGE_MS=24*60*60*1000;

export interface RaceCheckpoint {
 schema:1;
 version:string;
 stage:'coast';
 savedAt:number;
 elapsed:number;
 trafficSessionVariation:number;
 player:DrivingState;
 race:ReturnType<RivalRace['snapshot']>;
 traffic:ReturnType<Traffic['snapshot']>;
 cones:ReturnType<RoadCones['snapshot']>|null;
 triangles:ReturnType<RoadCones['snapshot']>|null;
 stats:ReturnType<FinishStats['snapshot']>;
 rivalPassCount:number;
}
export type RaceCheckpointData=Omit<RaceCheckpoint,'schema'|'version'|'savedAt'>;
type CheckpointStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;

export function saveRaceCheckpoint(data:RaceCheckpointData,version:string,
 storage?:CheckpointStorage,now=Date.now()):boolean{
 try{
  const target=storage??localStorage;
  target.setItem(RACE_CHECKPOINT_KEY,JSON.stringify({...data,schema:1,version,savedAt:now}));
  return true;
 }catch{return false;} // Storage may be disabled or full.
}
export function clearRaceCheckpoint(storage?:CheckpointStorage):void{
 try{(storage??localStorage).removeItem(RACE_CHECKPOINT_KEY);}catch{/* unavailable */}
}
export function readRaceCheckpoint(version:string,storage?:CheckpointStorage,now=Date.now()):RaceCheckpoint|null{
 try{
  const target=storage??localStorage,raw=target.getItem(RACE_CHECKPOINT_KEY);
  if(!raw)return null;
  const saved=JSON.parse(raw) as RaceCheckpoint;
  const valid=saved?.schema===1&&saved.version===version&&saved.stage==='coast'
   &&Number.isFinite(saved.savedAt)&&now>=saved.savedAt&&now-saved.savedAt<CHECKPOINT_MAX_AGE_MS
   &&Number.isFinite(saved.elapsed)&&saved.elapsed>0&&saved.elapsed<3600
   &&Number.isInteger(saved.trafficSessionVariation)&&saved.trafficSessionVariation>=0
   &&Number.isFinite(saved.player?.distance)&&Number.isFinite(saved.player?.speed)
   &&saved.player.distance>=0&&saved.player.speed>=0
   &&Number.isFinite(saved.race?.time)&&saved.race.time>0
   &&Array.isArray(saved.race?.rivals)&&saved.race.rivals.length===7
   &&Number.isFinite(saved.traffic?.time)&&Array.isArray(saved.traffic?.world?.cars)
   &&Number.isFinite(saved.stats?.speedMetres)
   &&Number.isInteger(saved.rivalPassCount)&&saved.rivalPassCount>=0;
  if(valid)return saved;
  target.removeItem(RACE_CHECKPOINT_KEY);
 }catch{/* malformed data or blocked storage */}
 return null;
}
