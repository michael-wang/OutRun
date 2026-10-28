import {it,expect} from 'vitest';
import * as THREE from 'three';
import {generateStage} from '../src/stage-one';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {addJourneyScenery} from '../src/scenery';

it('range-scoped scenery retains the same instance placements as the original full scene',()=>{
 for(const seed of [1,2,3]){const stage=generateStage(seed),track=createPilotTrack(stage),half=(d:number)=>pilotSample(stage,d).halfWidth,weights=(d:number)=>pilotWeights(stage,d),roadSamples=Array.from({length:Math.ceil(track.length/25)},(_,i)=>track.sample(i*25).position);
 const generate=(start:number,end:number)=>{const scene=new THREE.Scene();addJourneyScenery(scene,track.sample,track.length,stage.sceneryAct,stage.seed,half,weights,{start,end,roadSamples});const rows:string[]=[];
  scene.traverse(o=>{if(!(o instanceof THREE.InstancedMesh))return;const material=o.material as THREE.MeshStandardMaterial,g=o.geometry;let h=2166136261;for(const n of g.attributes.position.array){h^=Math.round(n*1000);h=Math.imul(h,16777619);}for(let i=0;i<o.count;i++)rows.push(`${h}:${material.color.getHex()}:${Array.from(o.instanceMatrix.array.slice(i*16,i*16+16)).join(',')}`);});return rows;
 };
 const all=generate(0,track.length).sort(),pieces:string[]=[],starts=Array.from({length:Math.ceil(track.length/1000)},(_,i)=>i*1000).reverse();for(const start of starts)pieces.push(...generate(start,Math.min(start+1000,track.length)));
 expect(pieces.sort()).toEqual(all);}
},30000);
