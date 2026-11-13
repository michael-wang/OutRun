import {expect,it} from 'vitest';
import {COAST_STAGE} from '../src/content/coast-stage';
import {coastGameplayAt,coastFeedbackPhases} from '../src/content/coast-gameplay-sample';
import {authoredRoadPlacements} from '../src/content/authored-road';

it('P0: gameplay beat labels and curve IDs are derived from authored scene data',()=>{
 const road=COAST_STAGE.road,acts=COAST_STAGE.scenicActs,placements=authoredRoadPlacements(road);
 for(let d=road.startDistance;d<=road.startDistance+road.length;d+=19){
  const s=d-road.startDistance,actual=coastGameplayAt(d);
  const index=acts.findIndex(a=>s>=a.start&&s<a.end);
  const buffer=s>=0&&s<100?'launch':s>=road.length-80&&s<road.length?'finish':undefined;
  expect(actual.world).toBe('coast');
  expect(actual.lanes).toBe(road.lanes);
  expect(actual.l2InstanceId).toBe(index<0?undefined:'COAST-SCENIC-'+(index+1));
  expect(actual.bufferRole).toBe(buffer);
  expect(actual.activePlacements).toEqual(
   placements.filter(p=>Math.max(0,Math.min(road.length,s))>=p.startS&&
     Math.max(0,Math.min(road.length,s))<=p.endS));
 }
 expect(coastFeedbackPhases()).toEqual([
  {startS:0,endS:road.length,world:'coast',beat:'Sunset coast journey'},
 ]);
});

it('P0: scenic act edits immediately affect gameplay metadata',()=>{
 const edited={...COAST_STAGE,scenicActs:COAST_STAGE.scenicActs.map(a=>({...a}))};
 edited.scenicActs[0].end=1200;edited.scenicActs[1].start=1200;
 expect(coastGameplayAt(1700,edited).l2InstanceId).toBe('COAST-SCENIC-2');
 expect(coastGameplayAt(1700,COAST_STAGE).l2InstanceId).toBe('COAST-SCENIC-1');
});
