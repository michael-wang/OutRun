import * as THREE from 'three';
import {fbm2,ridged2,smoothstep} from './vendor/procedural-terrains/cpuNoise.js';
import {COAST_SUN} from './coast-dusk';
import type {createTrack} from './track';

/** Full cross-slope terrain, not a four-row silhouette curtain. Shape, normals,
 * sunlight, valley shading and atmospheric colour are baked once into two
 * meshes. The mobile main camera keeps its original far plane. */
export function addCoastMountains(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],length:number){
 const origin=sample(0).position.clone(),axis=sample(length).position.clone().sub(origin).setY(0).normalize(),right=new THREE.Vector3(axis.z,0,-axis.x);
 if(right.dot(sample(length*.5).right)<0)right.negate();
 for(let layer=0;layer<2;layer++){
  const position:number[]=[],colors:number[]=[],indices:number[]=[],relief:number[]=[],step=90,count=Math.ceil((length+7000)/step),rows=17;
  for(let i=0;i<=count;i++){
   const d=-3500+i*step,ridge=ridged2(layer*4+9,d/1350,4,.5,2,1.6,.3,.2);
   const peak=(layer?330:140)+(layer?340:220)*ridge;
   for(let row=0;row<rows;row++){
    const u=row/(rows-1),x=(layer?1300:430)+u*(layer?2100:1700);
    // A wandering watershed, with side ridges descending toward the foothills.
    const spine=.44+.075*Math.sin(d/670+layer)+.045*Math.sin(d/310-layer);
    const envelope=Math.exp(-(((u-spine)/.245)**2))*smoothstep(0,.12,u)*(1-smoothstep(.86,1,u));
    const ribs=ridged2(x/290+layer*11,d/430,3,.5,2,1.8,.35,.28);
    const detail=fbm2(x/175+4,d/240,3,.5,2);
    const height=-22+envelope*(peak*(.64+.36*ribs)+detail*35);
    const p=origin.clone().addScaledVector(axis,d).addScaledVector(right,x);position.push(p.x,height,p.z);
    relief.push(ribs,detail,height/peak);
   }
   if(i<count)for(let row=0;row<rows-1;row++){const a=i*rows+row;indices.push(a,a+1,a+rows,a+1,a+rows+1,a+rows);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(position,3));g.setIndex(indices);g.computeVertexNormals();
  const normal=new THREE.Vector3(),sunlit=new THREE.Color('#c5ac78'),haze=new THREE.Color('#a18b87');
  for(let i=0;i<position.length/3;i++){
   normal.fromBufferAttribute(g.attributes.normal,i);if(normal.y<0)normal.negate();
   const ribs=relief[i*3],detail=relief[i*3+1],altitude=relief[i*3+2];
   const rock=smoothstep(.18,.55,1-normal.y)*smoothstep(.3,.75,altitude);
   const color=new THREE.Color('#52603b').lerp(new THREE.Color('#817257'),rock*.65);
   const light=Math.max(0,normal.dot(COAST_SUN));
   color.multiplyScalar(.58+.30*normal.y+.44*light);
   color.lerp(sunlit,light*.13).multiplyScalar(.85+.19*ribs+.12*detail);
   // Keep foothill greens at the front; only the rear chain loses contrast.
   color.lerp(haze,layer?.33:.13);colors.push(color.r,color.g,color.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const m=new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide});
  m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\ngl_Position.z=gl_Position.w*(1.0-0.00008/(1.0+max(0.0,-mvPosition.z)/2000.0));');};
  m.customProgramCacheKey=()=> 'coast-mountain-backdrop-v1';
  const mesh=new THREE.Mesh(g,m);mesh.name='coast-mountains-'+layer;mesh.frustumCulled=false;scene.add(mesh);
 }
}
