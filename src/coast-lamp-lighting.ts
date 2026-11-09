import * as THREE from 'three';

const WIDTH=128;
export const COAST_LAMP_RANGE=38;

// The coast runs forward in world Z. At every metre store the nearest fixture.
// Even at the closest pair, the switch falls beyond both 38 m light volumes.
// All fragments on the road, terrain, poles and traffic share this static table.
export function coastLampAtlas(heads:readonly THREE.Vector3[],poles?:ReadonlyMap<THREE.Vector3,THREE.Vector4>){
 const ordered=[...heads].sort((a,b)=>a.z-b.z);
 const firstZ=Math.floor(ordered[0].z);
 const rows=Math.ceil((Math.ceil(ordered.at(-1)!.z)-firstZ+1)/WIDTH);
 // PC appends one RGBA record per pole to the same texture. A lookup in the
 // position grid points directly at that fixture's base and transformer flag.
 const cells=WIDTH*rows,totalRows=rows+(poles?Math.ceil(ordered.length/WIDTH):0);
 const data=new Float32Array(WIDTH*totalRows*4);
 if(poles)ordered.forEach((head,i)=>poles.get(head)!.toArray(data,(cells+i)*4));
 let next=0;
 for(let i=0;i<WIDTH*rows;i++){
  const z=firstZ+i+.5;
  while(next+1<ordered.length&&z>(ordered[next].z+ordered[next+1].z)*.5)next++;
  ordered[next].toArray(data,i*4);
  if(poles)data[i*4+3]=cells+next;
 }
 const texture=new THREE.DataTexture(data,WIDTH,totalRows,THREE.RGBAFormat,THREE.FloatType);
 texture.name='coast-fixed-lamp-positions';texture.needsUpdate=true;
 return {texture,firstZ,cells,poleShadows:!!poles};
}

const lighting=new WeakMap<THREE.Scene,ReturnType<typeof coastLampAtlas>>();
export function registerCoastLamps(scene:THREE.Scene,heads:readonly THREE.Vector3[],poles?:ReadonlyMap<THREE.Vector3,THREE.Vector4>){
 const atlas=coastLampAtlas(heads,poles);
 lighting.set(scene,atlas);
 return ()=>{lighting.delete(scene);atlas.texture.dispose();};
}

// Test the segment from the bulb to the *actual shaded surface*. A horizontal
// crossarm above its own bulb cannot project onto level ground. Its silhouette
// is only received above the bulb; transformer brackets can also block lower rays.
const poleOcclusionGLSL=/* glsl */`
 float coastArmBlock(vec3 ray,vec2 inland,float reach,float dy,vec2 center,vec2 halfSize){
  if(abs(ray.y)<.001)return 0.;
  float t=dy/ray.y;
  if(t<=0.||t>=1.)return 0.;
  vec2 q=ray.xz*t;
  vec2 uv=vec2(dot(q,inland)-reach,dot(q,vec2(-inland.y,inland.x)))-center;
  vec2 edge=abs(uv)-halfSize;
  float blur=.055+.16*(1.-t);
  return 1.-smoothstep(-blur,blur,max(edge.x,edge.y));
 }
 float coastPoleBlock(vec3 ray,vec3 head,vec4 pole){
  vec2 axis=pole.xz-head.xz;
  float reach=length(axis);
  vec2 inland=axis/reach;
  if(dot(ray.xz,inland)<reach-1.6)return 0.;
  float t=clamp(dot(axis,ray.xz)/max(.001,dot(ray.xz,ray.xz)),0.,1.);
  float y=head.y+ray.y*t;
  float blur=.055+.17*(1.-t);
  float shaft=(1.-smoothstep(.245-blur,.245+blur,length(ray.xz*t-axis)))
             *smoothstep(pole.y-.14,pole.y+.02,y)*(1.-smoothstep(head.y+1.84,head.y+1.94,y));
  float arm=coastArmBlock(ray,inland,reach,1.35,vec2(0.),vec2(1.525,.11));
  if(pole.w>.5)arm=max(arm,coastArmBlock(ray,inland,reach,-.93,vec2(-.58,0.),vec2(.54,.56)));
  return max(shaft,arm);
 }`;

export function coastLampPoleShadowsActive(scene:THREE.Scene){return lighting.get(scene)?.poleShadows??false;}

const adapted=new WeakSet<THREE.Material>();
export function lightCoastMaterial(scene:THREE.Scene,material:THREE.Material,ground=false){
 const atlas=lighting.get(scene);
 if(!atlas||!(material instanceof THREE.MeshStandardMaterial)||adapted.has(material))return;
 adapted.add(material);
 const poleShadows=ground&&atlas.poleShadows;
 const previous=material.onBeforeCompile.bind(material),baseKey=material.customProgramCacheKey();
 material.onBeforeCompile=(shader,renderer)=>{
  previous(shader,renderer);
  shader.uniforms.coastLampHeads={value:atlas.texture};
  shader.uniforms.coastLampFirstZ={value:atlas.firstZ};
  // Keep the stock attenuation, BRDF and fog. Block only this fixture's
  // direct contribution on desktop ground receivers.
  shader.fragmentShader=shader.fragmentShader.replace('#include <lights_pars_begin>',`#include <lights_pars_begin>
   #if NUM_POINT_LIGHTS == 1
   uniform highp sampler2D coastLampHeads;
   uniform float coastLampFirstZ;
   ${poleShadows?poleOcclusionGLSL:''}
   void getCoastLampInfo(PointLight lamp,vec3 viewPos,out IncidentLight light){
    float z=cameraPosition.z+dot(viewMatrix[2].xyz,viewPos);
    int i=clamp(int(floor(z-coastLampFirstZ)),0,${atlas.cells-1});
    vec4 fixture=texelFetch(coastLampHeads,ivec2(i%${WIDTH},i/${WIDTH}),0);
    vec3 head=fixture.xyz;
    lamp.position=(viewMatrix*vec4(head,1.)).xyz;
    getPointLightInfo(lamp,viewPos,light);
    ${poleShadows?`if(light.visible){
     int poleId=int(fixture.w);
     vec4 pole=texelFetch(coastLampHeads,ivec2(poleId%${WIDTH},poleId/${WIDTH}),0);
     vec3 ray=transpose(mat3(viewMatrix))*(viewPos-lamp.position);
     light.color*=1.-.91*coastPoleBlock(ray,head,pole);
    }`:''}
   }
   #define getPointLightInfo(lamp,pos,result) getCoastLampInfo(lamp,pos,result)
   #endif`);
 };
 material.customProgramCacheKey=()=>baseKey+'-fixed-coast-lamps-'+atlas.cells+(poleShadows?'-pole':'');
 material.needsUpdate=true;
}
