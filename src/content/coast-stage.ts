import stageFile from '../../content/stages/coast/stage.json';
import {coastAuthoredRoad,validateAuthoredRoad,type AuthoredRoad} from './authored-road';
import {coastStaticStage,staticPrefabCatalog,validateStageStaticContent,type StageStaticContent} from './stage-data';
import {COAST_SCENIC_ACTS} from '../coast-journey-layout';
import {COAST_EFFECTS,validateCoastEffects,type CoastStageEffects} from './coast-effects';

/** Historic identity used for feedback / telemetry storage compatibility,
 * not a base class, Stage generator or new authoring requirement. */
export const COAST_RUNTIME_IDENTITY={
 id:'ROAD-TRIP-10M',revision:28,stageCode:'COAST-RESORT-R8',tripCode:'COAST-RESORT-R8',
 generatorVersion:'v0.9-r10',contentFingerprint:'coast-farewell-headlands-r2-804',
} as const;

/** Authored content only. No Pilot, Brick, Trip or procedural route generator. */
export interface CoastStageManifest{
 schemaVersion:1;
 id:'coast';
 name:string;
 intent:string;
 seed:number;
 entrySpeed:number;
 entry:string;
 exit:string;
 warning:{leadMeters:number;text:string};
}
export interface CoastStageContent{
 manifest:CoastStageManifest;
 road:AuthoredRoad;
 scene:StageStaticContent;
 effects:CoastStageEffects;
 scenicActs:readonly {id:string;start:number;end:number;label:string}[];
}
export function validateCoastStage(content:CoastStageContent){
 const {manifest,road,scene,effects,scenicActs}=content;
 if(manifest.schemaVersion!==1||manifest.id!=='coast'||manifest.id!==road.id||manifest.id!==scene.id)
  throw Error('Coast stage/road/scene IDs or schema do not match');
 if(!manifest.name.trim()||!manifest.intent.trim()||!manifest.entry.trim()||!manifest.exit.trim()||
    !manifest.warning.text.trim()||!Number.isSafeInteger(manifest.seed)||manifest.seed<0||
    !Number.isFinite(manifest.entrySpeed)||manifest.entrySpeed<0||
    !Number.isFinite(manifest.warning.leadMeters)||manifest.warning.leadMeters<0)
  throw Error('Invalid coastal stage metadata');
 validateAuthoredRoad(road);
 validateStageStaticContent(scene,staticPrefabCatalog);
 validateCoastEffects(effects,road.startDistance,road.length);
 // Scenic act distances are relative to course start, unlike road/prop HUD metres.
 if(!scenicActs.length||scenicActs[0].start!==0||scenicActs.at(-1)!.end!==road.length)
  throw Error('Coast scenic acts must cover the entire finite stage');
 let previous=0;
 for(const act of scenicActs){
  if(!act.id||!act.label||!Number.isFinite(act.start)||!Number.isFinite(act.end)||
     act.start!==previous||act.end<=act.start)
   throw Error('Invalid or discontinuous coastal scenic acts');
  previous=act.end;
 }
}

export const COAST_STAGE:CoastStageContent={
 manifest:stageFile as CoastStageManifest,
 road:coastAuthoredRoad,
 scene:coastStaticStage,
 effects:COAST_EFFECTS,
 scenicActs:COAST_SCENIC_ACTS,
};
validateCoastStage(COAST_STAGE);
