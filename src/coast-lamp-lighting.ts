import * as THREE from 'three';

const WIDTH=128;
export const COAST_LAMP_RANGE=38;

// The coast runs forward in world Z. At every metre store the nearest fixture.
// Even at the closest pair, the switch falls beyond both 38 m light volumes.
// All fragments on the road, terrain, poles and traffic share this static table.
export function coastLampAtlas(heads:readonly THREE.Vector3[]){
 const ordered=[...heads].sort((a,b)=>a.z-b.z);
 const firstZ=Math.floor(ordered[0].z);
 const rows=Math.ceil((Math.ceil(ordered.at(-1)!.z)-firstZ+1)/WIDTH);
 const data=new Float32Array(WIDTH*rows*4);
 let next=0;
 for(let i=0;i<WIDTH*rows;i++){
  const z=firstZ+i+.5;
  while(next+1<ordered.length&&z>(ordered[next].z+ordered[next+1].z)*.5)next++;
  ordered[next].toArray(data,i*4);
 }
 const texture=new THREE.DataTexture(data,WIDTH,rows,THREE.RGBAFormat,THREE.FloatType);
 texture.name='coast-fixed-lamp-positions';texture.needsUpdate=true;
 return {texture,firstZ};
}

const lighting=new WeakMap<THREE.Scene,ReturnType<typeof coastLampAtlas>>();
export function registerCoastLamps(scene:THREE.Scene,heads:readonly THREE.Vector3[]){
 const atlas=coastLampAtlas(heads);
 lighting.set(scene,atlas);
 return ()=>{lighting.delete(scene);atlas.texture.dispose();};
}

const adapted=new WeakSet<THREE.Material>();
export function lightCoastMaterial(scene:THREE.Scene,material:THREE.Material){
 const atlas=lighting.get(scene);
 if(!atlas||!(material instanceof THREE.MeshStandardMaterial)||adapted.has(material))return;
 adapted.add(material);
 const previous=material.onBeforeCompile.bind(material),baseKey=material.customProgramCacheKey();
 material.onBeforeCompile=(shader,renderer)=>{
  previous(shader,renderer);
  shader.uniforms.coastLampHeads={value:atlas.texture};
  shader.uniforms.coastLampFirstZ={value:atlas.firstZ};
  // Use the stock point-light attenuation, BRDF, fog and tone mapping. Only
  // the source position differs from the single real light used by the car.
  shader.fragmentShader=shader.fragmentShader.replace('#include <lights_pars_begin>',`#include <lights_pars_begin>
   #if NUM_POINT_LIGHTS == 1
   uniform highp sampler2D coastLampHeads;
   uniform float coastLampFirstZ;
   void getCoastLampInfo(PointLight lamp,vec3 viewPos,out IncidentLight light){
    float z=cameraPosition.z+dot(viewMatrix[2].xyz,viewPos);
    int i=clamp(int(floor(z-coastLampFirstZ)),0,textureSize(coastLampHeads,0).y*${WIDTH}-1);
    vec3 head=texelFetch(coastLampHeads,ivec2(i%${WIDTH},i/${WIDTH}),0).xyz;
    lamp.position=(viewMatrix*vec4(head,1.)).xyz;
    getPointLightInfo(lamp,viewPos,light);
   }
   #define getPointLightInfo(lamp,pos,result) getCoastLampInfo(lamp,pos,result)
   #endif`);
 };
 material.customProgramCacheKey=()=>baseKey+'-fixed-coast-lamps';
 material.needsUpdate=true;
}
