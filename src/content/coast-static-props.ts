import type * as THREE from 'three';
import {coastBeachHeight} from '../scenery-cross-section';
import {coastStaticStage,staticPrefabCatalog} from './stage-data';
import {mountStageStaticProps,type RoadSampler} from './static-props';

/** The Kenting scene mounts its own native props; other authored sites use the shared catalog. */
export function mountCoastStaticProps(scene:THREE.Scene,sample:RoadSampler,signal?:AbortSignal){
 const stage={...coastStaticStage,staticProps:coastStaticStage.staticProps.filter(p=>!p.id.startsWith('kenting-beach-'))};
 return mountStageStaticProps(scene,sample,stage,staticPrefabCatalog,
  (item,road)=>coastBeachHeight(item.lateral,road.position.y,road.right.y,item.roadDistance),signal);
}
