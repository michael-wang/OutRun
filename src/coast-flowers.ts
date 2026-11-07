import * as THREE from 'three';
import {farmWindGLSL} from './coast-farm-wind';
import {farmPlotEdges,FLOWER_ROW_PITCH,type FarmPlot} from './coast-farm-layout';
import {seededRandom} from './vendor/three-stylized/utils';

/** A coarse flowering surface for the space beyond the individual blooms. */
export function flowerCanopyGeometry(plot:FarmPlot,position:(d:number,x:number,lift:number)=>THREE.Vector3,clear:(d:number,x:number)=>boolean){
 const nx=Math.ceil((plot.right-plot.left)/4),nz=Math.ceil((plot.end-plot.start)/4);
 const vertices=[],uv=[],indices=[];
 for(let j=0;j<=nz;j++){
  const d=plot.start+(plot.end-plot.start)*j/nz,{left,right}=farmPlotEdges(plot,d);
  for(let i=0;i<=nx;i++){
   const x=left+(right-left)*i/nx,edge=i===0||i===nx||j===0||j===nz;
   const height=edge?.24:.68+.11*Math.sin(d*.83+x*.64);
   const p=position(d,x,height);vertices.push(p.x,p.y,p.z);uv.push((x-plot.left)/(4*FLOWER_ROW_PITCH),(d-plot.start)/8);
   if(i<nx&&j<nz&&!clear(d+2,x+2)){
    const a=j*(nx+1)+i,b=a+nx+1;indices.push(a,a+1,b,a+1,b+1,b);
   }
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.setIndex(indices);g.computeVertexNormals();return g;
}

/** Four rows per tile, with separate masks for petals, leaves and pollen. */
export function flowerCrownTexture(){
 const size=256,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d')!,rand=seededRandom(53372);
 ctx.fillStyle='#000';ctx.fillRect(0,0,size,size);
 const wrap=(at:number)=>at<12?[0,size]:at>size-12?[0,-size]:[0];
 for(let row=0;row<4;row++)for(let i=0;i<140;i++){
  const x=(row+.24+.72*rand())*size/4,y=rand()*size;
  const r=2+rand()*3,angle=rand()*Math.PI,petal=155+Math.floor(rand()*96);
  for(const dx of wrap(x))for(const dy of wrap(y)){
   const px=x+dx,py=y+dy;
   ctx.fillStyle='#008300';ctx.beginPath();ctx.ellipse(px,py,2.8,9,angle,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='rgb('+petal+',0,0)';
   for(let k=0;k<5;k++){const a=angle+k*Math.PI*.4;ctx.beginPath();ctx.ellipse(px+r*.65*Math.cos(a),py+r*.65*Math.sin(a),r*.65,r*.4,a,0,Math.PI*2);ctx.fill();}
   ctx.fillStyle='#0000ce';ctx.fillRect(px-.9,py-.9,1.8,1.8);
  }
 }
 const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}

/** Dry, matte loam. Four shallow seed furrows and small broken clods per tile. */
export function flowerSoilTexture(){
 const size=128,rand=seededRandom(23811),data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const row=x/(size/4)+.019*Math.sin(y*2*Math.PI/size);
  const ridge=Math.sin(row*2*Math.PI-.7);
  const grain=.76+.10*ridge+.20*rand();
  const i=4*(y*size+x);
  data[i]=Math.round(240*grain);data[i+1]=Math.round(226*grain);data[i+2]=Math.round(210*grain);data[i+3]=255;
 }
 const texture=new THREE.DataTexture(data,size,size);
 texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps=true;texture.anisotropy=4;texture.needsUpdate=true;return texture;
}

type Shader=Parameters<THREE.MeshStandardMaterial['onBeforeCompile']>[0];
export function shadeFlowerBeds(shader:Shader,time:{value:number},wind:THREE.Texture,crowns:THREE.Texture){
 Object.assign(shader.uniforms,{farmTime:time,farmWind:{value:wind},flowerCrowns:{value:crowns}});
 const varyings='varying float vFlowerLayer; varying float vGustLight;\n';
 shader.vertexShader=varyings+'attribute float flowerLayer;\n'+farmWindGLSL+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vFlowerLayer=flowerLayer;vGustLight=0.;
  if(flowerLayer>.5){
   vec2 gust=farmGust((modelMatrix*vec4(position,1.)).xz);
   transformed.xz+=vec2(.17+.32*gust.x,.22*gust.y);
   transformed.y-=.08*abs(gust.x);vGustLight=gust.x;
  }`);
 shader.fragmentShader=varyings+'uniform sampler2D flowerCrowns;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
  if(vFlowerLayer<.5)diffuseColor*=texture2D(map,vMapUv);`)
 .replace('#include <color_fragment>',`#include <color_fragment>
  if(vFlowerLayer>.5){
   vec3 mask=texture2D(flowerCrowns,vMapUv).rgb;
   float coverage=dot(mask,vec3(1.));
   // Open the near canopy for modeled flowers. Keep the distant benches full.
   float lod=vFlowerLayer>1.5?1.:smoothstep(42.,156.,length(vViewPosition));
   if(coverage*lod<.22)discard;
   diffuseColor.rgb=(vColor.rgb*mask.r+vec3(.095,.18,.07)*mask.g+vec3(.80,.53,.15)*mask.b)
     /max(.32,coverage)*(.94+.09*vGustLight);
  }`);
}

/** Reuse the instance transforms and flower palette prepared by the Worker.
 * A folded corolla, central disk and two leaves read from the chase camera. */
export function shapeCoastalFlowers(mesh:THREE.InstancedMesh<THREE.PlaneGeometry,THREE.ShaderMaterial>,wind:THREE.Texture){
 const points:number[]=[],parts:number[]=[],tones:number[]=[],indices:number[]=[];
 function vertex(x:number,y:number,z:number,part:number,tone:number){
  points.push(x,y,z);parts.push(part);tones.push(tone);return parts.length-1;
 }
 const stemBase=vertex(-.022,0,0,0,.65),stemTop=vertex(.09,.88,0,0,1);
 indices.push(stemBase,vertex(.023,0,.012,0,.8),stemTop,stemBase,stemTop,vertex(0,0,-.025,0,.8));
 for(const sign of [-1,1]){
  const y=.26+.07*sign,base=vertex(.025,y,0,0,.70),tip=vertex(sign*.41,y+.29,sign*.12,0,.96);
  indices.push(base,vertex(sign*.27,y+.13,.13,0,.8),tip,base,tip,vertex(sign*.20,y+.18,-.12,0,.95));
 }
 // Tilt the open face so the player sees both the rim and the warm centre.
 const ring=[];
 function bloom(a:number,r:number,lift:number,part:number,tone:number){
  const z=r*Math.sin(a);
  return vertex(.09+r*Math.cos(a),.87+z*.41+lift,z,part,tone);
 }
 const center=vertex(.09,.90,0,2,1);
 for(let k=0;k<7;k++){
  const a=k*2*Math.PI/7,root=bloom(a,.075,0,1,.76);
  const left=bloom(a-.32,.32,.055,1,.91),tip=bloom(a,.43,.078,1,1.12),right=bloom(a+.32,.32,.06,1,1.02);
  indices.push(root,left,tip,root,tip,right);
  ring.push(bloom(a,.095,.014,2,.95));
 }
 for(let k=0;k<ring.length;k++)indices.push(center,ring[k],ring[(k+1)%ring.length]);
 const g=mesh.geometry;
 g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.deleteAttribute('uv');g.deleteAttribute('normal');
 g.setAttribute('flowerPart',new THREE.Float32BufferAttribute(parts,1));g.setAttribute('tone',new THREE.Float32BufferAttribute(tones,1));g.setIndex(indices);
 g.computeBoundingBox();g.computeBoundingSphere();
 const m=mesh.material;
 m.uniforms.farmWind={value:wind};m.uniforms.farmTime=m.uniforms.uTime;
 m.vertexShader=farmWindGLSL+`
  attribute float flowerPart,tone,aVariant;
  attribute vec3 aPetalColor,aFoliageColor,aCentreColor;
  varying vec3 vBloom;
  void main() {
   mat4 basis=modelMatrix*instanceMatrix;
   vec3 transformed=position;
   if(flowerPart>.5){
    transformed.xz=vec2(.09,0.)+(position.xz-vec2(.09,0.))*(.89+.12*aVariant);
    transformed.y+=position.z*(aVariant-1.)*.20;
   }
   transformed.z*=length(basis[0].xyz)/max(.001,length(basis[2].xyz));
   vec4 worldPosition=basis*vec4(transformed,1.);
   vec2 gust=farmGust(basis[3].xz);
   float tip=position.y*position.y*length(basis[1].xyz);
   worldPosition.xz+=vec2(.12+.44*gust.x,.29*gust.y)*tip;
   worldPosition.y-=.12*abs(gust.x)*tip;
   vBloom=(flowerPart<.5?aFoliageColor:flowerPart<1.5?aPetalColor:aCentreColor)
    *tone*(.96+.055*aVariant+.075*gust.x);
   gl_Position = projectionMatrix*viewMatrix*worldPosition;
  }`;
 m.fragmentShader=`varying vec3 vBloom;
  void main() {
   gl_FragColor=vec4(vBloom,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`;
}
