import * as THREE from 'three';
import {seededRandom} from './vendor/three-stylized/utils';
import type {createTrack} from './track';

/** Sun-bleached gravel at the asphalt margin by the first flower fields.
 * One opaque, stationary batch. Gaps and cross-road depth vary by patch. */
export function addFarmShoulderCues(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],halfAt:(d:number)=>number) {
  const rand=seededRandom(7291),vertices:number[]=[],colors:number[]=[];
  const point=(d:number,inset:number)=>{
    const p=sample(d);
    const v=p.position.clone().addScaledVector(p.right,halfAt(d)-inset);
    v.y+=0.026;
    return v.toArray();
  };
  for(let d=1180;d<1760;d+=13+rand()*22){
    const count=2+Math.floor(rand()*4);
    for(let i=0;i<count;i++){
      const station=d+rand()*6,inset=.13+rand()*.5,length=.5+rand()*2.1,width=.09+rand()*.18;
      const tone=new THREE.Color().setHSL(.095,.12,.38+rand()*.15);
      const a=point(station,inset),b=point(station+.2,inset+width),c=point(station+length,inset+width*.8),e=point(station+length+.23,inset);
      vertices.push(...a,...b,...c,...a,...c,...e);
      for(let k=0;k<6;k++)colors.push(tone.r,tone.g,tone.b);
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
  mesh.name='farm-shoulder-gravel';scene.add(mesh);
}
