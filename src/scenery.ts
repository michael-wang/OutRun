import {roadOffset} from './road-profile';
import * as THREE from 'three';
import {ACTS,actWeights} from './acts';
import type {createTrack} from './track';
type Sample=ReturnType<typeof createTrack>['sample'];
const rand=(n:number)=>{const x=Math.sin(n*127.1+43.7)*43758.5453;return x-Math.floor(x);};
/** Original, baked roadside art. One instanced draw per geometry/material family. */
export function addJourneyScenery(scene:THREE.Scene,sample:Sample,length:number,theme?:number,seed=0,halfAt:(d:number)=>number=()=>7,customWeights?:(d:number)=>number[]){
 const weightsAt=(d:number)=>customWeights?customWeights(d):theme===undefined?actWeights(d):[0,1,2].map(i=>i===theme?1:0);
 const acts=theme===undefined?ACTS:ACTS.map((a,i)=>({...a,start:0,end:length,landmarks:i===theme?a.landmarks:[]}));
 const random=(n:number)=>rand(n+seed);
 const group=new THREE.Group();group.name='scenery';scene.add(group);
 const boxes=new THREE.BoxGeometry(1,1,1),round=new THREE.SphereGeometry(1,10,6),rock=new THREE.CylinderGeometry(.72,1,1,7,1),cylinder=new THREE.CylinderGeometry(1,1,1,10),cone=new THREE.ConeGeometry(1,1,10),arch=new THREE.TorusGeometry(1,.22,8,20,Math.PI);
 // Extend lab mesa bases below sea level (minimum 30-unit height × 8) so high slopes cannot expose flat bottoms.
 const mesaGeometry=Array.from({length:3},(_,seed)=>{const positions:number[]=[],colors:number[]=[],indices:number[]=[],rings=[[theme===undefined?0:-8,1],[.15,.96],[.32,.9],[.35,.86],[.55,.8],[.58,.77],[.78,.65],[1,.52]],sides=9;
 for(let j=0;j<rings.length;j++)for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2,r=rings[j][1]*(.87+random((i%sides)+seed*12)*.22),c=new THREE.Color(['#ac6946','#bd7c50','#c98d59','#d9a26d'][Math.floor(j/2)]);positions.push(Math.cos(a)*r,rings[j][0],Math.sin(a)*r);colors.push(c.r,c.g,c.b);}
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;indices.push(a,b,a+1,a+1,b,b+1);}const top=(rings.length-1)*(sides+1);for(let i=1;i<sides-1;i++)indices.push(top,top+i+1,top+i);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;});
 const materials=new Map<string,THREE.MeshStandardMaterial>(),buckets=new Map<string,{geometry:THREE.BufferGeometry;material:THREE.Material;matrices:THREE.Matrix4[]}>();
 const dummy=new THREE.Object3D(),quaternion=new THREE.Quaternion(),axis=new THREE.Vector3(0,1,0);
 let base=new THREE.Vector3(),yaw=0,chunk=0;
 const roadSamples=Array.from({length:Math.ceil(length/25)},(_,i)=>sample(i*25).position);
 function anchor(d:number,offset:number){chunk=Math.floor(d/650);const p=sample(d);base=p.position.addScaledVector(p.right,roadOffset(offset,halfAt(d)));if(offset>13)base.y-=offset<=75?.12+(offset-13)/62*2.88:3+(offset-75)/85*11;else if(offset>=-13)base.y-=.1;else if(offset>-27)base.y-=.1;else base.y=THREE.MathUtils.lerp(-5.05,base.y-2-Math.abs(offset)*.015,weightsAt(d)[1]);yaw=-p.roadHeading;}
 function clear(radius:number){return roadSamples.every((a,i)=>{const b=roadSamples[(i+1)%roadSamples.length],dx=b.x-a.x,dz=b.z-a.z,t=THREE.MathUtils.clamp(((base.x-a.x)*dx+(base.z-a.z)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(a.x+t*dx-base.x,a.z+t*dz-base.z)>radius+halfAt(i*25)+5;});}
 function part(g:THREE.BufferGeometry,color:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,rx=0,ry=0,rz=0){
  let material=materials.get(color);if(!material){material=new THREE.MeshStandardMaterial({color,roughness:.85,vertexColors:!!g.getAttribute('color')});materials.set(color,material);}
  quaternion.setFromAxisAngle(axis,yaw);dummy.position.set(x,y,z).applyQuaternion(quaternion).add(base);dummy.rotation.set(rx,ry,rz);dummy.quaternion.premultiply(quaternion);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();
  const key=g.uuid+color+':'+chunk;let b=buckets.get(key);if(!b){b={geometry:g,material,matrices:[]};buckets.set(key,b);}b.matrices.push(dummy.matrix.clone());
 }
 function palm(seed:number){const h=7+random(seed)*4;part(cylinder,'#aa8960',0,h/2,0,.23,h,.23,0,0,-.035);for(let j=0;j<7;j++){const a=j*Math.PI*2/7;part(round,'#287b52',Math.sin(a)*1.7,h,Math.cos(a)*1.7,.7,.24,3.3,.15,a,0);}}
 function dryTree(seed:number){const h=4+random(seed)*2;part(cylinder,'#82634a',0,h/2,0,.22,h,.22);for(const side of [-1,1]){part(cylinder,'#82634a',side*.75,h*.75,0,.13,h*.65,.13,0,0,-side*.55);part(round,'#8d9254',side*1.4,h,0,1.2,.6,1);}}
 function mesa(seed:number,large=false){const w=(large?32:18)+random(seed)*15,h=(large?65:30)+random(seed+1)*30;part(mesaGeometry[Math.abs(seed)%3],'#ffffff',0,0,0,w,h,w*.8,0,random(seed)*6);}
 function building(seed:number,far=false,coastal=false){const w=7+random(seed)*6,h=coastal?5+random(seed+1)*4:(far?28:9)+random(seed+1)*(far?42:18),depth=8+random(seed+2)*5,color=['#eed6b4','#e6a48b','#a9c9bf','#e3c286','#d7b9bf'][Math.floor(random(seed+4)*5)];
  if(theme!==undefined)part(boxes,color,0,-1.5,0,w,3,depth);part(boxes,color,0,h/2,0,w,h,depth);part(boxes,'#f3e6cd',0,h+.25,0,w+.7,.5,depth+.7);part(boxes,color,w*.12,h+2,0,w*.65,4,depth*.7);part(boxes,'#bb7960',w*.12,h+4.1,0,w*.7,.25,depth*.75);
  for(let floor=0;floor<Math.floor(h/3.2);floor++)for(const x of [-.3,0,.3]){part(boxes,'#426d77',x*w,2+floor*3.2,-depth/2-.035,w*.13,1.35,.07);if(!far&&floor%2===1)part(boxes,'#eee1bd',x*w,1.2+floor*3.2,-depth/2-.35,w*.2,.16,.8);}
  if(!coastal&&seed%3===0){part(cylinder,'#8eb4b4',w*.12,h+5.5,0,w*.28,3,w*.28);part(round,'#719d9f',w*.12,h+7,0,w*.3,1.8,w*.3);}else if(!coastal&&seed%3===1){for(let fin=0;fin<3;fin++)part(boxes,'#ede5c9',w*.12+(fin-1)*w*.2,h+5,0,.35,2.2,depth*.7);}else if(coastal){part(cone,'#bd7d59',w*.12,h+4.8,0,w*.46,2,depth*.46,0,Math.PI/4);}
  if(!far){part(boxes,'#347f78',0,3,-depth/2-.8,w*.8,.18,1.8, .08);part(boxes,'#e5d7b9',0,.15,-depth/2-1.5,w+2,.3,3);}
 }
 // Overlap prop families deterministically at each boundary; nothing spawns per frame.
 for(let d=16,i=0;d<length;d+=30,i++){
  const weights=weightsAt(d),family=random(i+300)<weights[0]?0:random(i+300)<weights[0]+weights[1]?1:2;
  if(family===0){anchor(d,17+random(i)*6);if(clear(4))palm(i);if(i%3===0){anchor(d,36+random(i)*10);if(clear(12))building(i,false,true);}}
  if(family===1&&i%7===0){for(const side of [-1,1]){anchor(d,side*(280+random(i)*90));if(clear(110)){base.y=-8;part(mesaGeometry[i%3],'#ffffff',0,0,0,90,150+random(i)*80,80,0,random(i)*6);}}}
  if(family===1){for(const side of [-1,1]){anchor(d,side*(19+random(i+side)*10));if(clear(3))dryTree(i);if(i%3===0){anchor(d,side*(75+random(i)*25));if(clear(43)&&!acts[1].landmarks.some(l=>Math.abs(d-(acts[1].start+(acts[1].end-acts[1].start)*l.fraction))<180))mesa(i+side);}anchor(d,side*(halfAt(d)<7?12.5:15));part(boxes,'#bd8e62',0,.65,0,.8,1.3,12,theme===undefined?0:-Math.atan2(sample(d).tangent.y,Math.hypot(sample(d).tangent.x,sample(d).tangent.z)));}}
  if(family===2){for(const side of [-1,1]){anchor(d,side*17);part(cylinder,'#3d646a',0,4,0,.12,8,.12);part(boxes,'#3d646a',0,8,-.65,.16,.16,1.4);part(round,'#ffedba',0,7.85,-1.3,.45,.2,.5);if(i%2===0){anchor(d+10,side*20);part(cylinder,'#876b52',0,2.6,0,.22,5.2,.22);part(round,'#4a8256',0,5.5,0,2.3,2.6,2.3);}}
   anchor(d,32+random(i)*10);if(clear(13)&&!acts[2].landmarks.some(l=>Math.abs(d-(acts[2].start+(acts[2].end-acts[2].start)*l.fraction))<170))building(i);if(i%3===0){anchor(d,140+random(i)*80);if(clear(18))building(i+100,true);}
  }
  // Coast cliffs and low green scrub also vary within the coastal act.
  if(family===0&&i%2===0){anchor(d,70+random(i)*25);if(clear(38)){part(rock,'#c3b794',0,theme===undefined?10:4,0,30,theme===undefined?28:40,26,0,random(i)*6);part(round,'#628350',-8,22,0,12,2,14);}}
 }
 for(const act of acts)for(let index=0;index<act.landmarks.length;index++){
  const landmark=act.landmarks[index],d=act.start+(act.end-act.start)*landmark.fraction;anchor(d,landmark.offset);
  if(act.id==='coast'&&index===0){base.y=sample(d).position.y-1;part(rock,'#c3b794',0,-(base.y+5)/2,0,13,base.y+5,12);part(cylinder,'#ede4c7',0,9,0,3.3,18,3.3);part(cylinder,'#b65d43',0,14,0,3.38,1.8,3.38);part(cylinder,'#f4e9cc',0,18,0,4.3,1,4.3);part(cylinder,'#416e79',0,20,0,2.3,3,2.3);part(cone,'#bd6848',0,22.5,0,3.9,2.5,3.9);part(boxes,'#eee0b9',5,2,0,6,4,5);}
  if(act.id==='coast'&&index===1){base.y=-3;for(const dx of [-16,16]){part(boxes,'#f4e7c8',dx,0,0,14,2,4);part(cylinder,'#705b4a',dx,10,0,.15,20,.15);part(cone,'#fff0d0',dx+3,10,0,6,17,.25,0,0,-.18);}}
  if(act.id==='canyon'&&index===0){for(const x of [-18,18])part(rock,'#c88754',x,16,0,6,32,7);part(arch,'#cf955e',0,29,0,18,18,18);part(rock,'#dfad73',-21,5,2,12,10,12);}
  if(act.id==='canyon'&&index===1){mesa(77,true);const original=base.clone();base.x+=38;mesa(91,true);base.copy(original);}
  if(act.id==='city'&&index===0){base.y=sample(d).position.y-.15;part(boxes,'#c6b995',0,-(base.y+5)/2,0,18,base.y+5,20);part(boxes,'#eed7ac',0,22,0,9,44,9);part(boxes,'#d49969',0,44,0,11,1,11);part(cylinder,'#f2e3bf',0,47,0,4.5,5,4.5);part(round,'#548e92',0,50,0,5,3,5);part(cylinder,'#eee6ce',0,39,-4.6,2.6,.15,2.6,Math.PI/2);part(boxes,'#375a63',0,39.7,-4.72,.18,1.7,.18);part(boxes,'#375a63',.7,39,-4.72,1.5,.18,.18);}
  if(act.id==='city'&&index===1){for(const x of [-20,20]){part(boxes,'#4b8090',x,19,0,2,38,2);part(boxes,'#dfb65c',x-10,37,0,36,1.2,1.2);part(cylinder,'#647a7b',x-25,24,0,.07,25,.07);part(boxes,'#d38e6a',x,2,6,14,4,6);}}
 }
 for(const b of buckets.values()){const mesh=new THREE.InstancedMesh(b.geometry,b.material,b.matrices.length);b.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.receiveShadow=true;mesh.castShadow=false;group.add(mesh);}
 return {instances:[...buckets.values()].reduce((n,b)=>n+b.matrices.length,0),draws:buckets.size};
}
