import * as T from 'three';
type Ledge={start:number; length:number; toe:number; diagonal:number; width:number; relief:number};
type Ground=(station:number,lateral:number,lift:number)=>T.Vector3;
const rock=new T.MeshStandardMaterial({vertexColors:true,roughness:1,emissive:0x715548,emissiveIntensity:.12,side:T.DoubleSide});
rock.name='Cape sediment and olive turf';

/** Bedding follows each real cross-section of the host slope. All dimensions
 * and stations come from the placement recipe, so moving a ledge refits its toe. */
export function kentingReef(site:Ledge,ground:Ground){
 const xyz:number[]=[],rgb:number[]=[],idx:number[]=[];
 const levels=[0,.21,.28,.49,.53,.75,.81,1];
 const strata=[0x726467,0x887164,0xb78865,0x847066,0xa88065,0xb69473,0x968668];
 let last:T.Vector3[]=[];
 for(let i=0;i<=14;i++){
  const t=i/14,e=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.6),d=site.start+t*site.length;
  const toe=site.toe-site.diagonal*t+Math.sin(i*.98+site.diagonal)*.42;
  const width=site.width*(.09+.91*e);
  const row=levels.map((level,j)=>{
   const l=level+.035*Math.sin(t*11+j*.57)*Math.sin(level*Math.PI);
   const bedding=(j%3===1?.10:-.03)*e;
   // Let the lowest bedding disappear into the parent slope at irregular depths.
   const buriedToe=(1-l)*(1-l)*(.23+.19*Math.sin(t*9+site.width));
   return ground(d+.27*Math.sin(l*6+i*.28),toe-width*(l*.77+bedding*.11),
    -.42-buriedToe+site.relief*e*l+bedding+e*.18*Math.sin(i*1.89+l));
  });
  row.push(ground(d+.3,toe-width*.94,.27*e-.19),ground(d,toe-width-1.9,-.32));
  if(last.length)for(let j=0;j<row.length-1;j++){
   const color=new T.Color(strata[j]??(j===7?0x827d58:0x626e48)).multiplyScalar(.93+.09*Math.sin(i*.83+j*.58));
   if(j===3||j===5)color.lerp(new T.Color(strata[j-1]),.5+.45*Math.sin(i*.9+site.width));
   const n=xyz.length/3;
   for(const v of [last[j],row[j],row[j+1],last[j+1]]){xyz.push(v.x,v.y,v.z);rgb.push(color.r,color.g,color.b);}
   idx.push(n,n+1,n+2,n,n+2,n+3);
  }
  last=row;
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
 g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));g.setIndex(idx);g.computeVertexNormals();
 const mesh=new T.Mesh(g,rock);mesh.name='fitted-sedimentary-ledge';return mesh;
}
