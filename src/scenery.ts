import {COAST_BEACHES,COAST_ROCKS,coastRockX} from './coast-layout';
import type {CoastShadowGroup} from './coast-shadow-layers';
import {COAST_VILLAGE_SITES,COAST_REST_SPOTS} from './coast-village-layout';
import {buildCoastTownStreets} from './coast-town-streets';
import {coastHomeFacingYaw} from './coast-house-facing';
import {FARM_HOMES} from './coast-farm-layout';
import {COAST_RURAL_SHOWCASE,COAST_RURAL_HOUSES,RURAL_CREEK,ruralShowcaseReplacesFarmHome} from './coast-rural-layout';
import {buildCoastRuralHouse,buildCoastRuralCreek} from './coast-rural-vignette';
import {COAST_DRAIN_X,COAST_UTILITY_POLES,coastDrainOverlaps,coastPoleLinks} from './coast-roadside-layout';
import {buildCoastRoadsideDrain,buildCoastRoadsideWater,buildCoastUtilityWires} from './coast-roadside-geometry';
import {vehicleGeometry,waffleSignGeometry,waffleSignTexture} from './vehicle-model';
import type {BridgeSpan} from './bridge';
import type {RockySection} from './rocky-shoulder';
import {canyonBend,canyonBlend} from './canyon-identity';
import {RoadClearance} from './road-clearance';
import {interchangeSceneryClear,type RoadInterchange} from './road-interchange';
import {roadOffset,roadObjectOffset,coastalCliffDropAtLateral,type Shoulders} from './road-profile';
import * as THREE from 'three';
import {ACTS,actWeights} from './acts';
import type {createTrack} from './track';
import {canyonSceneEnvelope,canyonGroundY,type GrandCanyonScene} from './grand-canyon-scene';
import {canyonPropSlots,type CanyonPropSlot} from './canyon-language';
import type {DesignedProp,DesignerCut} from './designer-canyon';
import {sceneryGroundMixAt,sceneryGroundY,coastUltraGroundY,coastBeachHeight,COAST_SEA_LEVEL,scenerySectionAt,sceneryFarReach,type ScenerySection} from './scenery-cross-section';
type Sample=ReturnType<typeof createTrack>['sample'];
const rand=(n:number)=>{const x=Math.sin(n*127.1+43.7)*43758.5453;return x-Math.floor(x);};
/** No freestanding city blocks over the water cut-out and unsupported bridge approaches.
 * Ordinary city placement resumes once the roadway has rejoined continuous land. */
export function bridgeApproachAllowsBuilding(d:number,bridge?:BridgeSpan){
 // Leave landings clear until the cut-out coastline has fully resumed beyond the bridge.
 return !bridge||d<bridge.start-280||d>bridge.end+1000;
}
/** Biome-driven landmarks. Shared by Worker scenery generation and QA navigation. */
export type JourneyLandmarkKind='clock'|'lighthouse'|'canyon-arch';
export interface JourneyLandmark {distance:number;kind:JourneyLandmarkKind;companions:number}
export const CLOCK_DISTRICT_COMPANIONS=3;
export const CLOCK_TOWER_SHAFT_HEIGHT=58;
export const LIGHTHOUSE_MIN_HEIGHT=38;
/** A natural roadside sandstone arch must read clearly from the chase camera.
 * The near pillar stays well outside the protective rail, even on a wide road. */
export const CANYON_ARCH=Object.freeze({
 offset:48,span:38,springHeight:29,rise:29,footingDepth:19,
 stone:'#b47b53',crown:'#e3ac76',
});
export function canyonArchProfile(roadHeight:number){
 return {foot:roadHeight-CANYON_ARCH.footingDepth,
  spring:roadHeight+CANYON_ARCH.springHeight,
  crown:roadHeight+CANYON_ARCH.springHeight+CANYON_ARCH.rise};
}
/** Guaranteed high ground and a continuous rock column to below sea level.
 * Local lighthouse parts are placed relative to the coastal anchor's sunk Y. */
export function lighthouseProfile(roadHeight:number,variation=0){
 const rockTop=roadHeight+10,rockBottom=Math.min(-12,rockTop-26);
 const towerHeight=LIGHTHOUSE_MIN_HEIGHT+variation*5;
 return {rockTop,rockBottom,towerHeight,roofTop:rockTop+towerHeight+7.5};
}
export const CLOCK_COMPANION_COLOR='#bda98e';
const LANDMARK_SPACING:Record<JourneyLandmarkKind,number>={
 clock:1350,lighthouse:2500,'canyon-arch':3200,
};
function landmarkBiome(weights:readonly number[]):JourneyLandmarkKind|null{
 const strongest=Math.max(...weights),index=weights.indexOf(strongest);
 if(strongest<.78)return null;return index===2?'clock':index===0?'lighthouse':index===1?'canyon-arch':null;
}
export function planJourneyLandmarks(length:number,weightsAt:(d:number)=>readonly number[],bridge?:BridgeSpan):JourneyLandmark[]{
 // Find contiguous environment runs first. Distances position landmarks *within*
 // each biome, instead of deciding which structures belong in the world.
 const step=200,runs:{start:number;end:number;kind:JourneyLandmarkKind|null}[]=[];
 for(let start=0;start<length;start+=step){
  const end=Math.min(length,start+step),kind=landmarkBiome(weightsAt((start+end)/2)),last=runs.at(-1);
  if(last?.kind===kind)last.end=end;
  else runs.push({start,end,kind});
 }
 const sites:JourneyLandmark[]=[];
 for(const run of runs){
  if(!run.kind)continue;
  const padding=run.kind==='clock'?280:run.kind==='lighthouse'?500:650;
  const usable=run.end-run.start-2*padding;
  if(usable<350)continue;
  const count=Math.max(1,Math.round(usable/LANDMARK_SPACING[run.kind]));
  for(let i=0;i<count;i++){
   const distance=Math.round((run.start+padding+(i+.5)*usable/count)/25)*25;
   if(distance<900||distance>length-400||!bridgeApproachAllowsBuilding(distance,bridge))continue;
   if(landmarkBiome(weightsAt(distance))!==run.kind)continue;
   sites.push({distance,kind:run.kind,companions:run.kind==='clock'?CLOCK_DISTRICT_COMPANIONS:0});
  }
 }
 return sites.sort((a,b)=>a.distance-b.distance);
}
/** Original, baked roadside art. One instanced draw per geometry/material family. */
export function addJourneyScenery(scene:THREE.Scene,sample:Sample,length:number,theme?:number,seed=0,halfAt:(d:number)=>number=()=>7,customWeights?:(d:number)=>number[],range:{start:number;end:number;roadSamples?:THREE.Vector3[];openRoad?:boolean;clearance?:RoadClearance;rocky?:boolean;rockSections?:readonly RockySection[];shoulders?:(d:number)=>Shoulders;bridge?:BridgeSpan;junction?:RoadInterchange;landmarkSites?:readonly JourneyLandmark[];scenerySections?:readonly ScenerySection[];denseCity?:boolean;canyonPrototype?:GrandCanyonScene;designerCut?:DesignerCut;coastUltra?:boolean}={start:0,end:length}){
 const weightsAt=(d:number)=>customWeights?customWeights(d):theme===undefined?actWeights(d):[0,1,2].map(i=>i===theme?1:0);
 const acts=theme===undefined?ACTS:ACTS.map((a,i)=>({...a,start:0,end:length,landmarks:!range.openRoad&&i===theme?a.landmarks:[]}));
 const canyon=range.openRoad&&seed===1;
 const random=(n:number)=>rand(n+seed);
 const group=new THREE.Group();group.name='scenery';scene.add(group);
 const boxes=new THREE.BoxGeometry(1,1,1),round=new THREE.SphereGeometry(1,10,6),rock=new THREE.CylinderGeometry(.72,1,1,7,1),cylinder=new THREE.CylinderGeometry(1,1,1,10),cone=new THREE.ConeGeometry(1,1,10),arch=new THREE.TorusGeometry(1,.22,8,20,Math.PI);
 // Extend lab mesa bases below sea level (minimum 30-unit height × 8) so high slopes cannot expose flat bottoms.
 const mesaGeometry=Array.from({length:3},(_,seed)=>{const positions:number[]=[],colors:number[]=[],indices:number[]=[],rings=[[theme===undefined?0:-8,1],[.15,.96],[.32,.9],[.35,.86],[.55,.8],[.58,.77],[.78,.65],[1,.52]],sides=9;
 for(let j=0;j<rings.length;j++)for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2,r=rings[j][1]*(.87+random((i%sides)+seed*12)*.22),c=new THREE.Color(['#ac6946','#bd7c50','#c98d59','#d9a26d'][Math.floor(j/2)]);positions.push(Math.cos(a)*r,rings[j][0],Math.sin(a)*r);colors.push(c.r,c.g,c.b);}
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;indices.push(a,b,a+1,a+1,b,b+1);}const top=(rings.length-1)*(sides+1);for(let i=1;i<sides-1;i++)indices.push(top,top+i+1,top+i);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;});
 const boulder=new THREE.IcosahedronGeometry(1,1);const vertices=boulder.getAttribute('position');for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i),r=.86+rand(Math.round(x*31+y*47+z*59))*.23;vertices.setXYZ(i,x*r,y*r,z*r);}boulder.computeVertexNormals();boulder.name='roadside-rock';
 const materials=new Map<string,THREE.MeshStandardMaterial>(),buckets=new Map<string,{geometry:THREE.BufferGeometry;material:THREE.Material;matrices:THREE.Matrix4[];shadowGroup:CoastShadowGroup}>();
  let coastShadowGroup:CoastShadowGroup='other';
 const dummy=new THREE.Object3D(),quaternion=new THREE.Quaternion(),axis=new THREE.Vector3(0,1,0);
 let base=new THREE.Vector3(),yaw=0,chunk=0,bridgeGap=false,roadsideDrop=0,anchorDistance=0,anchorRight=false,ordinaryProps=false;
 const roadSamples=range.roadSamples??Array.from({length:Math.ceil(length/25)},(_,i)=>sample(i*25).position);
 const landmarkSites=range.openRoad?(range.landmarkSites??planJourneyLandmarks(length,weightsAt,range.bridge)):[];
 // Only nearby ordinary buildings are kept low: the three authored clock companions remain.
 const nearClock=(d:number)=>landmarkSites.some(site=>site.kind==='clock'&&Math.abs(site.distance-d)<145);
 function anchor(d:number,offset:number){anchorDistance=d;anchorRight=offset>0;roadsideDrop=0;chunk=Math.floor(d/650);bridgeGap=!!range.bridge&&d>=range.bridge.start-35&&d<=range.bridge.end+35;const p=sample(d),roadY=p.position.y;base=p.position.addScaledVector(p.right,roadObjectOffset(offset,halfAt(d),range.shoulders?.(d)));if(offset>13)base.y-=offset<=75?.12+(offset-13)/62*2.88:3+(offset-75)/85*11;else if(offset>=-13)base.y-=.1;else if(offset>-27)base.y-=.1;else base.y=THREE.MathUtils.lerp(-5.05,base.y-2-Math.abs(offset)*.015,weightsAt(d)[1]);if(range.shoulders){const q=sample(d),widths=range.shoulders(d),half=halfAt(d),x=roadObjectOffset(offset,half,widths),width=x<0?widths.left:widths.right,extra=Math.abs(x)-half,raw=Math.sign(x)*(extra<=width?7+extra*6/width:13+extra-width);base.copy(q.position).addScaledVector(q.right,x);
   roadsideDrop=coastalCliffDropAtLateral(q.position.y,q.right.y,x,half,widths,weightsAt(d)[1]);
   if(raw>=13)base.y-=raw<=75?.12+(raw-13)/62*2.88:3+(raw-75)/85*11;
   else if(raw>=-13)base.y-=.1;
   else if(raw>-27){const near=q.position.y+q.right.y*roadOffset(-13,half,widths)-.1,far=q.position.y+q.right.y*roadOffset(-27,half,widths),coast=THREE.MathUtils.lerp(-5.05,far-2-27*.015,weightsAt(d)[1]);base.y=THREE.MathUtils.lerp(near,coast,(-raw-13)/14);}
   else base.y=THREE.MathUtils.lerp(-5.05,base.y-2-Math.abs(raw)*.015,weightsAt(d)[1]);
  }
  if(range.scenerySections){
   // Use the same absolute-distance terrain function as Road Worker meshes.
   // This keeps far buildings and canyon mesas rooted in their actual shelf.
   const half=halfAt(d),widths=range.shoulders?.(d),mix=sceneryGroundMixAt(range.scenerySections,d);
   const physical=(o:number)=>roadObjectOffset(o,half,widths);
   base.y=sceneryGroundY(offset,roadY,p.right.y,physical,weightsAt(d)[1],mix);
   const projected=roadY+p.right.y*physical(offset);
   if(range.coastUltra)base.y=coastUltraGroundY(offset,roadY,p.right.y,physical,d);
   roadsideDrop=Math.max(0,projected-base.y);
  }
  if(range.canyonPrototype){
   const old=base.y;
   base.y=canyonGroundY(range.canyonPrototype,d,offset,roadY,old);
   roadsideDrop=Math.max(0,roadY+p.right.y*roadObjectOffset(offset,halfAt(d),range.shoulders?.(d))-base.y);
  }
  yaw=-p.roadHeading;}
 const clearance=range.clearance??new RoadClearance(roadSamples,halfAt,range.openRoad);
 function clear(radius:number){return clearance.clear(base,radius);}
 function farSupported(d:number,raw:number){return !range.scenerySections||Math.abs(raw)<sceneryFarReach(sample(d).curvature)-12;}
 const insideCanyonPrototype=(d:number)=>!!range.canyonPrototype&&canyonSceneEnvelope(range.canyonPrototype,d)>.35;
 const canyonR21=(d:number)=>!!range.canyonPrototype?.vista&&canyonSceneEnvelope(range.canyonPrototype,d)>.33;
 function canyonScatter(site:CanyonPropSlot){
  const scale=site.scale;
  anchor(site.distance,site.offset);
  const safe=(r:number)=>bridgeApproachAllowsBuilding(site.distance,range.bridge)&&clear(r);
  switch(site.kind){
   case 'talus':
    if(!safe(5*scale))break;
    part(boulder,'#a76d4e',0,1.2*scale,0,5*scale,3.1*scale,4.2*scale,
     0,random(Math.round(site.distance))*Math.PI,0);
    part(boulder,'#ce9b70',3*scale,.45*scale,2*scale,2.4*scale,1.2*scale,2.1*scale);
    break;
   case 'sage':
    if(!safe(3*scale))break;
    part(round,'#80845a',0,.6*scale,0,2.5*scale,1.15*scale,2.15*scale);
    part(round,'#a2a271',1.9*scale,.42*scale,1.2*scale,1.6*scale,.8*scale,1.8*scale);
    break;
   case 'scree-bank':
    if(!safe(13*scale))break;
    part(mesaGeometry[Math.abs(Math.round(site.distance/30))%3],
     '#b88765',0,-3.5*scale,0,15*scale,10*scale,22*scale);
    break;
   case 'road-post':
    if(!safe(1.8))break;
    part(boxes,'#82684c',0,.55*scale,0,.45,1.1*scale,.48);
    part(boxes,'#d8bc86',0,1.04*scale,0,.55,.16,.58);
    break;
   case 'low-terrace':
    if(!safe(35*scale))break;
    // Broad, low-slung bank anchored below terrain, not a vertical column.
    part(mesaGeometry[Math.abs(Math.round(site.distance/30)+3)%3],
     '#a88a72',0,-6*scale,0,40*scale,13*scale,65*scale);
    break;
  }
 }
 function part(g:THREE.BufferGeometry,color:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,rx=0,ry=0,rz=0,emission=0){
  if(bridgeGap||(ordinaryProps&&anchorRight&&range.junction&&interchangeSceneryClear(range.junction,anchorDistance,1)))return;
  const materialKey=color+':'+emission+':'+!!g.getAttribute('color')+':'+!!g.userData.waffleSign;let material=materials.get(materialKey);if(!material){material=new THREE.MeshStandardMaterial({color,roughness:.85,vertexColors:!!g.getAttribute('color'),emissive:emission?color:0,emissiveIntensity:emission});if(g.userData.waffleSign&&typeof document!=='undefined')material.map=waffleSignTexture();materials.set(materialKey,material);}
  quaternion.setFromAxisAngle(axis,yaw);dummy.position.set(x,y,z).applyQuaternion(quaternion).add(base);dummy.rotation.set(rx,ry,rz);dummy.quaternion.premultiply(quaternion);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();
  const groupForPart:CoastShadowGroup=!range.coastUltra?'other':g===boulder||g===rock?'rocks':coastShadowGroup;
   // Do not batch a home and a beach bench into the same shadow group.
   const key=g.uuid+materialKey+':'+chunk+':'+groupForPart;
   let b=buckets.get(key);if(!b){b={geometry:g,material,matrices:[],shadowGroup:groupForPart};buckets.set(key,b);}
   b.matrices.push(dummy.matrix.clone());
 }
 function palm(seed:number){const previous=coastShadowGroup;coastShadowGroup='vegetation';const h=7+random(seed)*4;part(cylinder,'#aa8960',0,h/2,0,.23,h,.23,0,0,-.035);for(let j=0;j<7;j++){const a=j*Math.PI*2/7;part(round,'#287b52',Math.sin(a)*1.7,h,Math.cos(a)*1.7,.7,.24,3.3,.15,a,0);}coastShadowGroup=previous;}
 // Coast-only props still use the existing Worker/instance buckets and clearance.
 function beachAnchor(d:number,x:number){
  anchor(d,x);const p=sample(d);base.copy(p.position).addScaledVector(p.right,x);
  base.y=coastBeachHeight(x,p.position.y,p.right.y,d);
 }
 function beachPerson(key:number,playing=false,size=1){const previous=coastShadowGroup;coastShadowGroup='beach';
  const limb=(g:THREE.BufferGeometry,color:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,rx=0,ry=0,rz=0)=>part(g,color,x*size,y*size,z*size,sx*size,sy*size,sz*size,rx,ry,rz);
  const shirt=['#e76f51','#36a8b1','#edc969'][Math.abs(key)%3];
  limb(round,'#bd8d68',0,1.58,0,.21,.25,.21);
  limb(boxes,shirt,0,1.05,0,.48,.65,.28);
  for(const side of [-1,1]){
   limb(cylinder,'#bd8d68',side*.13,.38,playing?side*.12:0,.085,.72,.085,playing?side*.35:0,0,side*.1);
   limb(cylinder,'#bd8d68',side*.36,playing?1.42:1.05,0,.07,.6,.07,0,0,side*(playing?.85:.22));
  }
  coastShadowGroup=previous;
 }
 function restingBench(key:number,people:number){const previous=coastShadowGroup;coastShadowGroup='beach';
  // Local +Z faces the sea. Bent thighs/shins keep seated silhouettes distinct.
  for(const x of [-1.12,1.12])for(const z of [-.23,.23])part(boxes,'#665d61',x,.25,z,.12,.5,.12);
  for(const z of [-.24,0,.24])part(boxes,'#aa8960',0,.52,z,2.8,.10,.21);
  for(const x of [-1.12,1.12])part(boxes,'#665d61',x,.78,-.3,.1,.65,.1);
  for(const y of [.83,1.05])part(boxes,'#aa8960',0,y,-.33,2.8,.16,.10);
  for(let i=0;i<people;i++){
   const x=people===1?-.25:i===0?-.67:.67,shirt=['#e76f51','#36a8b1','#edc969'][(key+i)%3];
   part(round,'#bd8d68',x,1.38,.02,.20,.23,.20);part(boxes,shirt,x,.98,.02,.46,.55,.30);
   for(const side of [-1,1]){part(boxes,'#665d61',x+side*.13,.62,.21,.18,.18,.48);part(cylinder,'#bd8d68',x+side*.13,.32,.44,.075,.52,.075);part(boxes,'#665d61',x+side*.13,.09,.53,.17,.13,.3);part(cylinder,'#bd8d68',x+side*.29,.84,.14,.065,.4,.065,.45,0,side*.15);}
  }
  coastShadowGroup=previous;
 }
 function glow(g:THREE.BufferGeometry,color:string,x:number,y:number,z:number,sx:number,sy:number,sz:number){
  part(g,color,x,y,z,sx,sy,sz,0,0,0,2.2);
 }
 function coastHome(key:number,shop=false,farm=false){const previous=coastShadowGroup;coastShadowGroup='buildings';
  // Model facades use local -X, while track.sample().right is world -X
  // for the straight road. PI correctly faces the road; the varied EXTRA
  // angle reveals some front walls to approaching drivers without a grid.
  yaw+=Math.PI+coastHomeFacingYaw(key,farm?'farm':shop?'shop':'village');
  const type=Math.floor(random(key+330)*(farm?2:4)),h=shop?7.5:[3.7,6.5,9.3,11.8][type],w=7+random(key+2)*5;
  const wall=['#c8b49f','#b5bcc1','#bd9180','#b7bb9e','#d2baab'][Math.floor(random(key+8)*5)];
  part(boxes,wall,0,h/2-.15,0,9,h+.3,w);
  // Only a minority of older bungalows get a steep roof. Most Taiwanese
  // town homes are flat-roof RC boxes with practical rooftop additions.
  if(type===0&&!shop){
   part(cone,'#795a51',0,h+1,0,7,2.2,w*.77,0,Math.PI/4);
   if(type===0){part(boxes,wall,-4.7,1.6,w*.25,1.7,3.2,2.9);part(boxes,'#6e5d62',-5.2,3.3,w*.25,2.7,.25,3.6);}
  }else{
   part(boxes,'#6e5d62',0,h+.2,0,9.6,.4,w+.6);
   if(type===3){part(cylinder,'#9ba3a4',1.8,h+1.2,-w*.22,1.2,2,1.2);part(boxes,wall,1,h+.75,w*.24,3,1.5,2.6);}
   if(!shop&&type>=1){
    // An uneven rooftop water tank / green-grey corrugated tin lean-to.
    if(key%3===1){part(boxes,'#748c83',1.7,h+.67,w*.19,4,.85,w*.35);
     part(boxes,'#97a59b',1.7,h+1.12,w*.19,4.5,.15,w*.39);}
    if(key%4===1)part(cylinder,'#a0aaa4',2.2,h+1.38,-w*.23,.83,1.9,.83);
   }
  }
  // Different households have different occupancy; some homes are entirely dark.
  const occupancy=random(key+201)<.10?0:.72+random(key+213)*.22;
  for(let floor=0;floor<Math.floor(h/2.8);floor++)for(const [column,z] of [-w*.28,w*.28].entries()){
   const y=1.5+floor*2.8;
   part(boxes,'#293643',-4.56,y,z,.12,1.65,1.9);
   if(occupancy>0&&((floor===0&&column===0)||random(key*31+floor*7+column*17+923)<occupancy)){
    const color=['#ffca83','#dfbd8e','#b7cbd1'][(key+column+floor)%3];
    // Share three brightness levels so more lit homes do not create a material per window.
    part(boxes,color,-4.64,y,z,.07,1.35,1.65,0,0,0,[.8,1.1,1.4][Math.floor(random(key+floor+column)*3)]);
    part(boxes,'#665d61',-4.7,y,z,.07,1.4,.06);
   }
   if(!shop&&type>0&&(key+floor+column)%3!==0){
    for(const offset of [-.55,.55])part(boxes,'#66777a',-4.77,y,z+offset,.045,1.43,.055); // iron window guards
   }
   if(floor&&type%2===0){part(boxes,wall,-5,y-.9,z,1.4,.18,2.6);part(boxes,'#665d61',-5.6,y-.45,z,.1,.75,2.6);}
   else if(floor)part(boxes,'#6e5d62',-4.8,y+.92,z,.65,.14,2.3);
  }
  // Nearly every small town has these pragmatic, slightly mismatched
  // building-front features. Avoid sub-pixel relief textures on mobile.
  if(!shop&&type>0&&key%3!==0){
   part(boxes,'#7b8584',-4.66,1.35,0,.11,2.55,2.2); // garage roller shutter
   for(const y of [.75,1.35,1.95])part(boxes,'#a1aca6',-4.75,y,0,.04,.06,2.2);
  }else part(boxes,'#665d61',-4.65,1.15,0,.12,2.3,1.1);
  if(!shop&&type>0)part(boxes,'#a5a297',-4.56,h-1.35,0,.095,.24,w*.91); // terrazzo/mosaic border
  if(random(key+77)>.65)glow(round,'#ffd298',-4.9,2.65,.9,.13,.18,.13);
  if(shop){
   part(boxes,'#315e66',-4.7,1.4,0,.15,2.6,w*.88);
   glow(boxes,'#ffc582',-4.81,2.9,0,.12,.65,w*.9);
   for(const z of [-2,0,2])part(boxes,'#735a53',-4.9,2.9,z,.15,.32,.16);
   part(boxes,'#b46958',-5.3,3.35,0,2,.18,w+.6);
  }
  coastShadowGroup=previous;
 }
 function nightStall(key:number){const previous=coastShadowGroup;coastShadowGroup='buildings';
  yaw+=Math.PI+(random(key+73)-.5)*.24;
  const type=key%4;
  const tint=['#ae534a','#317f87','#ba8745'][key%3];
  part(boxes,'#6c5045',0,.55,0,4,1.1,5.6);
  part(boxes,'#d3b691',-2.15,1.15,0,.85,.18,5.8);
  for(const x of [-2,2])for(const z of [-2.7,2.7])part(cylinder,'#665d61',x,1.95,z,.075,3.9,.075);
  if(type===2){for(const side of [-1,1])part(boxes,tint,side*1.4,3.85,0,2.95,.18,6,0,0,-side*.24);}
  else if(type===3){part(boxes,'#6e5d62',1.5,2,0,1,4,5.6);part(boxes,tint,0,4.05,0,5.7,.2,6);}
  else for(let j=0;j<6;j++)part(boxes,j%2?tint:'#d0c1a4',0,3.8,-2.5+j,5.7,.18,1,.04,0,-.08);
  part(boxes,tint,-2.55,3.5,0,.16,.55,6);
  glow(boxes,'#ffcc82',-2.65,3.18,0,.10,.14,5.4);
  // Backlit menu blocks and trays/pots instead of identical empty boxes.
  glow(boxes,key%2?'#ff9a72':'#a8d9c6',-2.68,2.75,1.8,.1,.8,1.1);
  if(type===0){ // Noodle pots and a glowing grill.
   for(let j=0;j<3;j++){part(cylinder,'#434650',-2,1.45,-1.5+j*1.3,.38,.44,.38);part(round,'#dfac67',-2,1.72,-1.5+j*1.3,.32,.10,.32);}
   glow(boxes,'#ff7952',-2.57,.9,-1,.05,.12,1.5);
  }else if(type===1){ // Drinks cart: tall chillers, bottles and stacked cups.
   part(boxes,'#315e66',1,1.6,-1.8,1.2,3.2,1.5);glow(boxes,'#a8d9c6',.35,2,-1.8,.06,1.6,1.2);
   for(let j=0;j<6;j++){part(cylinder,j%2?'#36a8b1':'#edc969',-2,1.5,-2+j*.7,.14,.5,.14);part(cylinder,'#fff0d3',-2,1.81,-2+j*.7,.07,.15,.07);}
  }else if(type===2){ // Fruit/flower stand: open crates and bright produce heaps.
   for(let j=0;j<3;j++){
    part(boxes,'#aa8960',-2,1.4,-1.6+j*1.5,.9,.3,1.25);
    for(let k=0;k<4;k++)part(round,['#e76f51','#edc969','#527849'][j],-2+(k%2)*.23,1.66,-1.9+j*1.5+Math.floor(k/2)*.38,.2,.18,.2);
   }
  }else{ // Clothing/accessories kiosk, with hanging garments instead of cookware.
   part(boxes,'#aa8960',-.4,2.8,0,.08,.08,4.8);
   for(let j=0;j<4;j++){const z=-1.7+j*1.1,col=['#e76f51','#36a8b1','#edc969','#c8b49f'][j];part(boxes,col,-.4,2.3,z,.18,.9,.65);part(boxes,col,-.4,2.65,z,.18,.26,1);}
  }
  for(const z of [-2.6,2.6]){
   part(cylinder,'#665d61',-2.8,3.05,z,.025,.9,.025);
   glow(round,key%2?'#ffb05d':'#ff7952',-2.8,2.65,z,.27,.36,.27);
  }
  part(round,'#bd8d68',-.7,1.85,0,.22,.25,.22);
  part(boxes,'#e76f51',-.7,1.4,0,.5,.6,.3);
  coastShadowGroup=previous;
 }
 if(range.coastUltra){
  // Alternating fabric panels make umbrellas and balls readable at driving speed.
  const canopy=new THREE.ConeGeometry(1,.38,12,1,true).toNonIndexed();
  const ball=new THREE.SphereGeometry(1,12,8).toNonIndexed();
  for(const g of [canopy,ball]){
   const p=g.getAttribute('position'),c:number[]=[];
   for(let i=0;i<p.count;i++){
    const face=Math.floor(i/3)*3,angle=Math.atan2(p.getZ(face),p.getX(face));
    const sector=Math.floor((angle+Math.PI)*6/Math.PI);
    const color=new THREE.Color(['#fff3d5','#ef7956','#fff3d5','#3caeb5'][sector%4]);c.push(color.r,color.g,color.b);
   }
   g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));
  }
  const inChunk=(d:number)=>d>=range.start&&d<Math.min(length,range.end);
  let waffle:THREE.BufferGeometry|undefined,waffleSign:THREE.BufferGeometry|undefined;
  for(const [index,site] of COAST_VILLAGE_SITES.entries()){
   const {d,key}=site;if(!inChunk(d))continue;
   beachAnchor(d,site.x);yaw+=site.yaw;
   if(site.kind==='home'){
    if(clear(10))coastHome(key);
    if(!site.rear&&key%3===0){beachAnchor(d-9,site.x-7);if(clear(3)){part(boxes,'#c0aa91',0,.35,0,2,.7,4);part(round,'#527849',0,1.05,0,1.2,.7,2.1);}}
    continue;
   }
   if(clear(5)){
    if(site.kind==='waffle'){
     waffle??=vehicleGeometry(3);waffleSign??=waffleSignGeometry();waffleSign.userData.waffleSign=true;
     part(waffle,'#ffffff',0,0,0,1.15,1.15,1.15);
     part(waffleSign,'#ffffff',0,0,0,1.15,1.15,1.15);
     // Serving counter and a vendor use the existing market palette.
     part(boxes,'#aa8960',1.65,1.2,-.7,1.1,.15,2.7);
     for(const z of [-1.6,.2]){part(cylinder,'#665d61',1.65,.55,z,.07,1.1,.07);part(round,'#edc969',1.65,1.34,z,.25,.07,.25);}
     part(round,'#bd8d68',0,2.36,-.8,.22,.25,.22);part(boxes,'#fff0ca',0,1.96,-.8,.5,.6,.32);
    }else nightStall(key);
   }
   if(index%4===0){beachAnchor(d+3,53+random(key+55)*8);yaw+=site.yaw*.7;if(clear(9))coastHome(key,true);}
   const count=key%4===0?1:2+key%2;
   for(let j=0;j<count;j++){
    beachAnchor(d-5+random(key*17+j)*10,16.4+random(key*7+j)*3.6);if(clear(1)){yaw+=random(key+j)*6;beachPerson(key+j,false,.92+random(key*3+j)*.13);}
   }
   // Lights connect only neighbours in the same little pocket, not long gaps.
   const next=COAST_VILLAGE_SITES[index+1];beachAnchor(d,19.5+site.yaw*3);
   part(cylinder,'#665d61',0,2.5,0,.045,5,.045);
   if(next&&next.group===site.group){
    const p=sample(next.d),x=19.5+next.yaw*3,target=p.position.clone().addScaledVector(p.right,x);
    target.y=coastBeachHeight(x,p.position.y,p.right.y,next.d);target.sub(base).applyAxisAngle(axis,-yaw);
    const span=Math.hypot(target.x,target.z),angle=Math.atan2(target.x,target.z);
    for(let j=0;j<5;j++){const t=j/5,n=(j+1)/5,y=4.9+target.y*t-Math.sin(t*Math.PI)*.6,ny=4.9+target.y*n-Math.sin(n*Math.PI)*.6;
     part(boxes,'#665d61',target.x*(t+n)/2,(y+ny)/2,target.z*(t+n)/2,.025,.025,Math.hypot(span/5,ny-y),-Math.atan2(ny-y,span/5),angle);glow(round,'#ffd298',target.x*t,y-.11,target.z*t,.10,.13,.10);}
   }
  }
  coastShadowGroup='buildings';
  let taiwanFarmPrefab:THREE.BufferGeometry|undefined;
  for(const site of FARM_HOMES){
   // The demonstration hamlet replaces only these two primitive farm houses.
   if(ruralShowcaseReplacesFarmHome(site.d))continue;
   if(!inChunk(site.d))continue;
   beachAnchor(site.d,site.x);yaw+=site.yaw;if(!clear(10))continue;
   // Two of three rural plots use the single-draw Taiwanese brick/plaster
   // farmhouse prefab. The third retains a modest older RC house for real
   // mixed-age village character instead of a cloned museum village.
   part(boxes,'#aa996f',0,.015,0,17,.08,21);
   if(site.key%3!==0){
    taiwanFarmPrefab??=buildCoastRuralHouse('farmhouse');
    yaw+=Math.PI+coastHomeFacingYaw(site.key,'farm');
    part(taiwanFarmPrefab,'#ffffff',0,0,0,1,1,1);
   }else coastHome(site.key,false,true);
   for(const z of [-9,9]){
    for(const x of [-7,-3,1,5])part(boxes,'#aa8960',x,.55,z,.14,1.1,.14);
    part(boxes,'#aa8960',-1,.73,z,12,.12,.1);
   }
   beachAnchor(site.d-8,site.x-7);beachPerson(site.key,false,1);
  }
  // Opening farming hamlet at 1.05km: a compact town home, a true
  // open-courtyard farmhouse, a low farmhouse, trees, irrigation channel and
  // footbridge. Complete vertex-coloured buildings are each ONE instanced
  // prefab, prepared by the existing scenery Worker; no runtime CSG/GLB loads.
  if(inChunk(COAST_RURAL_SHOWCASE.start)){
   coastShadowGroup='buildings';
   const ruralPrefabs=new Map<string,THREE.BufferGeometry>();
   if(taiwanFarmPrefab)ruralPrefabs.set('farmhouse',taiwanFarmPrefab);
   for(const site of COAST_RURAL_HOUSES){
    beachAnchor(site.d,site.x);
    // The PI turn faces each local -X entrance toward the actual road;
    // the authored positive yaw tilts the hero gate toward incoming cars.
    yaw+=Math.PI+site.yaw;
    // Explicitly positioned, road-side-safe authored lots. A single prefab
    // template takes the place of many per-wall primitive draw calls.
    let prefab=ruralPrefabs.get(site.kind);
    if(!prefab){prefab=buildCoastRuralHouse(site.kind);ruralPrefabs.set(site.kind,prefab);}
    part(prefab,'#ffffff',0,0,0,1,1,1);
   }
   // Low bridge over the irrigation channel toward the courtyard entrance;
   // begins beyond the guardrail, not on the playable asphalt.
   // Connect the irrigation crossing to the *turned* courtyard gate.
   // The new entrance is roughly at route 1051m, x 43m. This short footpath
   // follows it without flattening or touching the water ribbon.
   beachAnchor(1052,34);
   part(boxes,'#bdb5a3',-3,.34,0,22,.50,4.2);
   for(const z of [-1.9,1.9]){
    part(boxes,'#bcb4a6',-3,.98,z,21,.20,.18);
    for(const x of [-13,-8,-3,2,7])part(boxes,'#aaa294',x,.70,z,.19,.79,.22);
   }
   // Farm garden trees are now imported as full 3D CommonTree_3 in coast-nature.
   // Creek has been sculpted into the SAME road-worker grass cross-section.
   // Water, edge stones and warm glints share one 3km chunk-owned template.
   const creek=buildCoastRuralCreek(sample);
   base.set(0,0,0);yaw=0;chunk=Math.floor(RURAL_CREEK.start/650);
   bridgeGap=false;anchorRight=false;
   coastShadowGroup='other';
   part(creek,'#ffffff',0,0,0,1,1,1);
  }
  // Short local streets link residential frontages to the covered town
  // drain and highway edge, without altering the main road physics.
  const streets=buildCoastTownStreets(sample,range.start,range.end);
  if(streets){
   base.set(0,0,0);yaw=0;chunk=Math.floor(range.start/650);
   bridgeGap=false;anchorRight=false;coastShadowGroup='other';
   part(streets,'#ffffff',0,0,0,1,1,1);
  }
  // 台灣路側樣板 R0: one entire drainage channel per scenery chunk.
  // The ROAD Worker has already sculpted the U profile into grass; this
  // visual mesh adds concrete lips, water, and baked precast/grating covers.
  // It does not touch asphalt physics, camera, or the approved ocean.
  if(coastDrainOverlaps(range.start,range.end)){
   const gutter=buildCoastRoadsideDrain(sample,range.start,range.end);
   if(gutter){
    base.set(0,0,0);yaw=0;chunk=Math.floor(range.start/650);
    bridgeGap=false;anchorRight=false;coastShadowGroup='other';
    part(gutter,'#ffffff',0,0,0,1,1,1);
   }
   // Separate flow geometry has a route-UV clock-driven shader; no extra
   // simulation, texture fetch or transparent overlay on the concrete.
   const flow=buildCoastRoadsideWater(sample,range.start,range.end);
   if(flow){
    base.set(0,0,0);yaw=0;chunk=Math.floor(range.start/650);
    bridgeGap=false;anchorRight=false;coastShadowGroup='other';
    part(flow,'#ffffff',0,0,0,1,1,1);
   }
  }
  // Utility poles now stand directly along the far canal lip. The normal
  // generic scenery clearance would reject them for being close to asphalt;
  // this authored gutter-side position is intentional and safely outside it.
  // Warning rings, ceramic insulators and transformer parts use
  // existing instanced cylinder/box buckets; wires use ONE combined mesh.
  coastShadowGroup='other';
  for(const pole of COAST_UTILITY_POLES){
   if(!inChunk(pole.d))continue;
   beachAnchor(pole.d,pole.x);
   if(pole.x<=COAST_DRAIN_X.rightLip+.23)continue;
   const h=pole.height;
   part(cylinder,'#94968f',0,h*.5,0,.245,h,.245);
   part(cylinder,'#373d3e',0,1.03,0,.266,2.06,.266);
   for(const y of [.50,.98,1.46])part(cylinder,'#dbb245',0,y,0,.283,.27,.283);
   part(boxes,'#687174',0,h-.54,0,3.05,.17,.22);
   for(const across of [-1.05,0,1.05]){
    part(cylinder,'#dad6c7',across,h-.31,0,.105,.32,.105);
    part(cylinder,'#4d5051',across,h-.13,0,.045,.07,.045);
   }
   if(pole.transformer){
    part(cylinder,'#71807c',.64,h-2.20,0,.48,1.42,.48);
    part(boxes,'#59635f',.64,h-1.42,0,1.15,.15,1.10);
    part(boxes,'#6d7272',.58,h-2.82,0,1.08,.14,1.12);
   }
   // In this road frame, positive local +X extends TOWARD the sea-side
   // traffic lanes. The R1 -X arm mistakenly pointed back into the fields.
   // Every pole has its own small road-facing streetlight, no extra poles.
   if(pole.lamp){
    part(boxes,'#696f6d',1.42,h-1.63,0,2.85,.15,.17);
    part(boxes,'#68706a',2.93,h-1.73,0,.83,.22,.64);
    part(boxes,'#f8dfaa',2.96,h-1.89,0,.68,.065,.46,0,0,0,.9);
   }
  }
  if(coastPoleLinks(range.start,range.end).length){
   const wires=buildCoastUtilityWires(sample,range.start,range.end);
   if(wires){
    base.set(0,0,0);yaw=0;chunk=Math.floor(range.start/650);
    bridgeGap=false;anchorRight=false;
    part(wires,'#ffffff',0,0,0,1,1,1);
   }
  }
  // A few distinctive trees near the fields and farmyards, not a wall of
  // vegetation. These sit in the authored field-edge gaps where the generic
  // nature scatter correctly avoids covering rice and flower crops.
  coastShadowGroup='vegetation';
  for(const site of [
   {d:148,x:72,h:8.5},{d:460,x:267,h:11},
   {d:760,x:266,h:9.5},{d:1310,x:265,h:10.5},
   {d:1660,x:268,h:9},
  ]){
   if(!inChunk(site.d))continue;
   beachAnchor(site.d,site.x);
   part(cylinder,'#79604c',0,site.h*.47,0,.34,site.h*.94,.34);
   part(round,'#587648',0,site.h+.35,0,3.2,site.h*.3,3.7);
   part(round,'#6b8050',1.55,site.h-.3,.7,2.0,site.h*.22,2.3);
  }
  coastShadowGroup='beach';
  for(const spot of COAST_REST_SPOTS){
   if(!inChunk(spot.d))continue;
   beachAnchor(spot.d,spot.x);if(base.y< -3.7||!clear(3))continue;
   yaw+=Math.PI/2+(random(spot.key+83)-.5)*.22;restingBench(spot.key,spot.people);
   if(spot.children){
    for(let j=0;j<2;j++){beachAnchor(spot.d+(j?5:-5),spot.x-4-j);if(base.y> -4&&clear(1)){yaw+=j?Math.PI:0;beachPerson(spot.key+j,true,.60+j*.07);}}
    beachAnchor(spot.d+1,spot.x-5);if(base.y> -4)part(ball,'#fffdf4',0,.3,0,.3,.3,.3);
   }
  }
  coastShadowGroup='beach';
  for(const bay of COAST_BEACHES){
   // Loose pockets, never a repeating row along the whole highway.
   const half=Math.min(370,bay.radius*.7),count=Math.floor(half*2/33)+1;
   for(let j=0;j<count;j++){
    const d=bay.distance-half+j*33+rand(j+bay.distance)*15;
    if(!inChunk(d))continue;
    const x=-19-rand(j*11+bay.distance)*17;
    if(COAST_REST_SPOTS.some(s=>Math.abs(s.d-d)<11&&Math.abs(s.x-x)<7))continue;
    beachAnchor(d,x);if(!clear(4)||base.y<-4.05)continue;
    yaw+=rand(d)*1.8;
    part(cylinder,'#aa8960',0,1.6,0,.055,3.2,.055);
    part(canopy,'#fffdf4',0,3.2,0,2.45,2.45,2.45);
    for(const side of [-1,1]){
     const x=side*1.2;
     part(boxes,'#fff0d3',x,.36,.5,.7,.12,1.5);
     part(boxes,'#36a8b1',x,.8,-.45,.7,.12,1.05,.9);
     for(const z of [-.05,1])part(boxes,'#aa8960',x,.18,z,.65,.36,.08);
    }
    part(boxes,'#e76f51',2.8,.05,1,1.2,.05,2.1);
    if(j%2===0)part(ball,'#fffdf4',2.9,.4,-1.5,.4,.4,.4);
    beachAnchor(d+5,x-1);if(base.y>-4.2&&clear(2)){yaw+=rand(j)*5;beachPerson(j,j%3===0);}
    if(j%3===0){beachAnchor(d+8,x-3);if(base.y>-4.2&&clear(2))beachPerson(j+1,true);}
   }
   const d=bay.distance-55;
   if(inChunk(d)){
    beachAnchor(d,-16.8);if(clear(4)){
     part(boxes,'#fff0d3',0,.6,0,3.7,1.2,2.6);
     part(boxes,'#36a8b1',0,1.25,-1.4,3.9,.18,.8);
     for(const x of [-1.65,1.65])for(const z of [-1.3,1.3])part(cylinder,'#aa8960',x,2.1,z,.06,2.2,.06);
     for(let j=0;j<6;j++)part(boxes,j%2?'#fff0d3':'#e76f51',-1.65+j*.66,3.25,0,.66,.14,3.8,.08);
     glow(boxes,'#ffd298',0,2.75,1.35,2.3,.45,.15);
     for(const x of [-1.4,0,1.4]){part(cylinder,'#665d61',x,2.85,-1.65,.02,.5,.02);glow(round,'#ffca83',x,2.57,-1.65,.14,.20,.14);}
     part(round,'#bd8d68',0,1.9,0,.22,.25,.22);
     part(boxes,'#e76f51',0,1.5,0,.5,.5,.3);
    }
   }
  }
  // Final chapter: two tiny working-boat landings punctuate the coast.
  // These are sparse fishing sheds/net racks, not another resort village.
  coastShadowGroup='buildings';
  for(const landing of [{d:7730,x:-17.5},{d:8920,x:-17.5}]){
   if(!inChunk(landing.d))continue;
   beachAnchor(landing.d,landing.x);
   if(!clear(6))continue;
   yaw+=Math.PI/2;
   part(boxes,'#a69a81',0,.28,0,8,.56,10);
   part(boxes,'#c0b095',0,1.95,0,5,3.5,6.4);
   part(boxes,'#6b6964',0,3.83,0,6.3,.40,7.4);
   for(const z of [-2.8,2.8]){
    part(cylinder,'#776a57',-4,1.6,z,.11,3.2,.11);
    part(boxes,'#847d6c',-4,3.20,z,.45,.20,2.2);
    part(boxes,'#b9a47d',-4,1.40,z,.25,1.9,1.8);
   }
   for(const z of [-2.4,0,2.4])part(boxes,'#8b6d52',-5,.55,z,1.5,.8,1.5);
   // Short low pier extending seaward from above water level. It stays outside
   // the drivable corridor and only these two locations have this structure.
   const frame=sample(landing.d);
   base.copy(frame.position).addScaledVector(frame.right,-25);
   base.y=COAST_SEA_LEVEL+.75;
   yaw=-frame.roadHeading;
   part(boxes,'#a9a192',-8,.05,0,18,.36,3.4);
   for(const x of [-15,-9,-3]){
    for(const z of [-1.45,1.45])part(cylinder,'#827866',x,-.70,z,.12,1.60,.12);
   }
  }
  coastShadowGroup='rocks';
  for(const site of COAST_ROCKS){
   if(!inChunk(site.d))continue;
   beachAnchor(site.d,coastRockX(site));
   if(clear(site.r+2)){
    // Buried below the sand; the water mask uses the same footprint.
    part(boulder,'#8d9185',0,site.r*.34,0,site.r,site.r*.94,site.r*.85,.13,rand(site.d)*6,.1);
    part(boulder,'#a5a48f',site.r*.5,0,site.r*.65,site.r*.48,site.r*.44,site.r*.42);
   }
  }
  coastShadowGroup='other';
 }
 function dryTree(seed:number){const previous=coastShadowGroup;coastShadowGroup='vegetation';const h=4+random(seed)*2;part(cylinder,'#82634a',0,h/2,0,.22,h,.22);for(const side of [-1,1]){part(cylinder,'#82634a',side*.75,h*.75,0,.13,h*.65,.13,0,0,-side*.55);part(round,'#8d9254',side*1.4,h,0,1.2,.6,1);}coastShadowGroup=previous;}
 function mesa(seed:number,large=false){if(!bridgeApproachAllowsBuilding(anchorDistance,range.bridge))return;const w=(large?32:18)+random(seed)*15,h=(large?65:30)+random(seed+1)*30;part(mesaGeometry[Math.abs(seed)%3],'#ffffff',0,0,0,w,h,w*.8,0,random(seed)*6);}
 function lighthouse(seed:number,d:number){
  // The coastal anchor lies down by the sea; a visible lighthouse needs an
  // elevated PROMONTORY connected all the way down to the sea floor.
  const profile=lighthouseProfile(sample(d).position.y,random(seed));
  const rockHeight=profile.rockTop-profile.rockBottom;
  const rockCenter=(profile.rockTop+profile.rockBottom)/2-base.y;
  const foot=profile.rockTop-base.y,h=profile.towerHeight;
  part(rock,'#aba28d',0,rockCenter,0,30,rockHeight,27);
  part(rock,'#a89b83',-10,rockCenter-3,11,19,Math.max(12,rockHeight-6),22);
  // At least ten storeys of visible tower ABOVE the elevated cliff plateau.
  part(cylinder,'#f5eddc',0,foot+h/2,0,3.25,h,3.25);
  part(cylinder,'#cd573e',0,foot+12,0,3.3,4,3.3);
  part(cylinder,'#cd573e',0,foot+h-4,0,3.3,2,3.3);
  part(cylinder,'#e7e7d4',0,foot+h+.45,0,4.2,.9,4.2);
  part(cylinder,'#355763',0,foot+h+2.2,0,2.5,3.3,2.5);
  part(round,'#ffe6a3',0,foot+h+2.2,0,2.2,1.5,2.2);
  part(cone,'#d76e48',0,foot+h+5.8,0,4.1,3.5,4.1);
 }
 function clockTower(){
  // A prominent civic tower rises above its deliberately low surrounding district.
  const h=CLOCK_TOWER_SHAFT_HEIGHT,face=h-7;
  part(boxes,'#d8c7a9',0,-5,0,16,10,16);
  part(boxes,'#eed7ac',0,h/2,0,11,h,11);
  part(boxes,'#d49969',0,h,0,12,1.4,12);
  part(cylinder,'#f2e3bf',0,h+3,0,5.2,5,5.2);
  part(round,'#548e92',0,h+6.3,0,5.6,3.6,5.6);
  part(cylinder,'#eee6ce',0,face,-5.65,3.1,.2,3.1,Math.PI/2);
  part(boxes,'#375a63',0,face+.8,-5.79,.2,1.9,.2);
  part(boxes,'#375a63',.75,face,-5.79,1.6,.2,.2);
 }
 function clockDistrict(seed:number,d:number,offset=75){
  anchor(d,offset);
  clockTower();
  // Three entire buildings are authored WITH each clock, not separately sampled
  // and cleared. A tower can never appear without its neighborhood.
  for(const [i,x,z,w,h] of [[0,-21,-16,12,23],[1,19,15,15,18],[2,-2,37,11,26]]){
   part(boxes,CLOCK_COMPANION_COLOR,x,h/2,z,w,h,12);
   part(boxes,'#f3e6cd',x,h+.35,z,w+.8,.7,12.8);
   for(let floor=0;floor<Math.floor(h/4);floor++)
    for(const side of [-1,1])part(boxes,'#426d77',x+side*w*.24,3.1+floor*4,z-6.08,w*.15,1.6,.12);
  }
 }
  function building(seed:number,far=false,coastal=false){if(!bridgeApproachAllowsBuilding(anchorDistance,range.bridge))return;const w=7+random(seed)*6,rawH=coastal?5+random(seed+1)*4:(far?28:9)+random(seed+1)*(far?42:18),h=nearClock(anchorDistance)?Math.min(rawH,far?17:12):rawH,depth=8+random(seed+2)*5,color=['#eed6b4','#e6a48b','#a9c9bf','#e3c286','#d7b9bf'][Math.floor(random(seed+4)*5)];
  if(range.scenerySections){
   // A buried plinth is visible only where a steep street shelf exposes its
   // foot; the roof and windows remain identical to the accepted city assets.
   part(boxes,'#b5b1a1',0,-2.8,0,w+2,5.8,depth+2);
  }else if(theme!==undefined)part(boxes,color,0,-4,0,w,8,depth);
  part(boxes,color,0,h/2,0,w,h,depth);part(boxes,'#f3e6cd',0,h+.25,0,w+.7,.5,depth+.7);part(boxes,color,w*.12,h+2,0,w*.65,4,depth*.7);part(boxes,'#bb7960',w*.12,h+4.1,0,w*.7,.25,depth*.75);
  for(let floor=0;floor<Math.floor(h/3.2);floor++)for(const x of [-.3,0,.3]){part(boxes,'#426d77',x*w,2+floor*3.2,-depth/2-.035,w*.13,1.35,.07);if(!far&&floor%2===1)part(boxes,'#eee1bd',x*w,1.2+floor*3.2,-depth/2-.35,w*.2,.16,.8);}
  if(!coastal&&seed%3===0){part(cylinder,'#8eb4b4',w*.12,h+5.5,0,w*.28,3,w*.28);part(round,'#719d9f',w*.12,h+7,0,w*.3,1.8,w*.3);}else if(!coastal&&seed%3===1){for(let fin=0;fin<3;fin++)part(boxes,'#ede5c9',w*.12+(fin-1)*w*.2,h+5,0,.35,2.2,depth*.7);}else if(coastal){part(cone,'#bd7d59',w*.12,h+4.8,0,w*.46,2,depth*.46,0,Math.PI/4);}
  if(!far){part(boxes,'#347f78',0,3,-depth/2-.8,w*.8,.18,1.8, .08);part(boxes,'#e5d7b9',0,.15,-depth/2-1.5,w+2,.3,3);}
 }

 /** Low-cost road-facing buildings: wide, connected street-wall silhouettes.
  * Created as instances from the existing box material. No new draw calls per
  * building and no expansion to an imaginary distant skyline. */
 function cityBlock(seed:number,side:-1|1,back=false){
  if(!bridgeApproachAllowsBuilding(anchorDistance,range.bridge))return;
  const width=(back?26:22)+random(seed+2)*(back?10:9);
  const depth=(back?18:14)+random(seed+3)*6;
  const rawHeight=(back?17:22)+random(seed+5)*(back?24:20);
  const height=nearClock(anchorDistance)?Math.min(rawHeight,back?19:23):rawHeight;
  const color=['#e6c5a0','#dba98c','#b9c7b8','#e5c8b6','#c8b6aa','#d4c49e'][Math.floor(random(seed+7)*6)];
  part(boxes,'#b7afa0',0,-1.8,0,width+1.6,3.6,depth+1.6);
  part(boxes,color,0,height/2,0,width,height,depth);
  part(boxes,'#f2e7d5',0,height+.28,0,width+.8,.56,depth+.8);
  // Shops and continuous facade rhythm sit on the actual street-facing side.
  const front=side*(width/2+.09);
  if(!back){
   part(boxes,'#406f73',front,3,0,.2,4.6,depth*.8);
   part(boxes,'#e1d2ab',front+side*.14,5.4,0,.48,.38,depth*.85);
  }
  const floors=Math.min(back?4:7,Math.floor((height-6)/4.5));
  for(let floor=0;floor<floors;floor++){
   const y=8.5+floor*4.5;
   for(const z of [-depth*.28,depth*.28])
    part(boxes,'#436b74',front,y,z,.18,2,depth*.18);
  }
 }

/** Authored scene props: each distance/side/size is chosen by the designer,
 * not sampled from a biome RNG. The existing instanced materials still carry
 * the rendering cost; no meshes are allocated during the game loop. */
 function designedProp(p:DesignedProp){
  anchor(p.at,p.offset);
  if(!bridgeApproachAllowsBuilding(p.at,range.bridge)||!clear(Math.min(40,p.width*.34+3)))return;
  const w=p.width,h=p.height,z=p.depth;
  switch(p.kind){
   case 'cliff':
    // Low wide sandstone layers; continuous landscape is the actual terrain.
    part(mesaGeometry[0],'#ad7450',0,-8,0,w,h,z,0,.05,0);
    part(boxes,'#d39b6a',0,h*.68,-z*.12,w*.8,2,z*.67);
    break;
   case 'rim':
    part(mesaGeometry[1],'#ac8061',0,-4,0,w,h,z,0,.08,0);
    part(boxes,'#d9a978',0,h*.67,0,w*.8,1.6,z*.7);
    break;
   case 'terrace':
    part(mesaGeometry[2],'#bb8a5e',0,-3,0,w,h,z,0,.1,0);
    part(boxes,'#e5bc87',0,h*.61,0,w*.7,1.2,z*.65);
    break;
   case 'talus':
    for(const [dx,dz,mult] of [[0,0,1],[w*.4,z*.32,.57],[-w*.46,-z*.18,.43]]){
     part(boulder,'#aa7857',dx,1.1*mult,dz,w*.45*mult,h*.75*mult,z*.52*mult,0,.13,0);
    }
    break;
   case 'rock-garden':
    for(const [dx,dz,mult] of [[0,0,1],[w*.35,z*.35,.7],[-w*.32,-z*.24,.52]]){
     part(boulder,'#b8845e',dx,1.3*mult,dz,w*.32*mult,h*.7*mult,z*.38*mult);
    }
    break;
   case 'scrub':
    part(round,'#8c935e',0,h*.48,0,w*.52,h*.42,z*.54);
    part(round,'#a0a470',w*.4,h*.3,z*.15,w*.27,h*.3,z*.34);
    break;
   case 'lookout':
    // One low overlook on the inside bank, not a new collision obstacle.
    part(boxes,'#a08463',0,.35,0,w,.7,z);
    part(boxes,'#826a4c',-w*.38,1.8,-z*.32,.4,3.4,.4);
    part(boxes,'#826a4c',w*.38,1.8,-z*.32,.4,3.4,.4);
    part(boxes,'#d5bd8e',0,3.3,-z*.32,w*.85,.45,.3);
    break;
  }
 }
 // The same deterministic list powers scenery, QA jumps and lone-clock audits.
 if(range.openRoad)for(const site of landmarkSites){
  if(site.distance<range.start||site.distance>=range.end)continue;
  const {distance:d,kind}=site;
  const index=Math.round(d/25);
  if(kind==='clock'){
   // A landmark can stay in the city, but must not stand at an outgoing
   // off-ramp's hidden endpoint. Put that district on the opposite roadside.
   const obstructed=!!range.junction&&interchangeSceneryClear(range.junction,d,1);
   const seaRight=range.scenerySections?sceneryGroundMixAt(range.scenerySections,d).rightSea:0;
   clockDistrict(index,d,obstructed||seaRight>.5?-75:75);
  }
  else if(kind==='lighthouse'){
   anchor(d,-(52+random(index)*8));lighthouse(index,d);
  }else if(kind==='canyon-arch'){
   // The original small arch was 95–110m off the road and almost invisible.
   // Move the silhouette nearer the roadside, and bury its two massive feet
   // into the rising canyon terrain. Keep the gap open, never block the road.
   anchor(d,CANYON_ARCH.offset);
   const profile=canyonArchProfile(sample(d).position.y);
   const foot=profile.foot-base.y,spring=profile.spring-base.y;
   const legHeight=profile.spring-profile.foot,halfSpan=CANYON_ARCH.span/2;
   for(const side of [-1,1]){
    const x=side*halfSpan;
    part(rock,CANYON_ARCH.stone,x,foot+legHeight/2,0,11,legHeight,13);
    // Uneven lower rock shoulders make this look like sandstone, not a gate.
    part(rock,'#97674a',x+side*3.7,foot+legHeight*.33,3,9,legHeight*.65,13);
   }
   // A genuine 3-D open half-arch, brighter than the background canyon.
   part(arch,CANYON_ARCH.crown,0,spring,0,halfSpan,CANYON_ARCH.rise,16);
  }
 }
  // Keep the ramp mouths AND the screen walls free of roadside trees and buildings.
 ordinaryProps=true;
 if(range.designerCut)for(const prop of range.designerCut.props){
  // A strict half-open authored distance interval guarantees that a
  // streaming chunk cannot duplicate one fixed landmark at its seam.
  if(prop.at>=range.start&&prop.at<range.end)designedProp(prop);
 }
 // Overlap prop families deterministically at each boundary; nothing spawns per frame.
 for(let i=Math.max(0,Math.ceil((range.start-16)/30)),d=16+i*30;d<Math.min(length,range.end);d+=30,i++){
  if(range.designerCut)continue;
  if(range.coastUltra){
   continue;
  }
  const weights=weightsAt(d),family=random(i+300)<weights[0]?0:random(i+300)<weights[0]+weights[1]?1:2;
  if(canyonR21(d)){
   // Sparse, irregular talus and shrubs. Neither city roadside rows nor
   // deterministic towers can overwrite the panorama's open sightline.
   for(const slot of canyonPropSlots(range.canyonPrototype!,d))canyonScatter(slot);
   continue;
  }
  if(family===0){anchor(d,17+random(i)*6);if(clear(4))palm(i);if(i%3===0){anchor(d,36+random(i)*10);if(clear(12))building(i,false,true);anchor(d+8,54+random(i+91)*10);if(bridgeApproachAllowsBuilding(d+8,range.bridge)&&clear(12)){const h=12+random(i+92)*15;part(boxes,['#d7c8af','#bfcfc4','#e4c5b0'][i%3],0,h/2,0,17,h,15);part(boxes,'#c9bca5',0,-1,0,22,2,20);}}}
  if(family===1&&i%7===0&&!insideCanyonPrototype(d)&&bridgeApproachAllowsBuilding(d,range.bridge)&&!(canyon&&canyonBend(d))&&farSupported(d,350)){for(const side of [-1,1]){anchor(d,side*(280+random(i)*90));if(clear(110)){base.y=-8;part(mesaGeometry[i%3],'#ffffff',0,0,0,90,150+random(i)*80,80,0,random(i)*6);}}}
  if(family===1&&!(canyon&&canyonBend(d))&&!range.rockSections?.some(s=>d>s.start-20&&d<s.end+20)){for(const side of [-1,1]){anchor(d,side*(19+random(i+side)*10));if(roadsideDrop<3&&clear(3))dryTree(i);if(i%3===0&&!insideCanyonPrototype(d)){anchor(d,side*(75+random(i)*25));if(bridgeApproachAllowsBuilding(d,range.bridge)&&clear(43)&&!acts[1].landmarks.some(l=>Math.abs(d-(acts[1].start+(acts[1].end-acts[1].start)*l.fraction))<180))mesa(i+side);}anchor(d,side*(halfAt(d)<7?12.5:15));if(!range.rocky&&roadsideDrop<3)part(boxes,'#bd8e62',0,.65,0,.8,1.3,12,theme===undefined?0:-Math.atan2(sample(d).tangent.y,Math.hypot(sample(d).tangent.x,sample(d).tangent.z)));}}
  if(family===2){
   const mix=range.scenerySections?sceneryGroundMixAt(range.scenerySections,d):{leftLand:0,rightSea:0};
   const section=range.scenerySections?scenerySectionAt(range.scenerySections,d):undefined;
   for(const side of [-1,1]){
    anchor(d,side*17);
    if(roadsideDrop<3){part(cylinder,'#3d646a',0,4,0,.12,8,.12);part(boxes,'#3d646a',0,8,-.65,.16,.16,1.4);part(round,'#ffedba',0,7.85,-1.3,.45,.2,.5);}
    if(i%2===0){anchor(d+10,side*20);if(roadsideDrop<3){part(cylinder,'#876b52',0,2.6,0,.22,5.2,.22);part(round,'#4a8256',0,5.5,0,2.3,2.6,2.3);}}
   }
   if(!range.denseCity){
   if(mix.rightSea<.25){
    anchor(d,32+random(i)*10);
    if(clear(13)&&!acts[2].landmarks.some(l=>Math.abs(d-(acts[2].start+(acts[2].end-acts[2].start)*l.fraction))<170))building(i);
    if(i%3===0){
     anchor(d,65+random(i)*18);
     if(bridgeApproachAllowsBuilding(d,range.bridge)&&clear(18)){
      const rawH=18+random(i+180)*30,h=nearClock(d)?Math.min(rawH,14):rawH;
      part(boxes,['#b9c7bb','#d9c5ad','#b7c6c1'][i%3],0,h/2,0,18,h,16);
      part(boxes,'#c8bba5',0,-5,0,24,10,23);
     }
     const far=140+random(i)*80;
     if(farSupported(d,far)){anchor(d,far);if(clear(18))building(i+100,true);}
    }
   }
   // City isn't a row of props on a seafront: alternating near and far
   // blocks make an actual two-sided street wall. Left cliffs stay ocean in
   // dedicated waterfront beats, with no invented floating towers.
   if(mix.leftLand>.65){
    if(i%2===0){
     anchor(d,-(34+random(i+701)*11));
     if(clear(15))building(i+700,false);
    }
    if(i%4===0){
     anchor(d,-(86+random(i+703)*55));
     if(clear(19))building(i+900,true);
    }
    if(section?.kind==='urban-hillside'&&i%5===0){
     const far=200+random(i+704)*45;
     if(farSupported(d,far)){anchor(d,-far);if(clear(35))mesa(i+300);}
    }
   }
   }else if((mix.urban??0)>.6){
    // Equal frontage opportunity on BOTH sides, with opposing stagger.
    // 2/3 × 30m cadence ~45m per side; 22–31m facade widths plus trees
    // form street walls rather than isolated skinny towers.
    for(const side of [-1,1] as const){
     const bias=side===1?0:1;
     if((i+bias)%3!==0){
      const raw=side*(30+random(i+side*97)*7);
      anchor(d,raw);
      if(clear(12))cityBlock(i+side*1203,side);
     }
     if((i+(side===1?0:2))%4===0){
      const raw=side*(91+random(i+side*107)*29);
      if(farSupported(d,raw)){
       anchor(d,raw);
       if(clear(17))cityBlock(i+side*1703,side,true);
      }
     }
    }
   }
  }
  // R2.0 authored but seeded canyon overlooks. Ground heights are taken from
  // the SAME landscape function that shapes terrain in the road Worker.
  // Far rocks are not collidable; keep existing rails as the road boundary.
  if(insideCanyonPrototype(d)&&!range.canyonPrototype?.vista&&i%7===0&&weightsAt(d)[1]>.8){
   for(const side of [-1,1] as const){
    const offset=side<0?-(215+random(i+72)*16):(106+random(i+37)*24);
    if(!farSupported(d,offset))continue;
    anchor(d,offset);
    if(clear(side<0?33:26)){
     const width=side<0?47:30,height=side<0?64:40;
     part(mesaGeometry[Math.abs(i+side)%3],
      side<0?'#c6966a':'#a87856',0,-2,0,width,height+random(i)*12,width*.85,
      0,random(i+3)*Math.PI*2);
    }
   }
  }
  // Coast cliffs and low green scrub also vary within the coastal act.
  if(family===0&&i%2===0&&bridgeApproachAllowsBuilding(d,range.bridge)){anchor(d,70+random(i)*25);if(clear(38)){part(rock,'#c3b794',0,theme===undefined?10:4,0,30,theme===undefined?28:40,26,0,random(i)*6);part(round,'#628350',-8,22,0,12,2,14);}}
 }
 // r5: irregular buried rock clusters outside the full reachable vehicle corridor.
 if(range.rocky)for(let i=Math.ceil(range.start/24);i*24<Math.min(length,range.end);i++){
  const d=i*24;if(weightsAt(d)[1]<.65||(canyon&&d>560&&d<940))continue;
  for(const side of [-1,1]){if(random(i*7+side)<.30)continue;const radius=1.8+random(i*11+side)*3.8,h=2+random(i*13+side)*4.5;anchor(d,side*(15+radius+random(i*17)*3));
   if(clear(radius+1.5))part(boulder,'#b58b67',0,h*.25,0,radius,h,radius*.8,0,random(i*19)*6);
   for(let j=0;j<3;j++){const r=.25+random(i*23+j)*.6;anchor(d+j*6,side*(14.5+r+random(i*29+j)*3));if(clear(r+1.5))part(boulder,'#a98262',0,0,0,r,r*.7,r,0,random(i+j)*6);}
  }
 }
 // Connected cut-rock ridge following the inside of this one bend. Buried skirt joins existing terrain.
 if(canyon&&range.start<900&&range.end>600){
  const positions:number[]=[],colors:number[]=[],indices:number[]=[],from=Math.max(600,range.start),to=Math.min(900,range.end),steps=Math.ceil((to-from)/10),offsets=[12,16,19,21,29,33,44,65,110],heights=[-8,4,6,13,16,23,26,38,-15];
  for(let i=0;i<=steps;i++){const d=from+(to-from)*i/steps,p=sample(d),blend=canyonBlend(d);
   for(let j=0;j<offsets.length;j++){const o=offsets[j],v=p.position.clone().addScaledVector(p.right,-o),h=-12+(heights[j]+12)*blend;
    positions.push(v.x,p.position.y+h+(j>0&&j<8?Math.sin(d*.057+j)*3*blend:0),v.z);
    const color=new THREE.Color(['#9c6848','#bb8259','#d1a079','#aa7351','#c38e65','#a87250','#cf9e70','#d9b087','#997a62'][j]);colors.push(color.r,color.g,color.b);
   }
  }
  for(let i=0;i<steps;i++)for(let j=0;j<8;j++){const a=i*9+j,b=a+9;indices.push(a,b,a+1,a+1,b,b+1);}
  const ridge=new THREE.BufferGeometry();ridge.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));ridge.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));ridge.setIndex(indices);const faceted=ridge.toNonIndexed();ridge.dispose();const tint=faceted.getAttribute('color');for(let face=0;face<tint.count/3;face++){const band=Math.floor(face/2)%8,c=new THREE.Color(['#a56f4c','#b98c66','#a9704d','#c2936a','#ad7650','#c39a73','#ba855d','#a18b72'][band]);for(let v=0;v<3;v++)tint.setXYZ(face*3+v,c.r,c.g,c.b);}faceted.computeVertexNormals();faceted.name='canyon-cut-rock';
  base.set(0,0,0);yaw=0;chunk=Math.floor(from/650);part(faceted,'#ffffff',0,0,0,1,1,1);
  // Lower outer foothills and a distant muted mesa: visible depth across the open canyon.
  for(const [d,offset,w,h] of [[860,90,32,65],[890,175,65,100]]){
   if(d<range.start||d>=range.end)continue;anchor(d,offset);if(clear(w+5)){base.y=sample(d).position.y-50;part(mesaGeometry[1],'#b9ad9d',0,0,0,w,h,w*.75);}
  }
 }
 if(!range.openRoad)for(const act of acts)for(let index=0;index<act.landmarks.length;index++){
  const landmark=act.landmarks[index],d=act.start+(act.end-act.start)*landmark.fraction;if(d<range.start||d>=range.end||!bridgeApproachAllowsBuilding(d,range.bridge))continue;anchor(d,landmark.offset);
  if(act.id==='coast'&&index===0){base.y=sample(d).position.y-1;part(rock,'#c3b794',0,-(base.y+5)/2,0,13,base.y+5,12);part(cylinder,'#ede4c7',0,9,0,3.3,18,3.3);part(cylinder,'#b65d43',0,14,0,3.38,1.8,3.38);part(cylinder,'#f4e9cc',0,18,0,4.3,1,4.3);part(cylinder,'#416e79',0,20,0,2.3,3,2.3);part(cone,'#bd6848',0,22.5,0,3.9,2.5,3.9);part(boxes,'#eee0b9',5,2,0,6,4,5);}
  if(act.id==='coast'&&index===1){base.y=-3;for(const dx of [-16,16]){part(boxes,'#f4e7c8',dx,0,0,14,2,4);part(cylinder,'#705b4a',dx,10,0,.15,20,.15);part(cone,'#fff0d0',dx+3,10,0,6,17,.25,0,0,-.18);}}
  if(act.id==='canyon'&&index===0){for(const x of [-18,18])part(rock,'#c88754',x,16,0,6,32,7);part(arch,'#cf955e',0,29,0,18,18,18);part(rock,'#dfad73',-21,5,2,12,10,12);}
  if(act.id==='canyon'&&index===1){mesa(77,true);const original=base.clone();base.x+=38;mesa(91,true);base.copy(original);}
  if(act.id==='city'&&index===0){base.y=sample(d).position.y-.15;part(boxes,'#c6b995',0,-(base.y+5)/2,0,18,base.y+5,20);part(boxes,'#eed7ac',0,22,0,9,44,9);part(boxes,'#d49969',0,44,0,11,1,11);part(cylinder,'#f2e3bf',0,47,0,4.5,5,4.5);part(round,'#548e92',0,50,0,5,3,5);part(cylinder,'#eee6ce',0,39,-4.6,2.6,.15,2.6,Math.PI/2);part(boxes,'#375a63',0,39.7,-4.72,.18,1.7,.18);part(boxes,'#375a63',.7,39,-4.72,1.5,.18,.18);
   // Even the original clock landmark now sits among neighboring city buildings.
   for(const [j,dd] of [-42,40,78].entries()){anchor(d+dd,landmark.offset+14);if(clear(13))building(index*31+j+seed+40);}
  }
  if(act.id==='city'&&index===1){for(const x of [-20,20]){part(boxes,'#4b8090',x,19,0,2,38,2);part(boxes,'#dfb65c',x-10,37,0,36,1.2,1.2);part(cylinder,'#647a7b',x-25,24,0,.07,25,.07);part(boxes,'#d38e6a',x,2,6,14,4,6);}}
 }
 for(const b of buckets.values()){const mesh=new THREE.InstancedMesh(b.geometry,b.material,b.matrices.length);b.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.receiveShadow=true;mesh.castShadow=false;if(b.geometry.userData.waffleSign)mesh.userData.waffleSign=true;if(b.geometry.userData.coastDrainWater)mesh.userData.coastDrainWater=true;if(b.geometry.userData.noShadowGround)mesh.userData.noShadowGround=true;
   if(range.coastUltra)mesh.userData.coastShadowGroup=b.shadowGroup;
   group.add(mesh);}
 return {instances:[...buckets.values()].reduce((n,b)=>n+b.matrices.length,0),draws:buckets.size};
}
