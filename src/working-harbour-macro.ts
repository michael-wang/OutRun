import * as THREE from 'three';
import {coastBeachX} from './coast-layout';
import {COAST_SEA_LEVEL,COAST_SHORE_OFFSET,coastBeachHeight} from './scenery-cross-section';
import {WORKING_HARBOUR as h,harbourRockWeight} from './working-harbour-profile';
import {addWorkingHarbourLighthouse} from './working-harbour-lighthouse';

type Sample=(station:number)=>{position:THREE.Vector3;right:THREE.Vector3};
type Piece={position:THREE.Vector3;size:THREE.Vector3;yaw:number;color:string;roll?:number};
const vec=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
const sea=COAST_SEA_LEVEL;

/** Proxy masses only. All plan positions are metres along/across this installation;
 * nothing depends on frame rate, procedural world changes or new asset downloads. */
export function addWorkingHarbourMacro(scene:THREE.Scene,sample:Sample){
 const root=new THREE.Group();root.name='working-harbour-whitebox';scene.add(root);
 const blocks:Piece[]=[],stones:Piece[]=[],hulls:Piece[]=[],scrub:Piece[]=[];
 const place=(s:number,out:number,y:number)=>{
  const d=h.entry+s,r=sample(d),x=coastBeachX(COAST_SHORE_OFFSET,d)-out;
  return r.position.clone().addScaledVector(r.right,x).setY(y);
 };
 const angle=(a:THREE.Vector3,b:THREE.Vector3)=>Math.atan2(b.x-a.x,b.z-a.z);
 const piece=(list:Piece[],pos:THREE.Vector3,size:THREE.Vector3,yaw:number,color:string,roll=0)=>{
  list.push({position:pos,size,yaw,color,roll});
 };
 const span=(list:Piece[],a:THREE.Vector3,b:THREE.Vector3,w:number,y:number,colour:string)=>{
  const depth=Math.hypot(a.x-b.x,a.z-b.z)+.6;
  piece(list,a.clone().lerp(b,.5),vec(w,y,depth),angle(a,b),colour);
 };
 const quayTop=sea+1.75;
 const shoreGround=(s:number,fraction:number)=>{
  const d=h.entry+s,r=sample(d),shore=coastBeachX(COAST_SHORE_OFFSET,d);
  const x=THREE.MathUtils.lerp(shore,-13,fraction);
  return r.position.clone().addScaledVector(r.right,x).setY(coastBeachHeight(x,r.position.y,r.right.y,d));
 };
 const quayFoundation=sea-5,quayDepth=quayTop-quayFoundation;
 // Continuous apron lower than the road, backed by the sampled coastal rock.
 // Chord increments follow the native road in the plan; deck uses world Y.
 for(let s=h.quayStart;s<h.quayEnd;s+=13){
  const e=Math.min(s+13,h.quayEnd);
  span(blocks,place(s,6.1,quayTop-quayDepth/2),place(e,6.1,quayTop-quayDepth/2),15,quayDepth,'#9b9081');
  span(blocks,place(s,13.35,quayTop-.19),place(e,13.35,quayTop-.19),.55,.38,'#d4bfa3');
 }
 // Grounded rubble strips, sparse and broad. The underlying surface is still
 // the contiguous Worker height field and uses the very same waterline.
 for(let d=h.rockStart+12;d<h.rockEnd;d+=12){
  const s=d-h.entry,w=harbourRockWeight(d);
  if(w<.08)continue;
  for(const i of [0,1,2]){
   if(i===0&&s>=h.quayStart-6&&s<=h.quayEnd+5)continue;
   const p=shoreGround(s+(i-1)*3,(i===0?.12:i===1?.35:.61)+Math.sin(d*.126+i)*.073);
   const spread=w*(i===0?5.6:i===1?8.8:5.5);
   piece(stones,p.add(vec(0,-.6,0)),vec(spread,(1.25+i*.72)*w,7.2+Math.sin(d)*2.1),.077*d,
    ['#827974','#777873','#8d7770'][Math.abs(Math.round(Math.sin(d)*100))%3],.28*Math.sin(d*.13));
  }
 }
 // Sparse ledge groups, not a pattern draped all over the rock face.
 const scrubBases:number[][]=[];
 for(const [s,t] of h.scrubSites){
  for(let i=0;i<3;i++){
   const at=s+(i===0?-3:i===1?3:8),side=t+Math.sin(i*2.9+s)*.052;
   const base=shoreGround(at,side);
   if(base.y<sea+1.45)continue;
   scrubBases.push([h.entry+at,side,...base.toArray()]);
   const width=i===0?2.9:1.6+Math.abs(Math.sin(s+i)),height=1.35+Math.abs(Math.cos(s*i+4));
   piece(scrub,base.clone().add(vec(0,height*.36,0)),vec(width,height,1.25+width*.42),s*.49+i,
    ['#637049','#727b4a','#6a6744'][(i+Math.abs(Math.round(s)))%3],.21*Math.sin(s));
  }
 }
 // The attached arm leads offshore, then guards the seaward side of the
 // working basin. Its far end is open: no complete wall across the entrance.
 const arm=h.breakwater.map(([s,x])=>place(s,x,sea+.52));
 for(let i=1;i<arm.length;i++){
  const a=arm[i-1],b=arm[i];span(blocks,a,b,5,3.7,'#777471');
  // The submerged core overlaps the seabed even at the outer 47 m reach.
  const foot=vec(0,-8.4,0);
  span(blocks,a.clone().add(foot),b.clone().add(foot),8.3,16,'#6d6863');
  const segments=Math.ceil(a.distanceTo(b)/4);
  for(let j=0;j<segments;j++){
   const p=a.clone().lerp(b,j/segments);
   piece(stones,p.add(vec(Math.sin(j*17+i)*1.75,-.85,Math.cos(j*13)*1.55)),
    vec(2.6,1.55+1.2*Math.abs(Math.sin(i+j)),3.3),j*2.1,'#7b716b',j*.29);
  }
 }
 // A work head on the downstream arm lets the derrick lead the vista before
 // the road passes it. The open end remains unobstructed.
 const {outerWorkS:s,outerWorkOut:o,outerWorkJoin}=h;
 const y0=sea+1.45;
 for(const [a,b,width] of [[place(s,o,y0-8.5),place(s,outerWorkJoin,y0-8.5),10],
                         [place(s-9,o,y0-8.5),place(s+7,o,y0-8.5),12]] as const)
  span(blocks,a,b,width,17,'#8b8984');
 const derrick=place(s,o,y0+.03);
 const boom=place(s-13,o-2,y0+11.9);
 const tip=place(s+5,o-12,y0+6.65);
 piece(blocks,derrick.clone().add(vec(0,5.15,0)),vec(1.45,10.3,1.45),0,'#b17b46');
 const truss=(a:THREE.Vector3,b:THREE.Vector3,thickness:number,color:string)=>{
  // Derive the roll with local X along the chord and keep the batch static.
  const horizontal=Math.hypot(b.x-a.x,b.z-a.z);
  const yaw=Math.atan2(a.z-b.z,b.x-a.x);
  const rise=Math.atan2(b.y-a.y,horizontal);
  piece(blocks,a.clone().lerp(b,.5),vec(a.distanceTo(b),thickness,thickness),yaw,color,rise);
 };
 const mastTop=derrick.clone().add(vec(0,10.25,0));
 truss(mastTop,boom,1.05,'#ab7140');
 truss(mastTop,tip,1.20,'#ab7140');
 truss(derrick.clone().add(vec(0,4.5,0)),tip,.48,'#635850');
 piece(blocks,tip.clone().add(vec(0,-2.3,0)),vec(.16,4.5,.16),0,'#453b31');
 // Staggered moorings with substantial trawler bows, longer working decks
 // and blocky wheelhouses. Sail Bay patrols remain independent.
 for(const [s,x,l] of h.berths){
  const y=angle(place(s-3,x,sea),place(s+3,x+3,sea));
  const p=place(s,x,sea+1.08);
  const f=vec(Math.sin(y),0,Math.cos(y));
  const hullWidth=l*.233;
  const hue=s<65?'#32646c':s<240?'#995843':'#536d66';
  piece(hulls,p,vec(hullWidth,3.55,l),y,hue);
  piece(blocks,p.clone().add(vec(0,1.33,0)),vec(hullWidth*.76,.48,l*.72),y,'#986f50');
  const deckhouse=p.clone().addScaledVector(f,-l*.12).add(vec(0,2.7,0));
  piece(blocks,deckhouse,vec(hullWidth*.75,2.6,l*.24),y,'#e3d6b9');
  piece(blocks,deckhouse.clone().addScaledVector(f,l*.068).add(vec(0,.58,0)),vec(hullWidth*.788,.75,l*.122),y,'#465d61');
  piece(blocks,deckhouse.clone().add(vec(0,1.49,0)),vec(hullWidth*.84,.4,l*.265),y,hue);
  piece(blocks,p.clone().addScaledVector(f,l*.133).add(vec(0,3.63,0)),vec(.29,5.15,.32),y,'#414749',-.12);
 }
 // A muted harbour palette: darker roofs hold the silhouettes, warm stone
 // joins the rock and blue-green painted steel distinguishes the ice shed.
 const sheds=[[-58,5,10,41,'#b5b4a7','#335f69'],[46,5,11,36,'#a7aba0','#55534b'],
  [179,5,10,32,'#a99d86','#50655d'],[291,5,11,30,'#b1a894','#66544a'],
  [380,5,9,23,'#b1a894','#5d5148']] as const;
 for(const [s,out,w,l,cladding,roof] of sheds){
  const y=angle(place(s-2,out,sea),place(s+2,out,sea));
  piece(blocks,place(s,out,quayTop+2.5),vec(w,5,l),y,cladding);
  piece(blocks,place(s,out,quayTop+5.15),vec(w+1.1,.55,l+1.3),y,roof);
 }
 // The first working beat is a blue ice shed with a short unloading canopy.
 // Keep the apron open; two intentionally uneven stacks show scale and use.
 const iceS=-57, apronOut=10.9;
 const along=(s:number,out:number)=>angle(place(s-2,out,sea),place(s+2,out,sea));
 const iceYaw=along(iceS,apronOut);
 piece(blocks,place(iceS,apronOut,quayTop+3.85),vec(4.95,.43,27),iceYaw,'#3e7178');
 piece(blocks,place(iceS,10.1,quayTop+1.74),vec(.22,3.15,17),iceYaw,'#3e4d4b');
 for(const z of [-69,-53,-45]){
  piece(blocks,place(z,12.53,quayTop+1.85),vec(.38,3.7,.39),iceYaw,'#45626a');
 }
 const crates=(s:number,out:number,paint:string,high:boolean)=>{
  const yaw=along(s,out);
  piece(blocks,place(s,out,quayTop+.62),vec(2.2,1.24,3.35),yaw,paint);
  piece(blocks,place(s+3.6,out+.5,quayTop+.46),vec(1.6,.92,2.55),yaw-.11,'#9d876b');
  if(high)piece(blocks,place(s+.55,out-.3,quayTop+1.58),vec(1.48,.68,2.0),yaw+.14,'#c2b496');
 };
 crates(-81,9.1,'#60857c',true);
 crates(-38,10.3,'#bcb49c',false);
 // Separate second beat: a small berth crane serving the moored workboats,
 // not a competing landmark. Load is suspended above open water.
 const loaderS=153,loaderOut=10.1;
 const loaderBase=place(loaderS,loaderOut,quayTop);
 piece(blocks,loaderBase.clone().add(vec(0,3.95,0)),vec(1.04,7.9,1.22),along(loaderS,loaderOut),'#ac8c49');
 const loaderHead=loaderBase.clone().add(vec(0,7.77,0));
 const loaderTip=place(loaderS+3,21,quayTop+6.34);
 truss(loaderHead,loaderTip,.72,'#ba994e');
 truss(loaderBase.clone().add(vec(0,4.65,0)),loaderTip,.37,'#736344');
 piece(blocks,loaderTip.clone().add(vec(0,-1.8,0)),vec(.15,3.6,.16),0,'#4a4841');
 piece(blocks,loaderTip.clone().add(vec(0,-3.92,0)),vec(2.3,.75,1.9),along(loaderS,loaderOut),'#85846b');
 crates(140,9.3,'#758b77',true);
 crates(160,8.6,'#b1a18a',false);
 const [bS,bOut]=h.breakwater[h.breakwater.length-1];
 const beacon=place(bS,bOut,sea+2.2);
 piece(blocks,beacon.clone().add(vec(0,1.35,0)),vec(1.6,2.7,1.6),0,'#84453f');
 const lightMaterial=new THREE.MeshBasicMaterial({color:'#ff9e78'});
 const light=new THREE.Mesh(new THREE.SphereGeometry(.61,8,6),lightMaterial);
 light.position.copy(beacon).add(vec(0,3.17,0));root.add(light);
 // Reuse the full-size, red-roofed gallery tower on the end headland.
 const [towerS,towerAcross]=h.lighthouse;
 const towerStation=h.entry+towerS;
 const towerLateral=THREE.MathUtils.lerp(coastBeachX(COAST_SHORE_OFFSET,towerStation),-13,towerAcross);
 const lighthouse=addWorkingHarbourLighthouse(root,sample,towerStation,towerLateral);
 const mesh=(g:THREE.BufferGeometry,p:Piece[])=>{
  const m=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({roughness:.88}),p.length);
  const o=new THREE.Object3D();
  p.forEach((a,i)=>{
   o.position.copy(a.position);o.scale.copy(a.size);
   o.rotation.set(0,a.yaw,a.roll??0);o.updateMatrix();m.setMatrixAt(i,o.matrix);
   m.setColorAt(i,new THREE.Color(a.color));
  });
  m.computeBoundingSphere();root.add(m);
 };
 mesh(new THREE.BoxGeometry(1,1,1),blocks);
 mesh(new THREE.IcosahedronGeometry(1,0),stones);
 const hull=new THREE.SphereGeometry(.5,7,4);mesh(hull,hulls);
 mesh(new THREE.DodecahedronGeometry(.65,0),scrub);
 return {root,inspect:{parts:stones.length+blocks.length+hulls.length+scrub.length+3,berths:h.berths.length,
  beacon:light.position.toArray(),outerDerrick:mastTop.toArray(),quayY:quayTop,scrubBases,
  lighthouse,composition:[{kind:'ice-shed',station:h.entry+iceS,anchor:place(iceS,apronOut,quayTop).toArray()},
   {kind:'loading-berth',station:h.entry+loaderS,anchor:loaderBase.toArray()}]},update:(station:number,time:number)=>{
  root.visible=station>=h.rockStart-450&&station<=h.rockEnd+100;
  const pulse=Math.pow(Math.max(0,Math.cos(time*Math.PI*.72)),7);
  lightMaterial.color.setRGB(.54+pulse*.46,.10+pulse*.52,.06+pulse*.28);
 }};
}
