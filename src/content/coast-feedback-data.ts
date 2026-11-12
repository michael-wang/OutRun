import {COAST_STAGE,COAST_RUNTIME_IDENTITY,type CoastStageContent} from './coast-stage';
import {authoredRoadPlacements} from './authored-road';
import {coastFeedbackPhases} from './coast-gameplay-sample';
import type {FeedbackEvent} from '../l2-feedback';

/** Stable storage/export identity for the one authored, playable coast. */
export const COAST_FEEDBACK_STORAGE='outrun-trip-v09';
export const COAST_PRAISE={
 super_fun:'超好玩!',thrilling:'超刺激!',
 hard_but_rewarding:'超難! 但是過了超爽!',beautiful_scenery:'風景優美',
} as const;
export type CoastVote='UNREVIEWED'|'KEEP'|'REWORK'|'REJECT';
export type CoastReview={humanVote:CoastVote;difficulty:number|null;overallNote:string;events:FeedbackEvent[]};
export const coastReviewKey=()=>['l2',COAST_RUNTIME_IDENTITY.id,
 'r'+COAST_RUNTIME_IDENTITY.revision,COAST_RUNTIME_IDENTITY.contentFingerprint].join(':');
export const emptyCoastReview=():CoastReview=>({
 humanVote:'UNREVIEWED',difficulty:null,overallNote:'',events:[],
});
export const coastNote=(s:unknown)=>typeof s==='string'?s.slice(0,360):'';

/** Preserve existing locally stored reviews, even when the historic L2
 * decoder rejects a non-hex stage fingerprint. No global Pilot catalog. */
export function readCoastReview(raw:string|null,key=coastReviewKey()):CoastReview{
 try{
  const data=JSON.parse(raw??'{}'),row=data?.[key];
  if(!row||!['UNREVIEWED','KEEP','REWORK','REJECT'].includes(row.humanVote))
   return emptyCoastReview();
  return {humanVote:row.humanVote,
   difficulty:Number.isInteger(row.difficulty)&&row.difficulty>=1&&row.difficulty<=5?row.difficulty:null,
   overallNote:coastNote(row.overallNote),
   events:Array.isArray(row.events)?row.events.filter((e:unknown)=>
    !!e&&typeof e==='object'&&['praise','issue'].includes((e as FeedbackEvent).kind)
    &&Number.isFinite((e as FeedbackEvent).anchor?.s))
    .map((e:FeedbackEvent)=>({...e,note:coastNote(e.note)})):[],
  };
 }catch{return emptyCoastReview();}
}

/** Export the established road-trip schema from authored Stage, not from
 * a legacy TripCandidate. Readers of older exports keep the same fields. */
export function exportCoastReview(review:CoastReview,content:CoastStageContent=COAST_STAGE){
 const {manifest,road,scenicActs}=content;
 return {schemaVersion:2,catalogVersion:'road-trip',
  generatorVersion:COAST_RUNTIME_IDENTITY.generatorVersion,
  records:[{id:COAST_RUNTIME_IDENTITY.id,tripCode:COAST_RUNTIME_IDENTITY.tripCode,
   stageCode:COAST_RUNTIME_IDENTITY.stageCode,seed:manifest.seed,
   contentFingerprint:COAST_RUNTIME_IDENTITY.contentFingerprint,
   beats:scenicActs.map((act,i)=>({
    id:'COAST-SCENIC-'+(i+1),startS:act.start,endS:act.end,
    world:'coast',verticality:'gentle',role:act.label,
   })),
   buffers:[{startS:0,endS:100,role:'launch'},
    {startS:road.length-80,endS:road.length,role:'finish'}],
   placements:authoredRoadPlacements(road),
   worldPhases:coastFeedbackPhases(content),...review,
  }]};
}
