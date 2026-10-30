import {curvatureKnots,elevationKnots,widthKnots,resolveL1,type CurvatureId,type ElevationId,type WidthId,type CurveParameters,type ElevationParameters,type WidthParameters} from './l1-profiles';
import {REFERENCE_TRAVEL,CHALLENGES} from './challenges';
import {createTrack} from './track';
import {BRICK_START,type ChallengeBrick} from './bricks';
export const L2_GENERATOR='v0.7C-r2',L2_CATALOG_VERSION='l2-lab-1';
export interface L2Candidate extends ChallengeBrick {
 world:'coast'|'canyon'|'city';contentFingerprint:string;generatorVersion:string;
 profiles:{curvature:{id:CurvatureId;parameters:CurveParameters};elevation:{id:ElevationId;parameters:ElevationParameters};width:{id:WidthId;parameters:WidthParameters}};
}
const matrix=[
 ['C01','E02','W03',1,'Mountain climb','Hold a clean line as the mountain road narrows.'],
 ['C01','E05','W02',2,'Skyline shelf','Climb onto the city shelf, then descend onto the broad road.'],
 ['C02','E01','W01',0,'Ocean sweep','Stay on the gas through the wide coastal arc.'],
 ['C02','E02','W02',2,'Downhill expressway','Follow the descending arc as the city road opens.'],
 ['C03','E03','W03',1,'Tightening ridge','The ridge corner tightens while the road becomes narrower.'],
 ['C03','E04','W04',0,'Valley squeeze','Adjust your line through a tightening valley bottleneck.'],
 ['C04','E01','W04',2,'City release','Brake for the first demanding bend, then unwind the steering.'],
 ['C04','E06','W01',0,'Rolling coast','Follow the easing bend over a sequence of coastal hills.'],
 ['C05','E03','W02',1,'Twin ridge bends','Link two bends in the same direction across the ridge.'],
 ['C05','E05','W03',1,'Narrow shelf','Carry your line from one bend into the next on a high shelf.'],
 ['C06','E04','W01',1,'Valley reversal','Reverse your steering smoothly through the canyon valley.'],
 ['C06','E06','W04',0,'Rolling S','Change direction while the coast rises, falls and narrows.'],
 ['C07','E03','W02',2,'Skyline slalom','Link alternating bends on the widening city ridge.'],
 ['C07','E02','W04',2,'Descending rhythm','Keep the slalom rhythm through a downhill bottleneck.'],
 ['C08','E05','W01',1,'Shelf switchback','Brake for the mountain hairpin and accelerate onto the shelf exit.'],
 ['C08','E06','W03',0,'Cliff hairpin','A strong reversal of direction among rolling coastal cliffs.'],
] as const;
function fingerprint(value:unknown){let h=2166136261;for(const ch of JSON.stringify(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
export const L2_CANDIDATES:L2Candidate[]=matrix.map(([c,e,w,sceneryAct,name,intent],i)=>{
 const nominalDuration=36+(i%3)*4,length=nominalDuration*REFERENCE_TRAVEL,seed=9701+i*97;
 const effort=c==='C08'?1.25:[0,0,.5,.6,1.2,.85,1.15,.7,.7,.8,.75,.65,.75,.85][i];
 const span=c==='C08'?5.825/(nominalDuration*effort*.75):c==='C01'?.5:c==='C02'?.3:c==='C03'||c==='C04'?(effort>1?.18:.3):c==='C05'?.35:.6;
 const from=(w==='W02'?(i===3||i===12?6:2):w==='W03'?(i===15?6:4):w==='W04'?4:i===2?8:i===7?6:i===14?2:4) as 2|4|6|8;
 const to=(w==='W02'?(from===6?8:4):w==='W03'?2:w==='W04'?2:from) as 2|4|6|8;
 const profiles:L2Candidate['profiles']={curvature:{id:c,parameters:{effort,direction:i%2?-1:1,start:.5-span/2,end:.5+span/2,secondary:c==='C05'?.65:i%2?.7:1}},elevation:{id:e,parameters:{base:e==='E02'&&i!==0?210:16,amplitude:e==='E01'?0:e==='E06'?90:160,direction:i===0?1:-1,shelfStart:.32,shelfEnd:.68}},width:{id:w,parameters:{from,to,start:.2,end:.8}}};
 const cs=curvatureKnots(c,profiles.curvature.parameters),es=elevationKnots(e,profiles.elevation.parameters),ws=widthKnots(w,profiles.width.parameters);
 return {id:`L2-${String(i+1).padStart(3,'0')}`,revision:2,seed,name,intent,sceneryAct,world:['coast','canyon','city'][sceneryAct] as L2Candidate['world'],profiles,generatorVersion:L2_GENERATOR,contentFingerprint:fingerprint({profiles,seed,length,sceneryAct,generator:L2_GENERATOR}),nominalDuration,length,referenceSpeed:230,entrySpeed:230,roadWidth:from*3.5,lanes:ws.map(([t,v])=>[t*nominalDuration,v]),elevation:es.map(([t,v])=>[t*nominalDuration,v]),requiredSteerProfile:cs,emotionalRole:name,entry:'Straight approach',exit:'Straight relief and explicit finish',warning:{leadMeters:300,text:'READ THE ROAD'},tags:[c,e,w],antiAdjacency:[],autoValidation:'PASS'};
});
export function l2Sample(b:L2Candidate,distance:number){const p=b.profiles;return resolveL1(b.length,(distance-BRICK_START)/b.length,curvatureKnots(p.curvature.id,p.curvature.parameters),elevationKnots(p.elevation.id,p.elevation.parameters),widthKnots(p.width.id,p.width.parameters));}
export function l2Course(b:L2Candidate){
 const lead=BRICK_START+b.profiles.curvature.parameters.start*b.length,end=BRICK_START+b.profiles.curvature.parameters.end*b.length,finish=BRICK_START+b.length+600,template={...CHALLENGES[0],label:b.name,act:b.sceneryAct,roadWidth:b.roadWidth,transitionLength:0,transitionSeconds:0};
 const warningDemand=b.profiles.curvature.parameters.effort*b.profiles.curvature.parameters.direction;
 return [{...template,id:b.id+'-approach',start:0,end:lead,length:lead,nominalDurationAtReferenceSpeed:lead/REFERENCE_TRAVEL,targetRequiredSteering:0},{...template,id:b.id,start:lead,end,length:end-lead,nominalDurationAtReferenceSpeed:(end-lead)/REFERENCE_TRAVEL,targetRequiredSteering:warningDemand},{...template,id:b.id+'-exit',start:end,end:finish,length:finish-end,nominalDurationAtReferenceSpeed:(finish-end)/REFERENCE_TRAVEL,targetRequiredSteering:0}];
}
export const createL2Track=(b:L2Candidate)=>createTrack({course:l2Course(b),heightAt:d=>l2Sample(b,d),demandAt:d=>l2Sample(b,d).demand,loop:false});
