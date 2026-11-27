import * as T from 'three';
import {grade} from './route.mjs';
export const stationCrossing=6860;
// A separate cross-city line above the terminal forecourt. The two reversing sidings
// are enclosed, so a parked spectator can watch the train leave and return.
export function addStationCrossing({scene,physicalPos,pose,link,market}){
 const at=stationCrossing,y=grade(at)+8.9,h=pose(at)[2],slant=.13;
 const origin=new T.Vector3(...physicalPos(at,0,y));
 const forward=new T.Vector3(Math.cos(h)+slant*Math.sin(h),0,-Math.sin(h)+slant*Math.cos(h)).normalize();
 const across=new T.Vector3(forward.z,0,-forward.x);
 const point=(along,side,height)=>origin.clone().addScaledVector(forward,along).addScaledVector(across,side).add(new T.Vector3(0,height,0)).toArray();
 const beam=(a,b,side,height,w,depth,kind,color)=>link(point(a,side,height),point(b,side,height),w,depth,kind,at,color,true);
 beam(-88,88,0,-.55,4.45,.92,'trim',0x8f9c94);
 for(const side of [-1,1]){
  beam(-88,88,side*2.1,-.10,.22,.52,'metal',0x536e72);
  beam(-88,88,side*.77,.012,.12,.12,'metal',0x63737a);
  for(const sign of [-1,1]){
   const lo=sign*36,hi=sign*88;
   beam(lo,hi,side*3.75,-1.95,.48,13.90,'plinth',0xaeb9ae);
   beam(lo,hi,side*4.01,.9,.10,.43,'metal',0x427777);
  }
 }
 for(const sign of [-1,1]){
  beam(sign*35,sign*88,0,5.07,8.38,.61,'canopy',0x6e8a87);
  const foot=point(sign*15.8,0,-8.9),head=point(sign*15.8,0,-1);
  link(foot,head,1.35,1.55,'post',at,0xadb4aa);
 }
 const cars=market.cars.map(car=>{const mesh=new T.Mesh(car.geometry,car.material);mesh.name='terminal cross-line carriage';scene.add(mesh);return mesh;});
 const joint=market.joint.clone();scene.add(joint);
 const heading=Math.atan2(forward.x,forward.z);
 let clock=null,lastD=-1,centre=-69;
 const consist=[...cars,joint];
 function update(d,elapsed){
  if(d<lastD-150||elapsed===0||d<at-500)clock=null;
  lastD=d;
  const visible=d>=at-640&&d<=at+320;
  for(const mesh of consist)mesh.visible=visible;
  if(!visible)return;
  if(clock===null&&d>=at-250)clock=elapsed-Math.max(0,d-(at-250))/62;
  if(clock===null)centre=-69;
  else centre=-69*Math.cos((elapsed-clock+2.15)*.285);
  cars.forEach((mesh,i)=>{mesh.position.fromArray(point(centre+(i?5.61:-5.61),0,.04));mesh.rotation.y=heading;});
  joint.position.fromArray(point(centre,0,1.68));joint.rotation.y=heading;
 }
 return {update,cars,get centre(){return centre;}};
}
