import * as THREE from 'three';

/** One small repeating texture; no extra road geometry or material passes. */
export function asphaltTexture(){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;
 const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(256,512);let seed=7127;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<512;y++)for(let x=0;x<256;x++){
  const wear=8*Math.sin(x/256*Math.PI*6)*Math.cos(y/512*Math.PI*4)+5*Math.cos(y/512*Math.PI*10+x/256*Math.PI*2);
  const c=THREE.MathUtils.clamp(225+wear+(random()-.5)*25,0,255);pixels.data.set([c,c,c,255],(y*256+x)*4);
 }
 ctx.putImageData(pixels,0,0);
 // Irregular resurfaced strips, kept away from tile boundaries for seamless repetition.
 for(let i=0;i<7;i++){
  const x=15+random()*190,y=25+random()*420,w=12+random()*30,h=8+random()*38;
  ctx.fillStyle=`rgba(65,70,72,${.12+random()*.12})`;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w*.8,y-2);ctx.lineTo(x+w,y+h*.3);ctx.lineTo(x+w-3,y+h);ctx.lineTo(x+2,y+h-3);ctx.closePath();ctx.fill();
  if(i%3===0){ctx.strokeStyle='rgba(52,56,57,.24)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x,y+h+2);ctx.lineTo(x+w*.4,y+h+4);ctx.lineTo(x+w,y+h+1);ctx.stroke();}
 }
 const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.repeat.set(1/3.5,1/16);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
