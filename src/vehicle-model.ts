import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export const TRAFFIC_TYPES=[{name:'car',speed:34,length:4.4,width:1.8,axle:1.4},{name:'bus',speed:22,length:8.6,width:2.35,axle:3.1},{name:'truck',speed:27,length:7.6,width:2.3,axle:2.7},{name:'waffle',speed:27,length:5.2,width:2.1,axle:1.7}] as const;
export function vehicleGeometry(type:number){
 const parts:THREE.BufferGeometry[]=[],spec=TRAFFIC_TYPES[type],body=type===0?'#ffffff':type===1?'#f3b443':'#e8e4d8',glass='#244954',rubber='#182426';
 const add=(g:THREE.BufferGeometry,color:string,x:number,y:number,z:number)=>{const raw=g.toNonIndexed();g.dispose();raw.deleteAttribute('uv');raw.translate(x,y,z);const c=new THREE.Color(color),colors=new Float32Array(raw.getAttribute('position').count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}raw.setAttribute('color',new THREE.BufferAttribute(colors,3));parts.push(raw);};
 const box=(w:number,h:number,l:number,color:string,x:number,y:number,z:number)=>add(new THREE.BoxGeometry(w,h,l),color,x,y,z);
 if(type===0){box(1.8,.65,4.4,body,0,.73,0);box(1.55,.65,2.25,body,0,1.32,-.2);box(1.4,.43,.03,glass,0,1.38,.94);box(1.4,.4,.03,glass,0,1.38,-1.34);for(const side of [-1,1]){box(.025,.42,1.88,glass,side*.785,1.38,-.2);box(.04,.48,.09,body,side*.8,1.38,-.2);}}
 else if(type===1){box(2.35,2.5,8.6,body,0,1.65,0);box(2.39,.32,8.58,'#d35b36',0,.82,0);box(2.12,.9,.03,glass,0,2.1,4.31);box(1.95,.7,.03,glass,0,2.1,-4.31);for(const side of [-1,1])for(let i=0;i<6;i++)box(.025,.85,1.02,glass,side*1.185,2.1,-3.3+i*1.3);box(2.1,.12,8.1,'#f6ead2',0,2.95,0);}
 else if(type===2){box(2.3,2.35,4.8,body,0,1.72,-1.25);box(2.25,1.9,2.5,'#3d8daa',0,1.48,2.4);box(2.04,.72,.03,glass,0,1.94,3.66);for(const side of [-1,1])box(.025,.72,1.55,glass,side*1.135,1.94,2.65);box(2.05,.3,.08,'#cbd5d0',0,.8,3.72);}
 else {
  box(2.1,.8,5.2,'#96c9ac',0,.85,0);box(1.95,1.45,1.7,'#fff0ca',0,1.6,1.65);box(1.72,.8,.03,glass,0,1.9,2.51);
  for(const side of [-1,1]){box(.03,.72,1.25,glass,side*.99,1.95,1.65);for(const z of [-2.35,.55])box(.13,1.8,.13,'#79ad92',side*.98,2,z);box(.16,.12,3,'#fff0ca',side*1.02,1.65,-.9);}
  box(2.3,.22,3.35,'#fff0ca',0,2.95,-.9);box(2.24,.28,.14,'#ffe3a2',0,2.76,-2.57);
  for(const side of [-1,1])for(let i=0;i<7;i++)box(.14,.25,.35,i%2?'#fff0ca':'#ffe3a2',side*1.1,2.76,-2.3+i*.46);
  box(1.85,.16,2.7,'#885b35',0,1.56,-.9);box(1.8,.72,.12,'#fff0ca',0,2.1,-2.48);
 }
 for(const side of [-1,1])for(const z of [-spec.axle,spec.axle]){const wheel=new THREE.CylinderGeometry(.4,.4,.24,10);wheel.rotateZ(Math.PI/2);add(wheel,rubber,side*(spec.width/2-.04),.4,z);const hub=new THREE.CylinderGeometry(.2,.2,.255,8);hub.rotateZ(Math.PI/2);add(hub,'#9aa8a6',side*(spec.width/2-.04),.4,z);}
 for(const side of [-1,1]){box(.4,.18,.04,'#fff2c0',side*(spec.width/2-.3),.75,spec.length/2+.03);box(.34,.17,.04,'#ca3434',side*(spec.width/2-.3),.7,-spec.length/2-.03);}
 const merged=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());return merged;
}
export function waffleSignTexture(){
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff0ca';ctx.fillRect(0,0,512,160);ctx.fillStyle='#503019';ctx.textAlign='center';ctx.font='bold 84px "Microsoft JhengHei", sans-serif';ctx.fillText('\u6674\u5929\u9b06\u9905',256,98);ctx.font='bold 26px sans-serif';ctx.fillText('SUNSHINE WAFFLES',256,140);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
   return texture;
}
export function waffleSignGeometry(){
   const rear=new THREE.PlaneGeometry(1.8,.72);rear.rotateY(Math.PI);rear.translate(0,2.1,-2.55);
   const sides=[-1,1].map(side=>{const g=new THREE.PlaneGeometry(2.6,.72);g.rotateY(side*Math.PI/2);g.translate(side*1.065,2.1,-.9);return g;});
   const geometry=mergeGeometries([rear,...sides])!;[rear,...sides].forEach(g=>g.dispose());return geometry;
}
