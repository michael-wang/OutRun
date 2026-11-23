import {it,expect} from 'vitest';
import * as THREE from 'three';
import {RoadCones} from '../src/road-cones';

it('does the same swept collision and renders the same in-flight and settled cone poses while omitting substep draw construction',()=>{
 const make=(defer:boolean)=>{
  let samples=0;
  const sample=(d:number)=>{
   samples++;
   return {position:new THREE.Vector3(0,d*.025,d),right:new THREE.Vector3(1,.04,0),tangent:new THREE.Vector3(0,.025,1).normalize(),roadHeading:0,curvature:0};
  };
  const scene=new THREE.Scene();
  const cones=new RoadCones(sample as any,()=>8.75,scene,804,5200,()=>true,undefined,true);
  const d=cones.recipe[0].distance;
  const lateral=cones.recipe[0].side*(8.75-cones.recipe[0].inset);
  const view=()=>scene.children.filter((o):o is THREE.InstancedMesh=>o instanceof THREE.InstancedMesh).map(o=>[
   o.name,o.count,Array.from(o.instanceMatrix.array.slice(0,16*o.count)),
  ]);
  return {cones,d,lateral,step:(t:number)=>{
    const previous={distance:d-4+(t-1/120)*52,lateral};
    return defer?cones.stepContacts(t,d-4+t*52,lateral,52,previous,1.14):cones.update(t,d-4+t*52,lateral,52,previous,1.14);
   },
   frame:(t:number)=>{cones.update(t,d-4+t*52,lateral,52);return {view:view(),props:cones.inspect()};},
   samples:()=>samples};
 };
 const a=make(false),b=make(true);
 let hit=0,flight=false,settled=false;
 try{
  for(let i=1;i<=620;i++){
   const t=i/120;
   const n=a.step(t);expect(b.step(t)).toBe(n);hit+=n;
   expect(b.cones.snapshot()).toEqual(a.cones.snapshot());
   if(i%4===0){
    const evidence=a.frame(t);expect(b.frame(t)).toEqual(evidence);
    flight||=evidence.props.flying.length>0;
    settled||=evidence.props.hit.some(id=>evidence.props.shown.includes(id)&&!evidence.props.flying.includes(id));
   }
  }
  expect(hit).toBeGreaterThan(0);
  expect(flight).toBe(true);
  expect(settled).toBe(true);
  expect(b.samples()).toBeLessThan(a.samples()*.4);
 }finally{a.cones.dispose();b.cones.dispose();}
});
