import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createSpiderShell,createRearTonneau} from './hero-body';
import type {CarModel} from './car-models';

/** Original era-inspired silhouettes, sharing the approved body envelope.
 * Each vehicle MUST still fit around the unchanged 2.91m wheelbase, 2.5m
 * width and 4.8m overall length. One active mesh is baked only on selection.
 */
const CLASSIC_SHAPES={
 'riviera-62':{
  profile:[
   [-2.34,.83,.79],[-2.25,.98,.86],[-1.98,1.065,.93],
   [-1.46,1.10,.96],[-1.09,1.08,.96],[.66,1.08,.90],
   [1.17,1.045,.835],[1.78,.92,.70],[2.30,.69,.55],
  ],
  rearHeight:.96,curve:'soft',upper:.98,
 },
 'grand-tourer-67':{
  // 1960s grand tourer: longer shoulder/bonnet, rounded tapered rear.
  profile:[
   [-2.34,.77,.70],[-2.22,.89,.76],[-1.95,.985,.84],
   [-1.43,1.075,.94],[-1.09,1.09,.965],[.66,1.11,.94],
   [1.24,1.095,.88],[1.87,.965,.77],[2.30,.68,.575],
  ],
  rearHeight:.90,curve:'soft',upper:1.04,
 },
 'wedge-spider-76':{
  // 1970s angular wedge: broad square tail, flat upper crease and
  // sharply plunging front. Deliberately NOT Catmull-smoothed.
  profile:[
   [-2.34,.91,.73],[-2.24,1.07,.77],[-1.90,1.12,.84],
   [-1.45,1.12,.89],[-1.09,1.10,.94],[.66,1.09,.90],
   [1.25,1.065,.75],[1.85,.925,.63],[2.30,.71,.53],
  ],
  rearHeight:.89,curve:'linear',upper:.93,
 },
} as const;
type Profile=readonly (readonly [number,number,number])[];

const section=[[-.69,.33],[-.96,.44],[-1,.59],[-.985,.75],[-.90,.88],
 [-.76,.99],[-.52,1.015],[.52,1.015],[.76,.99],[.90,.88],
 [.985,.75],[1,.59],[.96,.44],[.69,.33]] as const;
const catmull=(a:number,b:number,c:number,d:number,t:number)=>
 .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);

/** Smooth Barchetta and long-nose GT vs. genuinely angular wedge. */
function classicShell(model:CarModel){
 if(model==='riviera-62')return createSpiderShell();
 const spec=CLASSIC_SHAPES[model],profiles=spec.profile as Profile;
 const position:number[]=[],index:number[]=[],rows:number[]=[];
 for(let i=0;i<profiles.length-1;i++){
  const a=profiles[Math.max(0,i-1)],b=profiles[i],
   c=profiles[i+1],d=profiles[Math.min(profiles.length-1,i+2)];
  const steps=spec.curve==='linear'?2:Math.max(2,Math.ceil((c[0]-b[0])/.12));
  for(let j=0;j<steps;j++){
   const t=j/steps;
   const z=THREE.MathUtils.lerp(b[0],c[0],t);
   const w=spec.curve==='linear'?THREE.MathUtils.lerp(b[1],c[1],t):catmull(a[1],b[1],c[1],d[1],t);
   const h=spec.curve==='linear'?THREE.MathUtils.lerp(b[2],c[2],t):catmull(a[2],b[2],c[2],d[2],t);
   rows.push(z);
   for(const [x,y] of section)position.push(x*w,y>.4?Math.min(y*h+.002,1.04):y,z);
  }
 }
 const last=profiles[profiles.length-1];rows.push(last[0]);
 for(const [x,y] of section)position.push(x*last[1],y>.4?Math.min(y*last[2]+.002,1.04):y,last[0]);
 const sides=section.length;
 for(let r=0;r<rows.length-1;r++){
  const middle=(rows[r]+rows[r+1])*.5;
  for(let i=0;i<sides;i++){
   if(i===6&&middle>-1.09&&middle<.66)continue; // actual open cockpit
   const a=r*sides+i,b=r*sides+(i+1)%sides,c=a+sides,d=b+sides;
   index.push(a,c,b,a,d,c);
  }
 }
 for(let i=1;i<sides-1;i++){
  index.push(0,i,i+1);
  const a=(rows.length-1)*sides;
  index.push(a,a+i+1,a+i);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
 g.setIndex(index);g.computeVertexNormals();
 g.name='classic-'+model+'-shell';
 return g;
}

function classicTonneau(model:CarModel):THREE.BufferGeometry{
 if(model==='riviera-62')return createRearTonneau();
 const spec=CLASSIC_SHAPES[model];
 const xs=[-.88,-.70,-.45,-.19,0,.19,.45,.70,.88],zs=[-1.45,-1.26,-1.07];
 const pos:number[]=[],index:number[]=[];
 for(let row=0;row<zs.length;row++)for(const x of xs){
  const outline=Math.pow(Math.abs(x)/.88,model==='wedge-spider-76'?7:1.5);
  const ridge=model==='wedge-spider-76'?.042*outline:.066*outline;
  const y=spec.rearHeight +ridge+row*(model==='wedge-spider-76'?.021:.035);
  pos.push(x,y,zs[row]);
 }
 for(let r=0;r<zs.length-1;r++)for(let i=0;i<xs.length-1;i++){
  const a=r*xs.length+i,b=a+xs.length;
  index.push(a,b,a+1,a+1,b,b+1);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(index);
 g.computeVertexNormals();return g;
}

/** Opaque rear closure on the Grand Tourer 67 and Wedge Spider 76.
 * Their overlapping old tonneau skins and raised deck ribs intersected
 * with the car shell, exposing "guts" from the chase camera. Riviera 62
 * is the owner's APPROVED third screenshot: retain its original tonneau.
 */
function classicRearFascia():THREE.BufferGeometry{
 const xs=[-.90,-.66,-.33,0,.33,.66,.90];
 const ys=[.36,.52,.70,.88];
 const positions:number[]=[],indices:number[]=[];
 for(const y of ys)for(const x of xs){
  const round=Math.pow(Math.abs(x)/.9,2);
  positions.push(x,y-.012*round,-2.414+.062*round);
 }
 const columns=xs.length;
 for(let row=0;row<ys.length-1;row++)for(let col=0;col<xs.length-1;col++){
  const a=row*columns+col,b=a+1,c=a+columns,d=c+1;
  // Camera looks from -Z. The outward face must point -Z, not into
  // the car: otherwise FrontSide material culls the whole rear panel.
  indices.push(a,c,b,b,c,d);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 geometry.name='closed-classic-rear-fascia';
 return geometry;
}

/** The accepted Riviera retains its original deck. Both problem cars
 * use a sealed rear fascia; their shell already provides the roof/deck top.
 * Do not overlay another near-coplanar tonneau on either of those shells.
 */
export function createClassicBody(model:CarModel):THREE.BufferGeometry{
 const pieces=model==='riviera-62'
  ?[classicShell(model),classicTonneau(model)]
  :[classicShell(model),classicRearFascia()];
 const merged=mergeGeometries(pieces);
 pieces.forEach(g=>g.dispose());
 if(!merged)throw Error('Failed to bake classic GT body');
 merged.name='hero-'+model+'-body';
 merged.computeBoundingBox();merged.computeBoundingSphere();
 return merged;
}

function circle(x:number,y:number,z:number,r:number,flatten=1):THREE.BufferGeometry{
 const g=new THREE.CircleGeometry(r,16);
 g.scale(1,flatten,1);g.translate(x,y,z);
 return g;
}
function rectangle(x:number,y:number,z:number,w:number,h:number):THREE.BufferGeometry{
 const g=new THREE.PlaneGeometry(w,h);g.translate(x,y,z);
 return g;
}

/** Three era-correct light signatures share the SAME brake-light material.
 * Rear faces are double-sided so they work from both chase and inspection.
 */
export function createClassicTailLamps(model:CarModel):THREE.BufferGeometry{
 const parts:THREE.BufferGeometry[]=[];
 if(model==='riviera-62'){
  // Paired circular jewel lamps on each side, unmistakably early 1960s.
  for(const side of [-1,1])for(const x of [.47,.69])
   parts.push(circle(side*x,.745,-2.421,.063,1));
 }else if(model==='grand-tourer-67'){
  // Tall narrow vertical lamps taper along the boat-tailed corners.
  for(const side of [-1,1]){
   parts.push(circle(side*.735,.735,-2.423,.087,1.45));
   parts.push(rectangle(side*.735,.737,-2.424,.112,.126));
  }
 }else{
  // Ultra-thin late-1970s wedge lamps, no giant neon strip.
  for(const side of [-1,1]){
   parts.push(rectangle(side*.55,.731,-2.425,.43,.041));
   parts.push(rectangle(side*.81,.701,-2.425,.050,.089));
  }
 }
 const combined=mergeGeometries(parts);
 parts.forEach(g=>g.dispose());
 if(!combined)throw Error('Failed to bake classic tail lamps');
 combined.name='hero-'+model+'-rear-lights';
 combined.computeBoundingSphere();
 return combined;
}

export function classicBodyIdentity(model:CarModel):{profile:readonly (readonly number[])[];tailKind:string}{
 return {profile:CLASSIC_SHAPES[model].profile,
 tailKind:model==='riviera-62'?'round':model==='grand-tourer-67'?'vertical':'horizontal'};
}
