import * as THREE from 'three';
import {COAST_SUN} from './coast-dusk';

/** Two geometry-accurate sunset shadow ranges. A narrow, high-detail light
 * covers the car, adjacent guardrails and trees. A second, wide-range light
 * covers the entire visible coast so distant houses and tree shadows do not
 * suddenly appear as the player approaches. Both point at the SAME sun.
 *
 * This intentionally costs an extra depth pass; art correctness comes first.
 */
export const COAST_NEAR_SHADOW={left:-300,right:300,top:135,bottom:-135,near:1,far:1300} as const;
export const COAST_FAR_SHADOW={left:-1400,right:1400,top:400,bottom:-400,near:1,far:4200} as const;
export const COAST_SHADOW_LOOKAHEAD_M=680;

export function configureCoastShadowLights(
 near:THREE.DirectionalLight,far:THREE.DirectionalLight,mobile:boolean,
){
 const setup=(light:THREE.DirectionalLight,bounds:typeof COAST_NEAR_SHADOW|typeof COAST_FAR_SHADOW,size:number,bias:number)=>{
  light.castShadow=true;
  light.shadow.mapSize.set(size,size);
  Object.assign(light.shadow.camera,bounds);
  light.shadow.camera.updateProjectionMatrix();
  light.shadow.bias=bias;
  light.shadow.normalBias=.04;
 };
 setup(near,COAST_NEAR_SHADOW,mobile?3072:4096,-.00008);
 setup(far,COAST_FAR_SHADOW,4096,-.00002);
}

/** Keep the distant light ahead of the player and the close light at the car.
 * This is a camera move, not a new per-object shadow spawning distance.
 * Scenic curvature and hills still receive stable overlapping coverage. */
export function updateCoastShadowLights(
 near:THREE.DirectionalLight,far:THREE.DirectionalLight,
 carPosition:THREE.Vector3,sample:(d:number)=>{position:THREE.Vector3},
 distance:number,routeLength:number,
){
 near.target.position.copy(carPosition);
 near.position.copy(carPosition).addScaledVector(COAST_SUN,500);
 const ahead=Math.max(0,Math.min(routeLength,Math.max(0,distance)+COAST_SHADOW_LOOKAHEAD_M));
 far.target.position.copy(carPosition).lerp(sample(ahead).position,.90);
 far.position.copy(far.target.position).addScaledVector(COAST_SUN,1500);
}
