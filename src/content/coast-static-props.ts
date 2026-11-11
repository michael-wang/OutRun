import * as THREE from 'three';
import {coastBeachHeight} from '../scenery-cross-section';
import {coastStaticStage,staticPrefabCatalog} from './stage-data';
import {mountStageStaticProps,type RoadSampler} from './static-props';

/** Coast-specific terrain adapter; the generic GLB placer knows no coastline. */
export function mountCoastStaticProps(scene:THREE.Scene,sample:RoadSampler,signal?:AbortSignal){
 return mountStageStaticProps(scene,sample,coastStaticStage,staticPrefabCatalog,
  (item,road)=>coastBeachHeight(item.lateral,road.position.y,road.right.y,item.roadDistance),signal);
}
