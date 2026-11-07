import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createSpiderShell,createRearTonneau} from './hero-body';

/** The owner-approved Riviera 62 is our only player car.
 * Preserve precisely the sculpted open spider shell and approved rear deck.
 * No model-choice branches, prebuilt alternatives or active geometry swaps.
 */
export function createRivieraBody():THREE.BufferGeometry{
 const parts=[createSpiderShell(),createRearTonneau()];
 const combined=mergeGeometries(parts);
 parts.forEach(part=>part.dispose());
 if(!combined)throw Error('Failed to bake Riviera body');
 combined.name='hero-riviera-62-body';
 combined.computeBoundingBox();
 combined.computeBoundingSphere();
 return combined;
}

/** Four jewel-like round 1960s taillights, unchanged from the accepted art.
 * Reuse one emissive material and draw rather than separate lamp meshes.
 */
export function createRivieraTailLamps():THREE.BufferGeometry{
 const parts:THREE.BufferGeometry[]=[];
 for(const side of [-1,1])for(const x of [.47,.69]){
  const lamp=new THREE.CircleGeometry(.063,16);
  lamp.translate(side*x,.745,-2.421);
  parts.push(lamp);
 }
 const combined=mergeGeometries(parts);
 parts.forEach(part=>part.dispose());
 if(!combined)throw Error('Failed to bake Riviera taillights');
 combined.name='hero-riviera-62-rear-lights';
 combined.computeBoundingSphere();
 return combined;
}
