import * as THREE from 'three';
import {COAST_ULTRA_STAGE as stage} from './coast-ultra-stage';
import {COAST_BEACHES,COAST_SAND_POINTS} from './coast-layout';

// This authored coast is fixed. Bake it on the developer machine, not on phones.
// Bump the format version if the shoreline interpretation changes.
const version=1;
let hash=2166136261;
for(const c of JSON.stringify([version,stage.contentFingerprint,stage.length,stage.baseHeight,stage.roadWidth,stage.placements,COAST_BEACHES,COAST_SAND_POINTS]))hash=Math.imul(hash^c.charCodeAt(0),16777619);
export const COAST_SHORE_KEY=(hash>>>0).toString(16);
type Shore={texture:THREE.DataTexture;bounds:THREE.Vector4};

/** Lossless channel/byte planes and left deltas make the static mask compress well. */
export function packCoastShore(shore:Shore){
 const {width,height}=shore.texture.image,data=shore.texture.image.data as Uint16Array;
 const header=new TextEncoder().encode(JSON.stringify({version,key:COAST_SHORE_KEY,width,height,bounds:shore.bounds.toArray()})+'\n');
 const packed=new Uint8Array(header.length+data.byteLength);packed.set(header);let k=header.length;
 for(let c=0;c<4;c++)for(let byte=0;byte<2;byte++)for(let i=c;i<data.length;i+=4){
  packed[k++]=((data[i]-(i>=4?data[i-4]:0))&65535)>>(byte*8);
 }
 return packed;
}

export function unpackCoastShore(packed:Uint8Array):Shore{
 const end=packed.indexOf(10);
 if(end<0||end>1024)throw Error('Invalid coast mask header');
 const h=JSON.parse(new TextDecoder().decode(packed.subarray(0,end)));
 if(h.version!==version||h.key!==COAST_SHORE_KEY)throw Error('Coast mask is out of date; run npm run coast:shore');
 const {width,height}=h,n=width*height;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>4096||height>4096||packed.length!==end+1+n*8||!Array.isArray(h.bounds)||h.bounds.length!==4||!h.bounds.every(Number.isFinite))throw Error('Invalid coast mask data');
 const data=new Uint16Array(n*4);
 for(let c=0;c<4;c++){
  const offset=end+1+c*n*2;let previous=0;
  for(let i=0;i<n;i++)data[i*4+c]=previous=(previous+(packed[offset+i]|packed[offset+n+i]<<8))&65535;
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.HalfFloatType);
 texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
 return {texture,bounds:new THREE.Vector4().fromArray(h.bounds)};
}

export async function loadCoastShore(onProgress:(p:number)=>void){
 const response=await fetch(`${import.meta.env.BASE_URL}generated/coast-shore.shore?v=${COAST_SHORE_KEY}`,{cache:'no-cache'});
 if(!response.ok||!response.body)throw Error(`Coast mask download failed (${response.status})`);
 const total=Number(response.headers.get('content-length'))||0;let received=0;
 const progress=new TransformStream<Uint8Array<ArrayBuffer>,BufferSource>({transform(chunk,controller){received+=chunk.length;if(total)onProgress(Math.min(.75,.75*received/total));controller.enqueue(chunk);}});
 const decoded=await new Response(response.body.pipeThrough(progress).pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 onProgress(.85);
 await new Promise<void>(resolve=>setTimeout(resolve,0));
 const shore=unpackCoastShore(new Uint8Array(decoded));onProgress(1);return shore;
}
