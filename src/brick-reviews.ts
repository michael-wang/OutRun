import {BRICKS,CATALOG_VERSION,ENGINE_VERSION,type ChallengeBrick,type HumanVote} from './bricks';
export const REVIEW_KEY='outrun-brick-reviews-v1';
export const CURRENT_REVIEW_KEY='outrun-brick-reviews-v071d1';
export const VOTES:HumanVote[]=['UNREVIEWED','KEEP','REWORK','REJECT'];
export interface Review {humanVote:HumanVote;note:string}
export const reviewId=(b:ChallengeBrick)=>`${b.id}:r${b.revision}`;
export function readReviews(raw:string|null):Record<string,Review>{
 try {const value=JSON.parse(raw??'{}'),result:Record<string,Review>={};
  if(!value||typeof value!=='object'||Array.isArray(value))return result;
  for(const [key,r] of Object.entries(value) as [string,any][]){if(/^BRK-0[1-8]:r[1-9][0-9]*$/.test(key)&&r&&VOTES.includes(r.humanVote))result[key]={humanVote:r.humanVote,note:cleanNote(r.note)};}return result;
 }catch{return {};}
}
export const cleanNote=(note:unknown)=>typeof note==='string'?note.replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,240):'';
export function exportReviews(reviews:Record<string,Review>){return {schemaVersion:1,catalogVersion:CATALOG_VERSION,engineVersion:ENGINE_VERSION,records:BRICKS.map(b=>({id:b.id,revision:b.revision,seed:b.seed,autoQA:b.autoValidation,humanVote:reviews[reviewId(b)]?.humanVote??'UNREVIEWED',note:cleanNote(reviews[reviewId(b)]?.note)}))};}
