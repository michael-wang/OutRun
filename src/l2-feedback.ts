import {PILOTS,PILOT_GENERATOR,type PilotCandidate,type Placement,type WorldPhase} from './pilot-composer';
import {L2_CANDIDATES,L2_CATALOG_VERSION,L2_GENERATOR,type L2Candidate} from './l2-catalog';
import type {HumanVote} from './bricks';
export const PRAISE={super_fun:'超好玩!',thrilling:'超刺激!',hard_but_rewarding:'超難! 但是過了超爽!',beautiful_scenery:'風景優美'} as const;
export type PraiseTag=keyof typeof PRAISE;
export const L2_STORAGE='outrun-l2-feedback-v1';
export const CURRENT_L2_STORAGE='outrun-l2-feedback-v071d1';
export interface FeedbackAnchor {
 id:string;revision:number;seed:number;contentFingerprint:string;generatorVersion:string;handlingVersion?:string;world:L2Candidate['world'];
 profiles:L2Candidate['profiles']|{placements:Placement[];activePlacements:Placement[];worldPhases:WorldPhase[]};s:number;trackDistance:number;elapsedSeconds:number;timestampMs:number;
 drive:{speedKmh:number;steerRaw:number;steerApplied:number;roadX:number;height:number;grade:number;halfWidth:number;laneCount:number;offRoad:boolean;gas:boolean;brake:boolean};
 source:'drive'|'completion';
}
export interface FeedbackEvent {kind:'praise'|'issue';tag?:PraiseTag;note:string;anchor:FeedbackAnchor}
export interface L2Review {humanVote:HumanVote;difficulty:number|null;overallNote:string;events:FeedbackEvent[]}
export type FeedbackStore=Record<string,L2Review>;
export const l2ReviewKey=(b:L2Candidate|PilotCandidate)=>`l2:${b.id}:r${b.revision}:${b.contentFingerprint}`;
export const emptyReview=():L2Review=>({humanVote:'UNREVIEWED',difficulty:null,overallNote:'',events:[]});
export const feedbackNote=(s:unknown)=>typeof s==='string'?s.slice(0,360):'';
export function readFeedback(raw:string|null):FeedbackStore{
 try{const data=JSON.parse(raw??'{}');if(!data||typeof data!=='object'||Array.isArray(data))return {};
  const out:FeedbackStore={};for(const [key,r] of Object.entries(data) as [string,any][]){if(!/^l2:(?:L2-\d{3}|L2P-[ABC]):r\d+:[a-f0-9]{8}$/.test(key)||!r||!['UNREVIEWED','KEEP','REWORK','REJECT'].includes(r.humanVote))continue;
   out[key]={humanVote:r.humanVote,difficulty:Number.isInteger(r.difficulty)&&r.difficulty>=1&&r.difficulty<=5?r.difficulty:null,overallNote:feedbackNote(r.overallNote),events:Array.isArray(r.events)?r.events.filter((e:any)=>e&&['praise','issue'].includes(e.kind)&&e.anchor&&Number.isFinite(e.anchor.s)&&(e.kind==='issue'||Object.hasOwn(PRAISE,e.tag))).map((e:any)=>({...e,note:feedbackNote(e.note)})):[]};
  }return out;
 }catch{return {};}
}
export function exportFeedback(store:FeedbackStore){return {schemaVersion:2,catalogVersion:L2_CATALOG_VERSION,generatorVersion:L2_GENERATOR,records:L2_CANDIDATES.map(b=>({id:b.id,revision:b.revision,seed:b.seed,contentFingerprint:b.contentFingerprint,world:b.world,profiles:b.profiles,autoQA:b.autoValidation,...(store[l2ReviewKey(b)]??emptyReview())}))};}

export function exportPilotFeedback(store:FeedbackStore){return {schemaVersion:2,catalogVersion:'l2-pilots-1',generatorVersion:PILOT_GENERATOR,records:PILOTS.map(b=>({id:b.id,revision:b.revision,seed:b.seed,contentFingerprint:b.contentFingerprint,world:b.world,placements:b.placements,worldPhases:b.worldPhases,autoQA:b.autoValidation,...(store[l2ReviewKey(b)]??emptyReview())}))};}
