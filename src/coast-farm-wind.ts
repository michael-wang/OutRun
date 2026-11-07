import {DataTexture,LinearFilter,RepeatWrapping,RGFormat} from 'three';
import {seededRandom} from './vendor/three-stylized/utils';

const WIND_SIZE=64;
export function createFarmWindTexture(){
 const rand=seededRandom(28491),data=new Uint8Array(WIND_SIZE*WIND_SIZE*2);
 for(let i=0;i<data.length;i++)data[i]=Math.floor(rand()*256);
 const texture=new DataTexture(data,WIND_SIZE,WIND_SIZE,RGFormat);
 texture.wrapS=texture.wrapT=RepeatWrapping;
 texture.magFilter=texture.minFilter=LinearFilter;
 texture.needsUpdate=true;
 return texture;
}

// Advect the whole gust pattern in metres, so adjacent terraces and both
// representations see the same wind even when a new plot streams in.
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
