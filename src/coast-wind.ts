import {DataTexture,LinearFilter,RepeatWrapping,RGFormat} from 'three';
import {seededRandom} from './vendor/three-stylized/utils';
import {COAST_EFFECTS,type CoastWindStageEffects} from './content/coast-effects';

const WIND_SIZE=64;
// One deterministic RG8 texture serves both the GPU rice/flower shader and
// the CPU tire/dust emitters. No readPixels or per-frame GPU upload.
const WIND_DATA=(()=>{
 const rand=seededRandom(28491),data=new Uint8Array(WIND_SIZE*WIND_SIZE*2);
 for(let i=0;i<data.length;i++)data[i]=Math.floor(rand()*256);
 return data;
})();
export function createFarmWindTexture(){
 const texture=new DataTexture(WIND_DATA,WIND_SIZE,WIND_SIZE,RGFormat);
 texture.wrapS=texture.wrapT=RepeatWrapping;
 texture.magFilter=texture.minFilter=LinearFilter;
 texture.needsUpdate=true;
 return texture;
}

// World XZ direction; default [1,0] preserves accepted rice/flower motion.
const heading=COAST_EFFECTS.wind.direction;
export const COAST_WIND_HEADING_GLSL=`vec2(${heading[0].toFixed(4)},${heading[1].toFixed(4)})`;

// Original R8.6 GPU gust pattern, unchanged: streaming chunk seeks use the
// same world position + farmTime and therefore never reset local gust phase.
export const farmWindGLSL=/* glsl */`
 uniform float farmTime;
 uniform sampler2D farmWind;
 vec2 windNoise(vec2 p) {
  vec2 f=fract(p);
  return texture2D(farmWind,(floor(p)+f*f*(3.-2.*f)+.5)/${WIND_SIZE}.).rg*2.-1.;
 }
 vec2 farmGust(vec2 p) {
  vec2 broad=windNoise((p-vec2(9.3,1.7)*farmTime)/vec2(17.,32.));
  vec2 eddy=windNoise(mat2(.87,.5,-.5,.87)*(p-vec2(6.8,-1.3)*farmTime)/vec2(8.7,14.)+broad*.88);
  vec2 flutter=windNoise((p-vec2(4.4,2.1)*farmTime)/4.7+eddy*.65);
  return broad*vec2(.63,.44)+eddy*vec2(.35,.30)+flutter*vec2(.16,.15);
 }
`;

// CPU twin of windNoise() above: RG8 values, repeat wrapping and smooth
// bilinear lookup at texel centers. This is sampled ONCE per smoke pool/frame.
const wrap=(value:number)=>(value%WIND_SIZE+WIND_SIZE)%WIND_SIZE;
const smooth=(value:number)=>value*value*(3-2*value);
const channel=(x:number,z:number,c:number)=>WIND_DATA[(wrap(z)*WIND_SIZE+wrap(x))*2+c]/255*2-1;
function windNoise(x:number,z:number):[number,number]{
 const x0=Math.floor(x),z0=Math.floor(z),u=smooth(x-x0),v=smooth(z-z0);
 const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
 return [0,1].map(c=>mix(
  mix(channel(x0,z0,c),channel(x0+1,z0,c),u),
  mix(channel(x0,z0+1,c),channel(x0+1,z0+1,c),u),v)) as [number,number];
}
export function sampleCoastGust(x:number,z:number,time:number):[number,number]{
 const broad=windNoise((x-9.3*time)/17,(z-1.7*time)/32);
 const ex=x-6.8*time,ez=z+1.3*time;
 // GLSL mat2 is column-major.
 const eddy=windNoise((.87*ex-.5*ez)/8.7+broad[0]*.88,
  (.5*ex+.87*ez)/14+broad[1]*.88);
 const flutter=windNoise((x-4.4*time)/4.7+eddy[0]*.65,
  (z-2.1*time)/4.7+eddy[1]*.65);
 return [broad[0]*.63+eddy[0]*.35+flutter[0]*.16,
  broad[1]*.44+eddy[1]*.30+flutter[1]*.15];
}

/** Physical world XZ air velocity (m/s), independent of the sea FFT wind.
 * Consumers decide their own damping and buoyancy; the road never uses it. */
export function sampleCoastWind(
 x:number,z:number,time:number,wind:CoastWindStageEffects=COAST_EFFECTS.wind,
):{x:number;z:number}{
 const gust=sampleCoastGust(x,z,time);
 const dx=wind.direction[0],dz=wind.direction[1],sway=gust[1];
 const vx=dx-dz*sway,vz=dz+dx*sway,unit=1/Math.hypot(vx,vz);
 const speed=wind.speed*Math.max(0,1+wind.gustStrength*gust[0]);
 return {x:vx*unit*speed,z:vz*unit*speed};
}
 
/** A single hero-scale phase ridge, using the SAME wind direction, gust
 * texture and stage time as the detailed rice/flower deformation.
 * One extra sin per vertex; no new FFT, texture, pass or particle system. */
export const farmHeroWaveGLSL=/* glsl */`
 float farmHeroWave(vec2 worldXZ,vec2 gust,float wavelengthM,float speedMps){
  vec2 heading=${COAST_WIND_HEADING_GLSL};
  float advance=dot(worldXZ,heading)-speedMps*farmTime;
  float cross=dot(worldXZ,vec2(-heading.y,heading.x));
  return sin(6.2831853*advance/wavelengthM+cross*.011+gust.y*.9);
 }
`;
