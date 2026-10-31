import * as THREE from 'three';import {trafficRandom} from './traffic-lanes';import type {DrivingState} from './handling';import type {createTrack} from './track';
export interface RockySection {start:number;end:number;side:number;seed:number;r7?:boolean}
/** Keep sparse canyon rock scenes, but put r7 outcrops on the outside of the strongest bend in each scene. */
export function rockySections(seed:number,length:number,weights:(d:number)=>number[],r7=false,curvatureAt?:(d:number)=>number):RockySection[]{
 const out:RockySection[]=[];
 for(let i=0,d=1720;d<length-600;i++,d+=3400){
  const start=i===0?d:Math.round((d+trafficRandom(seed,i)*300)/5)*5;
  const end=start+(i===0?380:Math.round((280+trafficRandom(seed,i+71)*200)/5)*5);
  if(![start,(start+end)/2,end].every(x=>weights(x)[1]>.7))continue;
  const oldSide=i===0?1:trafficRandom(seed,i+54)<.5?-1:1;
  let strongest=0;
  if(r7&&curvatureAt)for(let x=start+25;x<end-25;x+=10){
   const curvature=curvatureAt(x);
   if(Math.abs(curvature)>Math.abs(strongest))strongest=curvature;
  }
  const side=r7&&Math.abs(strongest)>.0006?-Math.sign(strongest):oldSide;
  out.push({start,end,side,seed:seed+i*17,...(r7?{r7:true}:{})});
 }
 return out;
}
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*t*(t*(t*6-15)+10);};
export function rockNode(d:number,s:RockySection){
 const blend=smooth(Math.min(d-s.start,s.end-d)/80);
 const wave=(Math.sin(d*.071+s.seed)+Math.sin(d*.127+s.seed*2))*.5;
 if(!s.r7)return {edge:6.5*(1-blend)+blend*(.55+.22*wave),height:.25+blend*(3.5+1.3*Math.sin(d*.047+s.seed)),blend};
 // Four tall, faceted stone masses with deep uneven valleys between them,
 // not a straight, uniform roadside retaining wall. Same node drives contact.
 const t=Math.max(0,Math.min(1,(d-s.start)/Math.max(1,s.end-s.start)));
 const massive=Math.max(0,Math.cos(t*Math.PI*8+s.seed*.13))**2;
 const secondary=Math.max(0,Math.sin(t*Math.PI*11+s.seed*.27))**2;
 const ridge=Math.max(0,Math.sin(d*.047+s.seed*.9));
 const height=.7+blend*(1.3+16*massive+5*secondary+2.5*ridge);
 const edge=3.4*(1-blend)+blend*(.4+1.35*(1-massive)+.22*wave);
 return {edge,height,blend};
}
/** Collision interpolates the same 5 m vertex rows used by the visible rock face. */
export function rockEdge(d:number,s:RockySection){const lo=Math.max(s.start,Math.min(s.end-5,s.start+Math.floor((d-s.start)/5)*5)),t=(d-lo)/5,a=rockNode(lo,s),b=rockNode(lo+5,s);return a.edge+(b.edge-a.edge)*t;}
export const rockyAt=(d:number,side:number,sections:readonly RockySection[])=>sections.find(s=>s.side===side&&d>=s.start&&d<=s.end);
export function rockWall(sample:ReturnType<typeof createTrack>['sample'],half:(d:number)=>number,s:RockySection,start:number,end:number){const from=Math.max(start,s.start),to=Math.min(end,s.end),positions:number[]=[],uvs:number[]=[],indices:number[]=[];if(to<=from)return;const distances=[from];for(let d=s.start+Math.ceil((from-s.start)/5)*5;d<to;d+=5)if(d>from)distances.push(d);distances.push(to);
 for(const d of distances){const p=sample(d),n=rockNode(d,s),edge=rockEdge(d,s),h=n.height+n.blend*trafficRandom(s.seed,Math.round(d/5))*.9;for(const [offset,height] of (s.r7?[[0,-2],[0,2],[.65,h*.48],[.3,h],[2.7,h*.94],[8,h*.60],[17,-17]]:[[0,-1.5],[0,1.3],[.6,h*.6],[.15,h],[2.5,h*1.1],[7,h*.55],[14,-15]])){const v=p.position.clone().addScaledVector(p.right,s.side*(half(d)+edge+offset));positions.push(v.x,v.y+height,v.z);uvs.push(offset/4,d/4);}}
 for(let i=0;i<distances.length-1;i++)for(let j=0;j<6;j++){const a=i*7+j,b=a+7;indices.push(...(s.side>0?[a,a+1,b,a+1,b+1,b]:[a,b,a+1,a+1,b,b+1]));}const indexed=new THREE.BufferGeometry();indexed.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));indexed.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));indexed.setIndex(indices);const g=indexed.toNonIndexed();indexed.dispose();g.computeVertexNormals();const colors:number[]=[];for(let i=0;i<distances.length-1;i++)for(let band=0;band<6;band++)for(let tri=0;tri<2;tri++){const palette=s.r7&&band===0?['#657a4b','#7a8356','#89906a','#53663f','#867e5b']:['#a17b58','#b28a63','#bd9872','#94704f','#c2a17c'];const c=new THREE.Color(palette[Math.floor(trafficRandom(s.seed+band*37,Math.round(distances[i]/5)*2+tri)*5)]);for(let v=0;v<3;v++)colors.push(c.r,c.g,c.b);}const result={kind:'grass' as const,positions:new Float32Array(g.getAttribute('position').array),colors:new Float32Array(colors),uvs:new Float32Array(g.getAttribute('uv').array),indices:new Uint32Array(Array.from({length:g.getAttribute('position').count},(_,i)=>i)),normals:new Float32Array(g.getAttribute('normal').array)};g.dispose();return result;}
export class RockContact {impacts=0;yaw=0;roll=0;private latched=false;private push=0;constructor(private sections:readonly RockySection[],private half:(d:number)=>number,private width:number,private length:number,private ready:(d:number)=>boolean=()=>true){}reset(){this.impacts=this.yaw=this.roll=this.push=0;this.latched=false;}
 update(s:DrivingState,previous:{distance:number;lateral:number},dt:number){const decay=Math.exp(-dt/.16);this.yaw*=decay;this.roll*=decay;s.lateral+=this.push*dt;this.push*=decay;let boundary: {side:number;limit:number;distance:number;edge:number;penetration:number;section:RockySection}|undefined;const extent=this.width*Math.abs(Math.cos(s.heading+this.yaw))+this.length*Math.abs(Math.sin(s.heading+this.yaw))+.05;
 for(const r of this.sections){const a=Math.max(r.start,Math.min(previous.distance,s.distance)-this.length),b=Math.min(r.end,Math.max(previous.distance,s.distance)+this.length);if(b<a)continue;const steps=Math.max(1,Math.ceil((b-a)/2.5));for(let i=0;i<=steps;i++){const d=a+(b-a)*i/steps;if(!this.ready(d))continue;const edge=this.half(d)+rockEdge(d,r),limit=edge-extent;const penetration=s.lateral*r.side-limit;if(!boundary||penetration>boundary.penetration)boundary={side:r.side,limit,distance:d,edge,penetration,section:r};}}
 if(!boundary||s.lateral*boundary.side<boundary.limit-.5){this.latched=false;return;}if(s.lateral*boundary.side<=boundary.limit)return;const b=boundary;s.lateral=b.side*b.limit;s.lateralRate=Math.min(0,s.lateralRate*b.side)*b.side;s.corridorSide=0;if(this.latched)return;this.latched=true;this.impacts++;const outgoing=Math.max(0,(s.lateral-previous.lateral)*b.side/Math.max(dt,.001));
 const severity=Math.max(.15,Math.min(1,.15+outgoing/11+s.speed/300));
 const ahead=Math.min(b.section.end,b.distance+5),behind=Math.max(b.section.start,b.distance-5);
 const slope=(rockEdge(ahead,b.section)-rockEdge(behind,b.section))/Math.max(1,ahead-behind);
 const irregular=Math.min(1,Math.abs(slope)*5);
 const normalVariation=Math.max(-.35,Math.min(.35,slope*2));
 s.speed*=1-(.08+.30*severity)*(1+.25*irregular);
 // The irregular inner rock-face normal also changes the actual lateral kick,
 // not just the car's rendering yaw. Recovery is still bounded and arcade-safe.
 this.push=-b.side*(1.5+6*severity)*(1+normalVariation);
 s.lateralRate=-b.side*(.6+2.4*severity)*(1+normalVariation);
 // Slope is measured from the same visible inner stone vertices, so nearby
 // strikes can reflect in different directions instead of repeating one yaw.
 this.yaw=Math.max(-.30,Math.min(.30,(b.side*.10-slope*1.7)*severity));
 this.roll=b.side*(.07+.055*irregular)*severity;
 return {distance:b.distance,lateral:b.side*b.edge,side:b.side,severity,normalSlope:slope};}
 inspect(){return {impacts:this.impacts,yaw:this.yaw,roll:this.roll,latched:this.latched};}}
