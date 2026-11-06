import {coastBeachX,coastProfileX,COAST_CROSSWALKS} from './coast-layout';
import {coastHillHeight,COAST_HILL_STRIPS} from './coast-terrain';
import {bridgeMeshes,onBridge,type BridgeSpan} from './bridge';
import {rockyAt,rockNode,rockWall,type RockySection} from './rocky-shoulder';
import {CANYON_BEND,canyonBend,canyonBlend} from './canyon-identity';
import * as THREE from 'three';
import {ACTS} from './acts';
import {roadOffset,LANE_WIDTH,TRIP_BARRIER_INNER_M,TRIP_BARRIER_OUTER_M,tripBarrierRawOffset,type Shoulders} from './road-profile';
import {interchangeCenterOffset,interchangeLaneBoundaries,interchangeRailOpening,interchangeRampAt,interchangeRampSpan,interchangeRampElevation,interchangeWallSpan,interchangeWallTop,RAMP_RETAINING_WALL_OFFSET,type RoadInterchange} from './road-interchange';
import type {createTrack} from './track';
import {sceneryGroundMixAt,sceneryGroundY,coastUltraGroundY,sceneryFarReach,type ScenerySection} from './scenery-cross-section';
import {canyonGroundY,canyonRiverRaw,canyonSceneEnvelope,GRAND_CANYON_VALLEY_STRIPS,GRAND_CANYON_RIDGE_STRIPS,type GrandCanyonScene} from './grand-canyon-scene';
import {canyonStratumColor} from './canyon-language';

type Sample=ReturnType<typeof createTrack>['sample'];
export interface RayRange {start:number;end:number;offset:number;count:number}
export interface RoadMeshData {artContactOnly?:boolean;artVisualOnly?:boolean;normals?:Float32Array;rayRanges?:RayRange[];kind:'asphalt'|'sand'|'grass'|'line'|'center-line'|'rail'|'support'|'edge-white'|'edge-red'|'surf'|'steel'|'deck'|'water';positions:Float32Array;uvs:Float32Array;colors:Float32Array;indices:Uint32Array}
type Edge=number|((d:number)=>number);
/** Numeric road preparation. Every endpoint uses the original absolute sampler. */
export function prepareRoadChunk(sample:Sample,halfAt:(d:number)=>number,weightsAt:(d:number)=>number[],start:number,end:number,length:number,canyon=false,seamless=false,rocks:readonly RockySection[]=[],shoulders?:(d:number)=>Shoulders,bridge?:BridgeSpan,cacheExactSamples=true,interchange?:RoadInterchange,scenerySections?:readonly ScenerySection[],grandCanyon?:GrandCanyonScene,blenderPaint=false,mountainPaint=false):RoadMeshData[]{
 const out:RoadMeshData[]=[];
 const coastUltra=!!scenerySections?.some(s=>s.id==='coast-ultra-left-sea');
 // S2B experiment: repeated absolute-distance queries across ribbons and markings.
 // Reuse exact values within this chunk only; no interpolation or global retention.
 // Passing false keeps the uncached lookup path for byte-equivalence tests.
 const frameCache=cacheExactSamples?new Map<number,ReturnType<Sample>>():undefined;
 const widthCache=cacheExactSamples?new Map<number,number>():undefined;
 const weightsCache=cacheExactSamples?new Map<number,number[]>():undefined;
 const shoulderCache=cacheExactSamples&&shoulders?new Map<number,Shoulders>():undefined;
 const groundMixCache=scenerySections?new Map<number,ReturnType<typeof sceneryGroundMixAt>>():undefined;
 const sampled=(d:number)=>{
  const found=frameCache?.get(d);if(found)return found;
  const result=sample(d);frameCache?.set(d,result);return result;
 };
 const cachedWidth=(d:number)=>{
  if(widthCache?.has(d))return widthCache.get(d)!;
  const result=halfAt(d);widthCache?.set(d,result);return result;
 };
 const cachedWeights=(d:number)=>{
  const found=weightsCache?.get(d);if(found)return found;
  const result=weightsAt(d);weightsCache?.set(d,result);return result;
 };
 const cachedShoulders=(d:number)=>{
  if(!shoulders)return undefined;
  const found=shoulderCache?.get(d);if(found)return found;
  const result=shoulders(d);shoulderCache?.set(d,result);return result;
 };
 const mixedAt=(d:number)=>{
  if(!scenerySections)return {leftLand:0,rightSea:0};
  const found=groundMixCache?.get(d);if(found)return found;
  const result=sceneryGroundMixAt(scenerySections,d);groundMixCache?.set(d,result);return result;
 };
 const surfaceY=(d:number,raw:number,h:number,kind:RoadMeshData['kind'])=>{
  const pose=sampled(d),width=cachedWidth(d),shoulder=cachedShoulders(d);
  const physical=(o:number)=>roadOffset(o,width,shoulder);
  const projected=pose.position.y+pose.right.y*physical(raw);
  const legacy=raw<=-27?THREE.MathUtils.lerp(h<-10?-4.88:-5.05,
   projected-2-Math.abs(raw)*.015,cachedWeights(d)[1]):projected+h;
  if(coastUltra&&['sand','grass','surf'].includes(kind))return coastUltraGroundY(raw,pose.position.y,pose.right.y,physical,d);
  if(!scenerySections||!['sand','grass','surf'].includes(kind))return legacy;
  const mix=mixedAt(d),ground=sceneryGroundY(raw,pose.position.y,pose.right.y,
   physical,cachedWeights(d)[1],mix);
  if(kind==='surf'){
   if(raw<0)return THREE.MathUtils.lerp(legacy,ground-3,mix.leftLand);
   return THREE.MathUtils.lerp(ground-3,-4.92,mix.rightSea);
  }
  return grandCanyon?canyonGroundY(grandCanyon,d,raw,pose.position.y,ground):ground;
 };
 const append=(kind:RoadMeshData['kind'],a:Edge,b:Edge,ha:number,hb:number,from:number,to:number,step:number,vertical?:(d:number)=>number,extraOuter=false)=>{
  if(to<=from)return;
  const outer=extraOuter||kind==='rail'||kind==='surf'||((kind==='sand'||kind==='grass')&&typeof a==='number'&&typeof b==='number'&&(a>=13||b<=-13));
  if(bridge&&outer&&from<bridge.end&&to>bridge.start){if(from<bridge.start)append(kind,a,b,ha,hb,from,bridge.start,step);if(to>bridge.end)append(kind,a,b,ha,hb,bridge.end,to,step);return;}
  const positions:number[]=[],uvs:number[]=[],colors:number[]=[],indices:number[]=[],normals:number[]=[],n=Math.ceil((to-from)/step);
  const sectionGround=!!scenerySections&&(kind==='sand'||kind==='grass'||kind==='surf');
  const point=(d:number,raw:Edge,h:number)=>{const p=sampled(d),o=typeof raw==='number'?raw:raw(d),v=p.position.clone().addScaledVector(p.right,roadOffset(o,cachedWidth(d),cachedShoulders(d))),w=cachedWeights(d),coastal=h<-10?-4.88:-5.05;
   v.y=sectionGround?surfaceY(d,o,h,kind):o<=-27?THREE.MathUtils.lerp(coastal,v.y-2-Math.abs(o)*.015,w[1]):v.y+h;
   if(canyon&&kind==='grass')v.y-=canyonBlend(d)*Math.max(0,(o-13)/147)*65;if(vertical)v.y+=vertical(d);return v;};
  for(let i=0;i<=n;i++){const d=from+(to-from)*i/n,p=sampled(d);for(const [raw,h] of [[a,ha],[b,hb]] as [Edge,number][]){
   const o=typeof raw==='number'?raw:raw(d),v=p.position.clone().addScaledVector(p.right,roadOffset(o,cachedWidth(d),cachedShoulders(d))),weights=cachedWeights(d);
   const coastal=o<=-27?(h<-10?-4.88:-5.05):v.y+h;
   const legacyHeight=o<=-27?THREE.MathUtils.lerp(coastal,v.y-2-Math.abs(o)*.015,weights[1]):v.y+h;
   const height=sectionGround?surfaceY(d,o,h,kind):legacyHeight;
   const terrainDrop=canyon&&kind==='grass'?canyonBlend(d)*Math.max(0,(o-13)/147)*65:0;
   positions.push(v.x,height-terrainDrop+(vertical?vertical(d):0),v.z);
   // Coast sand's currently unused UV.x can encode the true widened beach
   // cross-section for the wet-sand reflection in the existing PBR material.
   const profileX=coastUltra&&kind==='sand'?coastProfileX(roadOffset(o,cachedWidth(d),cachedShoulders(d)),d):undefined;
   uvs.push(profileX===undefined?o/4:profileX,d/4);
   if(seamless){const cross=point(d,b,hb).sub(point(d,a,ha)),along=point(Math.min(length,d+.5),raw,h).sub(point(Math.max(0,d-.5),raw,h)),normal=cross.cross(along).normalize();normals.push(normal.x,normal.y,normal.z);}
   if(kind==='sand'||kind==='grass'){const color=new THREE.Color(0,0,0);weights.forEach((w,j)=>color.add(new THREE.Color(kind==='sand'?ACTS[j].shoulder:ACTS[j].ground).multiplyScalar(w)));if(canyon&&kind==='grass')color.lerp(new THREE.Color('#987e68'),canyonBlend(d)*Math.max(0,Math.min(1,(o-13)/90)));
    if(coastUltra&&kind==='sand'){
     const x=coastProfileX(roadOffset(o,cachedWidth(d),cachedShoulders(d)),d);
     color.set('#dfc894').lerp(new THREE.Color('#a58e68'),Math.max(0,Math.min(1,(-x-15)/11)));
     // Static low-frequency sand colour grain; no extra GPU layer or blinking.
     // The water remains brightest, but dry land no longer reads as flat paper.
     const grain=Math.sin(d*.047+x*.21)*Math.sin(d*.011-x*.43);
     const broad=Math.sin(d*.0093+x*.071);
     color.multiplyScalar(.97+.055*grain+.025*broad);
    }
    if(coastUltra&&kind==='grass'){
     const x=roadOffset(o,cachedWidth(d),cachedShoulders(d)),hill=coastHillHeight(x,d);
     const relief=THREE.MathUtils.clamp(hill/48,0,1);
     // The old varying ochre overlay washed out some distant hills into
     // bright yellow bands. Keep gentle sunset warmth only by the road,
     // fading it away before reaching the inland foothills.
     const inland=THREE.MathUtils.smoothstep(x,115,235);
     color.set('#758452').lerp(new THREE.Color('#4d6141'),relief);
     color.lerp(new THREE.Color('#9a8866'),.055*(1-inland));
     color.multiplyScalar(.95-.025*relief);
    }
    if(grandCanyon&&d>grandCanyon.start&&d<grandCanyon.end&&Math.abs(o)>13){
     const blend=Math.min(1,(d-grandCanyon.start)/180,(grandCanyon.end-d)/180);
     color.lerp(new THREE.Color(o<0?'#b98459':'#a8754d'),Math.max(0,blend)*.83);
    }
    if((grandCanyon?.vista||grandCanyon?.authored)&&Math.abs(o)>14){
     const visibility=canyonSceneEnvelope(grandCanyon,d);
     if(visibility>.01)color.lerp(
      new THREE.Color(canyonStratumColor(grandCanyon,d,o,height)),
      visibility*.87);
    }
    if(scenerySections&&kind==='grass'&&o>13){
     color.lerp(new THREE.Color('#83bdc5'),
      mixedAt(d).rightSea*Math.max(0,Math.min(1,(o-13)/62)));
    }const rocky=rockyAt(d,Math.sign(o),rocks);if(rocky&&Math.abs(o)>7)color.lerp(new THREE.Color('#927658'),rockNode(d,rocky).blend);colors.push(color.r,color.g,color.b);}
   if(kind==='asphalt'&&mountainPaint){
    // No added geometry: minor age/dust variation in existing asphalt vertex
    // colors. The road is still fully raycastable and collision-identical.
    const wear=Math.abs(Math.sin(d*.071+o*.27)*Math.sin(d*.027-o*.61));
    const v=.84+wear*.11;colors.push(v,v*.985,v*.96);
   }
  }}
  for(let i=0;i<n;i++){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  out.push({kind,...(seamless&&kind!=='support'?{normals:new Float32Array(normals)}:{}),...((kind==='asphalt'||kind==='sand')?{rayRanges:[{start:from,end:to,offset:0,count:indices.length}]}:{}),positions:new Float32Array(positions),uvs:new Float32Array(uvs),colors:new Float32Array(colors),indices:new Uint32Array(indices)});
 };
 // Only the 1.5km demonstration corridor gets additional cross-section
 // vertices. Existing r10 sections and the complete asphalt mesh are untouched.
 const cutFrom=grandCanyon?Math.max(start,grandCanyon.start):end;
 const cutTo=grandCanyon?Math.min(end,grandCanyon.end):start;
 const active=!!grandCanyon&&cutTo>cutFrom;
 if(coastUltra){
  // Physical beach stations survive the variable-width shoulder conversion.
  const rawAt=(metres:number)=>(d:number)=>tripBarrierRawOffset(-1,-coastBeachX(metres,d)-cachedWidth(d),cachedShoulders(d)!);
  for(const [a,b] of [[-100,-46],[-46,-34],[-34,-26],[-26,-22],[-22,-18],[-18,-11],[-11,-7]])
   append('sand',rawAt(a),rawAt(b),0,0,start,end,2.5);
  append('sand',-7,7,-.1,-.1,start,end,2.5);
  append('sand',7,13,-.1,-.1,start,end,2.5);
 }else{
  if(scenerySections)append('sand',d=>-sceneryFarReach(sampled(d).curvature),-160,-12,-9,start,end,10,undefined,true);
  if(active){
   if(start<cutFrom)append('sand',-160,-27,-9,-9,start,cutFrom,10);
   const strips=[-160,...GRAND_CANYON_VALLEY_STRIPS.filter(x=>x>-160&&x<-27),-27];
   for(let i=1;i<strips.length;i++)append('sand',strips[i-1],strips[i],-9,-9,cutFrom,cutTo,15);
   if(cutTo<end)append('sand',-160,-27,-9,-9,cutTo,end,10);
  }else append('sand',-160,-27,-9,-9,start,end,10);
  append('sand',-27,-13,-9,-.1,start,end,10);
  if(seamless){for(const [a,b] of [[-13,-7],[-7,7],[7,13]])append('sand',a,b,-.1,-.1,start,end,2.5);}
  else append('sand',-13,13,-.1,-.1,start,end,2.5);
 }
 if(coastUltra){
  // Actual cross-slope relief: fine near the verge, coarse on distant ridges.
  const strips=COAST_HILL_STRIPS;
  for(let i=1;i<strips.length;i++)append('grass',strips[i-1],strips[i],0,0,start,end,strips[i]<140?5:20);
 }else if(active){
  for(const [a,b,ha,hb] of [[13,75,-.12,-3],[75,160,-3,-14]]){
   if(start<cutFrom)append('grass',a,b,ha,hb,start,cutFrom,10);
   if(cutTo<end)append('grass',a,b,ha,hb,cutTo,end,10);
  }
  const strips=GRAND_CANYON_RIDGE_STRIPS;
  for(let i=1;i<strips.length;i++)if(strips[i-1]<160)
   append('grass',strips[i-1],Math.min(160,strips[i]),-.12,-.12,cutFrom,cutTo,15);
 }else{
  append('grass',13,75,-.12,-3,start,end,10);
  append('grass',75,160,-3,-14,start,end,10);
 }
 if(scenerySections&&!coastUltra)append('grass',160,d=>sceneryFarReach(sampled(d).curvature),-14,-48,start,end,10,undefined,true);
 append('asphalt',-7,7,0,0,start,end,2.5);
 // The off-ramp takes away the mainline's last (fifth) lane; the on-ramp
 // supplies that exact lane. Render feeder geometry until it overlaps the
 // existing mainline surface at the Y, instead of placing a disconnected road.
 if(interchange&&shoulders){
  for(const kind of ['entry','exit'] as const){
   const span=interchangeRampSpan(interchange,kind);
   const a=Math.max(start,span.from),b=Math.min(end,span.to);
   if(b<=a)continue;
   const raw=(d:number,outer:boolean)=>{
    const r=interchangeRampAt(interchange,kind,d);
    const offset=(r?.gap??0)-(r?.overlap??0)+(outer?(r?.width??0):0);
    // Negative clearance means inside the newly-created fifth lane. Scale
    // through the same 14m reference coordinates as all other road ribbons.
    return offset<0?(cachedWidth(d)+offset)*7/cachedWidth(d):
     tripBarrierRawOffset(1,offset,cachedShoulders(d)!);
   };
   const inner=(d:number)=>raw(d,false),outer=(d:number)=>raw(d,true);
   append('asphalt',inner,outer,.045,.045,a,b,2.5,d=>interchangeRampElevation(interchange,kind,d));
   // A short side retaining face prevents the feeder from levitating over
   // an elevated roadside embankment. No new material/draw family.
   append('support',outer,outer,-.08,-3.5,a,b,2.5,d=>interchangeRampElevation(interchange,kind,d));
   // Spaced painted chevrons in the physical triangular gore between the
   // separated ramp and the mainline: the join/split has a readable cause.
   for(let d=Math.ceil(a/18)*18;d<b;d+=18){
    const r=interchangeRampAt(interchange,kind,d);
    if(!r||r.gap<2||r.width<1)continue;
    const near=(x:number)=>(z:number)=>tripBarrierRawOffset(1,(interchangeRampAt(interchange,kind,z)?.gap??0)*x,cachedShoulders(z)!);
    append('line',near(.2),near(.8),.035,.035,d,Math.min(d+3,b),1.5);
   }
  }
  // Reuse the existing grey double-sided deck material for two short concrete
  // retaining walls. Their tops dive beneath nearby terrain at both ends.
  // The walls start before the ramp begins (entry) or after the split (exit)
  // so no vertical wall blocks a drivable merge lane.
  for(const kind of ['entry','exit'] as const){
   const wall=interchangeWallSpan(interchange,kind);
   const a=Math.max(start,wall.from),b=Math.min(end,wall.to);
   if(b<=a)continue;
   const topEdge=(d:number)=>tripBarrierRawOffset(1,RAMP_RETAINING_WALL_OFFSET,cachedShoulders(d)!);
   const footEdge=(d:number)=>tripBarrierRawOffset(1,RAMP_RETAINING_WALL_OFFSET+3.2,cachedShoulders(d)!);
   // Sloped concrete face, as on a real highway cutting. The broad buried
   // foot supports the wall and screens the ramp's hidden lower alignment.
   append('deck',topEdge,footEdge,0,-15,a,b,2.5,d=>interchangeWallTop(interchange,kind,d)??-4);
  }
 }
 append('line',d=>-7+.35*7/halfAt(d),d=>-7+.51*7/halfAt(d),.025,.025,start,end,2.5);
 append('line',d=>7-.51*7/halfAt(d),d=>7-.35*7/halfAt(d),.025,.025,start,end,2.5);
 if(shoulders&&!coastUltra){
  // r7: continuous visible rails flank each row of roadside markers.
  // Placement is measured in physical meters beyond asphalt, not shoulder-scaled
  // legacy offsets. Bridges, the authored canyon and rock walls remain special.
  for(const side of [-1,1] as const){
   if(coastUltra&&side===-1)continue; // unobstructed ocean-side visibility
   let ranges:number[][]=canyon?[[start,Math.min(end,CANYON_BEND.start)],[Math.max(start,CANYON_BEND.end),end]]:[[start,end]];
   for(const rock of rocks.filter(r=>r.side===side))ranges=ranges.flatMap(([a,b])=>b<=rock.start||a>=rock.end?[[a,b]]:[[a,Math.min(b,rock.start)],[Math.max(a,rock.end),b]].filter(([x,y])=>y>x));
   const inner=(d:number)=>tripBarrierRawOffset(side,TRIP_BARRIER_INNER_M,cachedShoulders(d)!);
   const outer=(d:number)=>tripBarrierRawOffset(side,TRIP_BARRIER_OUTER_M,cachedShoulders(d)!);
   if(side===1&&interchange){
    // Physical rail opening only at each actual merge throat; far-away
    // separated ramp retains the main road's protective rail.
    const entry=interchangeRampSpan(interchange,'entry'),exit=interchangeRampSpan(interchange,'exit');
    const mouths=[[entry.from,entry.to],[exit.from,exit.to]];
    for(const [lo,hi] of mouths)ranges=ranges.flatMap(([r0,r1])=>
     r1<=lo||r0>=hi?[[r0,r1]]:[[r0,Math.min(r1,lo)],[Math.max(r0,hi),r1]].filter(([x,y])=>y>x));
   }
   for(const [a,b] of ranges){
    append('rail',inner,outer,.65,.65,a,b,2.5);
    append('rail',inner,outer,1.12,1.12,a,b,2.5);
   }
  }
 }else if(!coastUltra){
  // Previous revisions retain their unchanged left coastal guardrail.
  let railRanges=canyon?[[start,Math.min(end,CANYON_BEND.start)],[Math.max(start,CANYON_BEND.end),end]]:[[start,end]];
  for(const rock of rocks.filter(r=>r.side<0))railRanges=railRanges.flatMap(([a,b])=>b<=rock.start||a>=rock.end?[[a,b]]:[[a,Math.min(b,rock.start)],[Math.max(a,rock.end),b]].filter(([x,y])=>y>x));
  for(const [a,b] of railRanges){append('rail',-12.5,-12.3,.65,.65,a,b,2.5);append('rail',-12.5,-12.3,1.12,1.12,a,b,2.5);}
 }
 if(canyon){const a=Math.max(start,CANYON_BEND.start),b=Math.min(end,CANYON_BEND.end);append('rail',CANYON_BEND.railOffset,CANYON_BEND.railOffset,.6,1.05,a,b,2.5);append('rail',CANYON_BEND.railOffset-CANYON_BEND.railHalfThickness,CANYON_BEND.railOffset+CANYON_BEND.railHalfThickness,1.05,1.05,a,b,2.5);}
 // The Designer's Cut has no ocean shoreline — only its actual river.
 if(!coastUltra&&!grandCanyon?.authored&&!mountainPaint){
  if(active){
   if(start<cutFrom)append('surf',-29,-27,-10.9,-10.9,start,cutFrom,10);
   if(cutTo<end)append('surf',-29,-27,-10.9,-10.9,cutTo,end,10);
  }else append('surf',-29,-27,-10.9,-10.9,start,end,10);
  if(scenerySections){
   if(active){
    if(start<cutFrom)append('surf',75,77,-10.9,-10.9,start,cutFrom,10);
    if(cutTo<end)append('surf',75,77,-10.9,-10.9,cutTo,end,10);
   }else append('surf',75,77,-10.9,-10.9,start,end,10);
  }
 }
 // Dash and edge phases are absolute. Splitting a piece at a chunk seam does
 // not reset its phase or duplicate its area.
 if(blenderPaint)for(const [a,b] of [[-.24,-.14],[.14,.24]])append('center-line',a,b,.03,.03,start,end,2.5);
 // One-way road: no double-yellow centerline.
 for(let d=Math.floor(start/6)*6;!blenderPaint&&d<end;d+=6){
  if(d<0)continue;
  if(coastUltra&&COAST_CROSSWALKS.some(at=>d+3>at-4&&d<at+4))continue;
  if(mountainPaint){
   // One-way four-lane course: all three separators are dashed white.
   for(const lane of [-LANE_WIDTH,0,LANE_WIDTH]){
    const raw=lane*7/halfAt(d);
    append('line',raw-.14,raw+.14,.03,.03,Math.max(start,d),
     Math.min(end,d+3,length),1.5);
   }
   continue;
  }
  const junctionLanes=interchangeLaneBoundaries(interchange,d,halfAt(d));
  if(junctionLanes){
   // Four original lanes remain exactly where they were; only the rightmost
   // additional separator is painted after the merge lane reaches full width.
   for(const lane of junctionLanes){
    const originalX=lane*halfAt(d)/7+interchangeCenterOffset(interchange,d);
    const at=(delta:number)=>(s:number)=>(originalX-interchangeCenterOffset(interchange,s)+delta)*7/halfAt(s);
    append('line',at(-.14),at(.14),.03,.03,Math.max(start,d),Math.min(end,d+3,length),1.5);
   }
  }else{
   const separators=coastUltra&&Math.round(halfAt(d)*2/LANE_WIDTH)===5?[-1.5,-.5,.5,1.5]:[-3,-2,-1,0,1,2,3];
   for(const lane of separators.map(n=>n*LANE_WIDTH)){
    if(Math.abs(lane)+.5>=Math.min(halfAt(d),halfAt(Math.min(d+3,length))))continue;
    const at=(delta:number)=>(s:number)=>(lane+delta)*7/halfAt(s);
    append('line',at(-.14),at(.14),.03,.03,Math.max(start,d),Math.min(end,d+3,length),1.5);
   }
  }
 }
 if(mountainPaint)for(const [a,b] of [[-6.97,-6.83],[6.83,6.97]])append('edge-white',a,b,.035,.035,start,end,2.5);
 if(coastUltra)for(const at of COAST_CROSSWALKS){
  const from=Math.max(start,at-2.8),to=Math.min(end,at+2.8);if(to<=from)continue;
  for(let x=-6.4;x<6.4;x+=1.15)append('line',x,x+.55,.038,.038,from,to,1.4);
 }
 for(let color=0;!coastUltra&&!blenderPaint&&!mountainPaint&&color<2;color++)for(let d=Math.floor((start-color*3)/6)*6+color*3;d<end;d+=6)for(const side of [-1,1] as const){
  if(d<0||onBridge(d,bridge)||(canyon&&canyonBend(d))||rockyAt(d,side,rocks)||(interchange&&interchangeRailOpening(interchange,d,side)))continue;
  // Canyon road edges are dusty and deliberately not painted like a racetrack.
  // Keep white readable markings but drop the alternating red curb tiles.
  if(color&&(grandCanyon?.vista||grandCanyon?.authored)&&canyonSceneEnvelope(grandCanyon,d)>.35)continue;
  const offsets=side<0?[-7.7,-7.02]:[7.02,7.7];
  append(color?'edge-red':'edge-white',offsets[0],offsets[1],-.065,-.065,Math.max(start,d),Math.min(end,d+3,length),1.5);
 }
 if(!coastUltra){
 const positions:number[]=[],indices:number[]=[],n=Math.ceil((end-start)/2.5);
 for(let i=0;i<=n;i++){const d=start+(end-start)*i/n,p=sample(d);for(const side of [-1,1]){const v=p.position.clone().addScaledVector(p.right,roadOffset(side*13,halfAt(d),shoulders?.(d)));positions.push(v.x,v.y-.1,v.z,v.x,onBridge(d,bridge)?v.y-1.2:Math.min(v.y-4,-5),v.z);}}
 for(let i=0;i<n;i++)for(let side=0;side<2;side++){const a=i*4+side*2,b=a+4;indices.push(a,a+1,b,a+1,b+1,b);}
 out.push({kind:'support',positions:new Float32Array(positions),uvs:new Float32Array(),colors:new Float32Array(),indices:new Uint32Array(indices)});
 }
 // The fixed-world-Y river follows the canyon floor but never follows
 // the road's vertical grade. It joins exactly at absolute chunk endpoints.
 if(active&&grandCanyon){
  const from=Math.max(start,grandCanyon.start+195),to=Math.min(end,grandCanyon.end-195);
  if(to>from){
   const p:number[]=[],uv:number[]=[],ix:number[]=[],n=Math.ceil((to-from)/12);
   for(let i=0;i<=n;i++){
    const d=from+(to-from)*i/n,frame=sampled(d);
    const middle=canyonRiverRaw(grandCanyon,d);
    const envelope=Math.min(1,(d-(grandCanyon.start+195))/35,(grandCanyon.end-195-d)/35);
    const half=grandCanyon.riverWidth*.5*Math.max(0,envelope);
    for(const raw of [middle-half,middle+half]){
     const v=frame.position.clone().addScaledVector(frame.right,roadOffset(raw,cachedWidth(d),cachedShoulders(d)));
     p.push(v.x,grandCanyon.riverY,v.z);uv.push(raw/12,d/12);
    }
    if(i<n){const a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2);}
   }
   out.push({kind:'water',positions:new Float32Array(p),uvs:new Float32Array(uv),
    colors:new Float32Array(),indices:new Uint32Array(ix)});
  }
 }
 // Historic r6 rock walls only. Current r7 generates no near-road rock sections.
 for(const r of rocks){const wall=rockWall(sample,halfAt,r,start,end);if(wall)out.push(wall);}
 if(bridge)out.push(...bridgeMeshes(sample,halfAt,bridge,start,end));
 // Merge by material before upload; dashes are not individual draw calls.
 const merged:RoadMeshData[]=[];
 for(const kind of new Set(out.map(x=>x.kind))){
  const pieces=out.filter(x=>x.kind===kind),positions=new Float32Array(pieces.reduce((n,x)=>n+x.positions.length,0)),uvs=new Float32Array(pieces.reduce((n,x)=>n+x.uvs.length,0)),colors=new Float32Array(pieces.reduce((n,x)=>n+x.colors.length,0)),indices=new Uint32Array(pieces.reduce((n,x)=>n+x.indices.length,0));const normals=new Float32Array(pieces.reduce((n,x)=>n+(x.normals?.length??0),0));const rayRanges:RayRange[]=[];let normalOffset=0;let p=0,u=0,c=0,k=0;
  for(const x of pieces){if(x.normals){normals.set(x.normals,normalOffset);normalOffset+=x.normals.length;}for(const r of x.rayRanges??[])rayRanges.push({...r,offset:r.offset+k});positions.set(x.positions,p);uvs.set(x.uvs,u);colors.set(x.colors,c);for(let i=0;i<x.indices.length;i++)indices[k+i]=x.indices[i]+p/3;p+=x.positions.length;u+=x.uvs.length;c+=x.colors.length;k+=x.indices.length;}
  merged.push({kind,positions,uvs,colors,indices,...(normals.length?{normals}:{}),...(rayRanges.length?{rayRanges}:{})});
 }
 return merged;
}
