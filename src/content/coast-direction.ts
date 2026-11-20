import {kentingPlaced,KENTING_INSTALLATION} from '../kenting-installation';
import {heroDeferred} from './kenting-neighbours';
import directionFile from '../../content/stages/coast/direction.json';
import type {AuthoredRoad} from './authored-road';

export type CoastChapterRole='onboarding'|'vista'|'pressure'|'finish';
export interface CoastChapter{
 id:string;start:number;end:number;label:string;focus:string;role:CoastChapterRole;
}
export interface CoastHeroSlot{
 id:string;distance:number;side:'left'|'right'|'ahead';lookAheadM:number;
 label:string;brief:string;
}
export interface CoastContestGate{
 id:string;start:number;end:number;label:string;goal:string;
}
export interface CoastDirection{
 schemaVersion:1;id:'coast';revision:string;
 chapters:CoastChapter[];heroSlots:CoastHeroSlot[];contestGates:CoastContestGate[];
}
/** Authoring-only rhythm; road physics and AI are not tied to these labels. */
export const COAST_DIRECTION=directionFile as CoastDirection;
export function validateCoastDirection(direction:CoastDirection,road:AuthoredRoad){
 if(direction?.schemaVersion!==1||direction.id!==road.id||!direction.revision||
    !Array.isArray(direction.chapters)||!direction.chapters.length||
    !Array.isArray(direction.heroSlots)||!Array.isArray(direction.contestGates))
  throw Error('Invalid coast direction header');
 let previous=0;
 for(const act of direction.chapters){
  if(!act.id?.trim()||!act.label?.trim()||!act.focus?.trim()||
     !['onboarding','vista','pressure','finish'].includes(act.role)||
     !Number.isFinite(act.start)||!Number.isFinite(act.end)||
     act.start!==previous||act.end<=act.start||act.end>road.length)
   throw Error('Invalid or discontinuous coast chapter');
  previous=act.end;
 }
 if(previous!==road.length||direction.chapters.at(-1)?.role!=='finish')
  throw Error('Coast direction does not reach the finish');
 const first=road.startDistance,last=road.startDistance+road.length;
 const seen=new Set<string>();
 let lastHero=first;
 for(const slot of direction.heroSlots){
  if(!slot.id?.trim()||seen.has(slot.id)||!slot.label?.trim()||
     !slot.brief?.trim()||!['left','right','ahead'].includes(slot.side)||
     !Number.isFinite(slot.distance)||slot.distance<=lastHero||slot.distance>=last||
     !Number.isFinite(slot.lookAheadM)||slot.lookAheadM<200||slot.lookAheadM>1500)
   throw Error('Invalid hero scenery slot');
  seen.add(slot.id);lastHero=slot.distance;
 }
 let lastGate=first;
 for(const gate of direction.contestGates){
  if(!gate.id?.trim()||seen.has(gate.id)||!gate.label?.trim()||!gate.goal?.trim()||
     !Number.isFinite(gate.start)||!Number.isFinite(gate.end)||
     gate.start<lastGate||gate.end<=gate.start||gate.end>=last-300)
   throw Error('Invalid contest gate');
  seen.add(gate.id);lastGate=gate.end;
 }
}
/** Materialize the layout's active hero observations once. Source anchors also
 * serve as the authoring inventory for sites deferred from the trial. */
export const COAST_INSTALLED_HEROES=KENTING_INSTALLATION.relocated
 ?COAST_DIRECTION.heroSlots.filter(slot=>!heroDeferred(slot.id)).map(slot=>
   slot.id==='beach-market'||slot.id==='boulder-surf'?{...slot,distance:kentingPlaced(slot.distance)}:slot)
 :COAST_DIRECTION.heroSlots;

export function coastHeroNear(distance:number,direction:CoastDirection=COAST_DIRECTION){
 const slots=direction===COAST_DIRECTION?COAST_INSTALLED_HEROES:direction.heroSlots;
 return slots.find(slot=>distance>=slot.distance-slot.lookAheadM&&distance<slot.distance+160);
}
