import {it,expect} from 'vitest';
import * as THREE from 'three';
import {Traffic,TRAFFIC_TYPES} from '../src/traffic';
import {trafficPopulationAhead,trafficRevealIsHidden,TRAFFIC_REVEAL_BUFFER} from '../src/traffic-visibility';

const flat=(d:number)=>({
 position:new THREE.Vector3(0,0,d),
 right:new THREE.Vector3(1,0,0),
 tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
});
const fog=()=>new THREE.Fog('#a8796e',250,1450);
const cameraAt=(d:number,far=1400)=>{
 const camera=new THREE.PerspectiveCamera(47,915/412,.1,far);
 camera.position.set(0,3.6,d-9);
 camera.lookAt(0,1,d+120);
 camera.updateMatrixWorld(true);
 return camera;
};

it('starts traffic beyond both the mobile viewport and sunset fog, not at the old 850m boundary',()=>{
 const mobile=cameraAt(350),desktop=cameraAt(350,2200);
 expect(TRAFFIC_REVEAL_BUFFER).toBeGreaterThanOrEqual(180);
 expect(trafficPopulationAhead(mobile,fog())).toBeGreaterThan(1600);
 expect(trafficPopulationAhead(desktop,fog())).toBeGreaterThan(1600);
 expect(trafficPopulationAhead(mobile)).toBeGreaterThan(1600);
 expect(trafficPopulationAhead()).toBe(850); // old headless/replay contract
});

it('considers the chase camera viewport, whole vehicle silhouette and road crests',()=>{
 const camera=cameraAt(500),half=()=>7;
 expect(trafficRevealIsHidden(camera,flat,half,500,950,1.75,2,5,1.7,fog())).toBe(false);
 expect(trafficRevealIsHidden(camera,flat,half,500,950,850,2,5,1.7,fog())).toBe(true);
 expect(trafficRevealIsHidden(camera,flat,half,500,2400,1.75,2,5,1.7,fog())).toBe(true);
 expect(trafficRevealIsHidden(camera,flat,half,500,300,1.75,2,5,1.7,fog())).toBe(true);
 const hill=(d:number)=>({...flat(d),
  position:new THREE.Vector3(0,17*Math.exp(-(((d-715)/30)**2)),d),
 });
 expect(trafficRevealIsHidden(camera,hill,half,500,880,1.75,2,5,1.7,fog())).toBe(true);
 // A bright silhouette clipped by the shoulder is NOT sufficient occlusion;
 // the roof of a tall bus must be hidden before admitting it.
 const tinyHill=(d:number)=>({...flat(d),
  position:new THREE.Vector3(0,2*Math.exp(-(((d-715)/30)**2)),d),
 });
 expect(trafficRevealIsHidden(camera,tinyHill,half,500,880,1.75,2.35,8.6,2.95,fog())).toBe(false);
});

it('holds a newly ready actor until offscreen, then lets it drive into sight',()=>{
 const scene=new THREE.Scene();scene.fog=fog();
 let ready=false;
 const traffic=new Traffic(scene,flat,()=>8.75,10000,804,()=>ready,[],undefined,true,false,false,1234);
 const car=traffic.inspect().actors;
 expect(car).toHaveLength(0);
 const player=350,camera=cameraAt(player);
 traffic.update(0,player,0,60,camera);
 expect(traffic.inspect().actors.some(a=>!a.visible)).toBe(true);
 ready=true;
 traffic.update(.1,player,0,60,camera);
 // The first car would otherwise appear abruptly in the visible image.
 const seen=traffic.inspect().actors.filter(a=>a.visible&&a.distance<player+1100);
 expect(seen).toHaveLength(0);
 camera.lookAt(0,1,player-100); // looking backwards means the car is offscreen
 traffic.update(.2,player,0,60,camera);
 expect(traffic.inspect().actors.some(a=>a.visible)).toBe(true);
 traffic.dispose();
});

it('never first materializes a new car inside the visible chase-camera picture',()=>{
 const scene=new THREE.Scene();scene.fog=fog();
 const traffic=new Traffic(scene,flat,()=>8.75,10000,804,()=>true,[],undefined,true,false,false,2026);
 let prior=new Map<number,boolean>(),fresh=0;
 for(let step=0;step<=550;step++){
  const t=step*.10,player=350+80*t,camera=cameraAt(player);
  traffic.update(t,player,0,80,camera);
  for(const a of traffic.inspect().actors){
   if(step>0&&a.visible&&!prior.get(a.id)){
    fresh++;
    expect(trafficRevealIsHidden(camera,flat,()=>8.75,player,a.distance,
     a.lateral,TRAFFIC_TYPES[a.type].width,TRAFFIC_TYPES[a.type].length,
     a.type===1?2.95:a.type===0?1.65:3.1,scene.fog),
    'car '+a.id+' first shown on screen at '+Math.round(a.distance-player)+'m'
    ).toBe(true);
   }
  }
  prior=new Map(traffic.inspect().actors.map(a=>[a.id,a.visible]));
 }
 expect(fresh).toBeGreaterThan(1);
 for(const mesh of [
  scene.getObjectByName('vehicle-outline-car'),
  scene.getObjectByName('vehicle-crest-rim-car'),
  scene.getObjectByName('vehicle-crest-hint-0'),
 ] as THREE.Object3D[]){
  expect((mesh as THREE.Mesh).material).toHaveProperty('fog',true);
 }
 // The custom dusk halo shader is not a built-in fogged material. Its alpha
 // must fade toward the same horizon or tiny headlights still pop in first.
 const halos=scene.getObjectByName('traffic-running-light-halos') as THREE.Points;
 const material=halos.material as THREE.ShaderMaterial;
 expect(material.vertexShader).toContain('vLampFade');
 expect(material.vertexShader).toContain('smoothstep(950.0,1400.0');
 expect(material.fragmentShader).toContain('vLampFade');
 traffic.dispose();
});
