import {DataTexture,LinearFilter,LinearMipmapLinearFilter,RepeatWrapping} from 'three';
import {seededRandom} from './vendor/three-stylized/utils';

/** A periodic field shared by the terrain and every grass batch. RG carries
 * broad gusts and eddies; BA carries blade marks and clump tone at a much
 * smaller world scale. Construct once, then let hardware filter both scales. */
export function createMeadowTexture(){
 const size=128,mask=size-1,rand=seededRandom(77209);
 const data=new Uint8Array(size*size*4),lattice=Float32Array.from({length:32*32},()=>rand());
 function noise(x:number,y:number,period:number){
  const ix=Math.floor(x),iy=Math.floor(y),m=period-1;
  let u=x-ix,v=y-iy;u*=u*(3-2*u);v*=v*(3-2*v);
  const a=lattice[(iy&m)*32+(ix&m)],b=lattice[(iy&m)*32+((ix+1)&m)];
  const c=lattice[((iy+1)&m)*32+(ix&m)],d=lattice[((iy+1)&m)*32+((ix+1)&m)];
  return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
 }
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,i=(y*size+x)*4;
  const broad=noise(4*u,4*v,4),cross=noise(4*u+2,4*v+1,4);
  const eddy=noise(8*(u+v)+broad,8*v+cross,8);
  const ripple=noise(16*u+eddy,16*(v-u),16);
  data[i]=255*(.60*broad+.30*eddy+.10*ripple);
  data[i+1]=255*(.55*cross+.32*ripple+.13*eddy);
  data[i+2]=66+37*rand();
  data[i+3]=255*noise(4*u+1,4*v+2,4);
 }
 // Tapered strokes wrap over both seams. Short neighbouring blades share
 // a general lean, while darker furrows remain visible between their tips.
 for(let i=0;i<1400;i++){
  const x=rand()*size,y=rand()*size,length=3+rand()*6,lean=(rand()-.35)*6;
  const tone=125+rand()*113;
  for(let j=0;j<length;j++){
   const t=j/length,col=Math.floor(x+lean*t*t)&mask,row=(Math.floor(y)-j)&mask;
   data[(row*size+col)*4+2]=tone*(.68+.32*t);
  }
 }
 const tile=new DataTexture(data,size,size);
 tile.name='coastal meadow wind and blades';
 tile.wrapS=tile.wrapT=RepeatWrapping;
 tile.magFilter=LinearFilter;tile.minFilter=LinearMipmapLinearFilter;
 tile.generateMipmaps=true;tile.needsUpdate=true;
 return tile;
}
