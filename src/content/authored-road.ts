import coastRoadFile from '../../content/stages/coast/road.json';
import {sweepKnots,riseKnots,profile,type Knot} from './road-shapes';
import {LANE_WIDTH} from '../road-profile';

/** Authored stage content is the source of truth. The legacy spline evaluator
 * remains a rendering detail until R2's fixed-road migration. */
export interface AuthoredTurn{
 shape:'sweep';
 start:number;
 end:number;
 /** Signed steering demand; positive/negative selects bend direction. */
 steer:number;
 /** How quickly this bend reaches/releases full demand. Default C02 = 0.2.
  * An immediate S uses 0.08 so it doesn't feel like a hidden straight. */
 rampFraction?:number;
 label:string;
}
/** Optional manually placed cross-slope accents, in absolute route metres. */
export interface AuthoredBank{
 kind:'showcase';start:number;end:number;ramp:number;degrees:number;
}
export interface AuthoredElevation{
 shape:'gentle-rise';
 start:number;
 end:number;
 base:number;
 rise:number;
 label:string;
}
export interface AuthoredRoad{
 schemaVersion:1;
 id:string;
 /** All authored spans use absolute HUD metres, shared with scenery props. */
 startDistance:number;
 length:number;
 lanes:2|4|5|6|8;
 baseHeight:number;
 turns:AuthoredTurn[];
 elevations:AuthoredElevation[];
 banks?:AuthoredBank[];
}

function validSpan(label:string,start:number,end:number,first:number,last:number){
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<first||end<=start||end>last)
  throw Error('Invalid road span: '+label);
}
function checkSorted<T extends {start:number;end:number}>(label:string,rows:readonly T[],first:number,last:number){
 let previous=first;
 for(const [i,row] of rows.entries()){
  validSpan(label+':'+i,row.start,row.end,first,last);
  if(row.start<previous)throw Error('Overlapping or unsorted '+label+' segments');
  previous=row.end;
 }
}

/** One cheap sanity pass before road streaming. Do not bake in artistic
 * intensity rules: stronger bends are intentional authoring decisions. */
export function validateAuthoredRoad(road:AuthoredRoad){
 if(road.schemaVersion!==1||!road.id||!Number.isFinite(road.startDistance)||road.startDistance<0||!Number.isFinite(road.length)||road.length<=0)
  throw Error('Invalid authored road header');
 if(![2,4,5,6,8].includes(road.lanes)||!Number.isFinite(road.baseHeight))
  throw Error('Invalid authored road width/height');
 if(!Array.isArray(road.turns)||!Array.isArray(road.elevations))
  throw Error('Missing authored road segments');
 checkSorted('turn',road.turns,road.startDistance,road.startDistance+road.length);
 checkSorted('elevation',road.elevations,road.startDistance,road.startDistance+road.length);
 if(road.banks){
  if(!Array.isArray(road.banks))throw Error('Invalid authored bank list');
  checkSorted('bank',road.banks,road.startDistance,road.startDistance+road.length);
  for(const feature of road.banks){
   if(feature.kind!=='showcase'||!Number.isFinite(feature.ramp)||
      feature.ramp<=0||feature.ramp*2>=feature.end-feature.start||
      !Number.isFinite(feature.degrees)||Math.abs(feature.degrees)>18)
    throw Error('Invalid authored bank');
  }
 }
 for(const turn of road.turns)
  if(turn.shape!=='sweep'||!Number.isFinite(turn.steer)||turn.steer===0||!turn.label||
     (turn.rampFraction!==undefined&&(!Number.isFinite(turn.rampFraction)||
       turn.rampFraction<.04||turn.rampFraction>.25)))
   throw Error('Invalid authored turn');
 for(const elevation of road.elevations)
  if(elevation.shape!=='gentle-rise'||!Number.isFinite(elevation.base)||
     !Number.isFinite(elevation.rise)||!elevation.label)
   throw Error('Invalid authored elevation');
 // A snapped road is a P0: don't let independent height spans jump apart.
 let held=road.baseHeight;
 for(const elevation of road.elevations){
  if(Math.abs(elevation.base-held)>1e-6)throw Error('Discontinuous authored elevation');
  held=elevation.base+elevation.rise;
 }
}

/** Read-only representation for existing review JSON exports.
 * This is NOT a generated route, nor a dependency on Pilot or Brick. */
export type AuthoredPlacement=
 | {channel:'curvature';id:'C02';startS:number;endS:number;
    parameters:{effort:number;direction:1|-1;start:number;end:number;secondary:number};
    transition:'smooth';beat:string}
 | {channel:'elevation';id:'E02';startS:number;endS:number;
    parameters:{base:number;amplitude:number;direction:1|-1;shelfStart:number;shelfEnd:number};
    transition:'smooth';beat:string};

/** A deliberately small compatibility adapter. No procedural or random
 * authoring; all road shape decisions live in road.json. */
export function authoredRoadPlacements(road:AuthoredRoad):AuthoredPlacement[]{
 validateAuthoredRoad(road);
 const placements:AuthoredPlacement[]=[
  ...road.turns.map((turn):AuthoredPlacement=>({
   channel:'curvature',id:'C02',startS:turn.start-road.startDistance,endS:turn.end-road.startDistance,
   parameters:{effort:Math.abs(turn.steer),direction:turn.steer>0?1:-1,start:0,end:1,secondary:.7},
   transition:'smooth',beat:turn.label,
  })),
  ...road.elevations.map((part):AuthoredPlacement=>({
   channel:'elevation',id:'E02',startS:part.start-road.startDistance,endS:part.end-road.startDistance,
   parameters:{base:part.base,amplitude:Math.abs(part.rise),direction:part.rise>=0?1:-1,shelfStart:.32,shelfEnd:.68},
   transition:'smooth',beat:part.label,
  })),
 ];
 return placements.sort((a,b)=>a.startS-b.startS);
}

export const coastAuthoredRoad=coastRoadFile as AuthoredRoad;
validateAuthoredRoad(coastAuthoredRoad);

type PreparedSegment={start:number;end:number;knots:Knot[]};
type PreparedRoad={
 turns:PreparedSegment[];
 elevations:(PreparedSegment & {endHeight:number})[];
};
// Immutable stage JSON is prepared once per loaded stage, not once per car,
// road vertex or Worker chunk. HMR imports a fresh road object.
const preparedRoads=new WeakMap<AuthoredRoad,PreparedRoad>();
function prepareRoad(road:AuthoredRoad):PreparedRoad{
 const cached=preparedRoads.get(road);
 if(cached)return cached;
 validateAuthoredRoad(road);
 const prepared:PreparedRoad={
  turns:road.turns.map(turn=>({
   start:turn.start,end:turn.end,
   knots:sweepKnots(turn.steer,turn.rampFraction),
  })),
  elevations:road.elevations.map(part=>({
   start:part.start,end:part.end,endHeight:part.base+part.rise,
   knots:riseKnots(part.base,part.rise),
  })),
 };
 preparedRoads.set(road,prepared);
 return prepared;
}

/** Road sampler for authored finite stages. The existing C02/E02 curves are
 * shared mathematical capabilities, not a second road placement planner.
 * Distance is absolute; the road is clamped at its finite ends. */
export function sampleAuthoredRoad(road:AuthoredRoad,distance:number){
 const prepared=prepareRoad(road);
 const d=Math.max(road.startDistance,Math.min(road.startDistance+road.length,distance));
 let demand=0,height=road.baseHeight,grade=0;
 for(const turn of prepared.turns){
  if(d<turn.start)break;
  if(d>turn.end)continue;
  demand=profile(turn.knots,(d-turn.start)/(turn.end-turn.start)).value;
 }
 for(const part of prepared.elevations){
  if(d<part.start)break;
  if(d>part.end){height=part.endHeight;grade=0;continue;}
  const q=profile(part.knots,(d-part.start)/(part.end-part.start));
  height=q.value;
  grade=q.derivative/(part.end-part.start);
 }
 return {demand,height,grade,lanes:road.lanes,halfWidth:road.lanes*LANE_WIDTH/2};
}
