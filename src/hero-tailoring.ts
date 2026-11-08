import * as THREE from 'three';

// Sections are measured in the unscaled occupant or seat frame, +Z forward.
type Section = readonly [height:number, halfWidth:number, halfDepth:number, centerZ:number];
export const passengerYoke:readonly Section[]=[
 [1.047,.158,.125,-.49],[1.118,.179,.139,-.49],[1.175,.205,.148,-.49],
 [1.227,.182,.123,-.486],[1.247,.147,.103,-.48],[1.266,.099,.078,-.469],
 [1.285,.068,.066,-.457],[1.367,.062,.064,-.447],
];

export function sectionMesh(rows:readonly Section[],sides=20){
 const positions:number[]=[],indices:number[]=[];
 rows.forEach(([y,w,d,z],row)=>{
  for(let i=0;i<sides;i++){
   const a=i*2*Math.PI/sides;
   positions.push(w*Math.sin(a),y,z+d*Math.cos(a));
   const here=row*sides+i,next=row*sides+(i+1)%sides;
   if(row)indices.push(here-sides,next-sides,here,next-sides,next,here);
  }
 });
 // Cap both ends; most ends tuck inside an adjoining surface.
 const top=(rows.length-1)*sides;
 for(let i=1;i<sides-1;i++)indices.push(0,i+1,i,top,top+i,top+i+1);
 return surface(positions,indices);
}

function surface(p:number[],index:number[]){
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 g.setIndex(index);g.computeVertexNormals();return g;
}

export const jacketSections:readonly Section[]=[
 [.765,.195,.151,-.49],[1.04,.216,.17,-.49],[1.16,.239,.165,-.49],
 [1.197,.253,.145,-.484],[1.223,.223,.136,-.478],
 [1.248,.145,.104,-.466],[1.263,.085,.082,-.453],
];

/** Folded shirt collar: low across the nape, open at the throat, with two pointed leaves. */
export function shirtCollar(){
 const p:number[]=[],index:number[]=[];
 for(const side of [-1,1]){
  const start=p.length/3;
  for(let i=0;i<=12;i++){
   const t=i/12,a=Math.PI*(1-.84*t),s=Math.sin(a),c=Math.cos(a);
   const point=Math.max(0,1-Math.abs(t-.83)/.17);
   p.push(side*.077*s,1.286+.014*t,-.452+.077*c,
          side*(.115+.034*point)*s,1.267-.021*t-.063*point,-.46+(.100+.102*t)*c);
   if(i){const n=start+2*i;index.push(n-2,n-1,n,n-1,n+1,n);}
  }
 }
 // Trace the shirt opening over the chest so it remains above the jacket.
 const start=p.length/3;
 for(let i=2;i<jacketSections.length;i++){
  const [y,w,d,z]=jacketSections[i],x=(y-1.16)*.54+.002;
  p.push(-x,y,z+d*Math.sqrt(1-(x/w)**2)+.003, x,y,z+d*Math.sqrt(1-(x/w)**2)+.003);
  if(i>2){const n=start+2*(i-2);index.push(n-2,n-1,n,n-1,n+1,n);}
 }
 return surface(p,index);
}

/** Bodice edge and straps follow the same cross sections as the bare shoulders. */
export function createSundress(){
 const p:number[]=[],index:number[]=[],sides=20;
 const rings=[[.625,.267,.245,.1],[.78,.228,.20,.04],[.908,.161,.134,0],
  [1.055,.177,.151,0],[1.138,.194,.154,0],[1.189,.202,.154,0]];
 rings.forEach(([y,w,d,z],row)=>{
  for(let i=0;i<sides;i++){
   const a=i*2*Math.PI/sides,c=Math.cos(a),fold=row<2?1+.042*Math.cos(7*a):1;
   const lateral=Math.sin(a),armhole=THREE.MathUtils.smoothstep(Math.abs(lateral),.61,.98);
   const top=row===rings.length-1,underarm=row===rings.length-2;
   const scoop=top?.034*c*c+.076*armhole:underarm?.050*armhole:0;
   const width=w-armhole*(top?.018:underarm?.012:0);
   p.push(width*lateral*fold,y-scoop,z+d*c*fold-.49);
   const here=row*sides+i,next=row*sides+(i+1)%sides;
   if(row)index.push(here-sides,next-sides,here,next-sides,next,here);
  }
 });
 for(const side of [-1,1]){
  const start=p.length/3;
  // Cross the rounded ridge at the exact height where the yoke narrows to x.
  for(let step=0;step<=10;step++){
   const row=2+Math.min(step,10-step),front=step<5?1:-1;
   for(const x of [.096,.13]){
    const low=passengerYoke[4],high=passengerYoke[5];
    const crest=THREE.MathUtils.inverseLerp(low[1],high[1],x);
    const [y,w,d,z]=passengerYoke[Math.min(row,4)];
    let height=y,depth=z;
    if(step===5){
     height=THREE.MathUtils.lerp(low[0],high[0],crest)+.004;
     depth=THREE.MathUtils.lerp(low[3],high[3],crest);
    }else{
     const t=row<=4?0:crest*(row-4)/3;
     const width=THREE.MathUtils.lerp(w,high[1],t);
     height=THREE.MathUtils.lerp(y,high[0],t);
     if(step===0||step===10)height-=.020;
     depth=THREE.MathUtils.lerp(z,high[3],t)+front*(.007+THREE.MathUtils.lerp(d,high[2],t)*Math.sqrt(Math.max(0,1-(x/width)**2)));
    }
    p.push(side*x,height,depth);
   }
   if(step){const n=start+2*step;index.push(n-2,n-1,n,n-1,n+1,n);}
  }
 }
 return surface(p,index);
}
