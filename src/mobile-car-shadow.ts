import * as THREE from 'three';
import {COAST_SUN} from './coast-dusk';
import {coastShadowLength,makeCoastShadowMaterial} from './coast-sun-shadow';

type RoadSample=(d:number)=>{position:THREE.Vector3;right:THREE.Vector3;tangent:THREE.Vector3};

/** A small receiving strip follows the road cross-slope. UVs project the soft
 * silhouette in world space, so clipping the strip at the asphalt edge never stretches it. */
export class MobileCarShadow {
 private readonly geometry=new THREE.PlaneGeometry(1,1,1,4);
 private readonly material=makeCoastShadowMaterial(.53);
 readonly mesh=new THREE.Mesh(this.geometry,this.material);
 private lastDistance=NaN;
 private lastLateral=NaN;
 constructor(scene:THREE.Scene){
  this.material.forceSinglePass=true;
  this.mesh.name='mobile-car-sunset-shadow';this.mesh.renderOrder=2;
  this.mesh.frustumCulled=false;scene.add(this.mesh);
 }
 update(sample:RoadSample,halfAt:(d:number)=>number,length:number,d:number,x:number){
  if(!this.mesh.visible||d===this.lastDistance&&x===this.lastLateral)return;
  this.lastDistance=d;this.lastLateral=x;
  const span=coastShadowLength(1.35),width=3.6;
  const horizontal=Math.hypot(COAST_SUN.x,COAST_SUN.z);
  const ax=-COAST_SUN.x/horizontal,az=-COAST_SUN.z/horizontal;
  const road=sample(d),cx=road.position.x+road.right.x*x+ax*span*.30,
   cz=road.position.z+road.right.z*x+az*span*.30;
  const along=(cx-road.position.x)*road.tangent.x+(cz-road.position.z)*road.tangent.z;
  const across=(cx-road.position.x)*road.right.x+(cz-road.position.z)*road.right.z;
  const extent=Math.hypot(span,width)*.5+.1;
  const pos=this.geometry.attributes.position,uv=this.geometry.attributes.uv;
  for(let row=0;row<5;row++){
   const nd=THREE.MathUtils.clamp(d+along+extent*(row/2-1),0,length);
   const p=sample(nd),half=halfAt(nd);
   for(let side=0;side<2;side++){
    const lateral=THREE.MathUtils.clamp(across+(side?extent:-extent),-half,half);
    const px=p.position.x+p.right.x*lateral,pz=p.position.z+p.right.z*lateral;
    const i=row*2+side;
    pos.setXYZ(i,px,p.position.y+p.right.y*lateral+.021,pz);
    uv.setXY(i,.5+((px-cx)*az-(pz-cz)*ax)/width,.5+((px-cx)*ax+(pz-cz)*az)/span);
   }
  }
  pos.needsUpdate=uv.needsUpdate=true;
 }
 dispose(){this.mesh.removeFromParent();this.geometry.dispose();this.material.map?.dispose();this.material.dispose();}
}
