import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import runtimeArt from './runtime-art.json';
import {natureGeometry,roadsideTrees} from './tree-models';

// Root positions and heights measured from the seven cottonwoods in the pinned R4 GLB.
const dryTreeSites=[
 [-441.485,294.308,2442.046,6.50],[-498.042,299.385,1870.217,6.48],
 [-551.449,285.607,1421.191,6.90],[-515.337,278.999,1182.921,5.55],
 [-371.446,274.246,901.572,6.76],[-332.955,262.990,676.147,5.05],
 [-410.040,262.622,15.518,5.11],
] as const;

// The v2 .blend's existing sRGB palette. Its linked weathering nodes exported
// without baseColorFactor; restore only those colors, not geometry or shaders.
const palette:Record<string,string>={
 'V2 | dusty gravel shoulder':'#AB8C67','V2 | deep rust bedding':'#89452F',
 'V2 | pale limestone ledge':'#D9A370','V2 | terracotta wall':'#B96543',
 'V2 | broken sandstone talus':'#A96B46','V2 | warm mesa cap':'#D4A174',
 'V2 | sunlit ochre sandstone':'#BB7449','V2 | distant mauve sandstone':'#9C7978',
};

export async function loadBlenderCanyon(roadLock=false,data?:ArrayBuffer){
 const started=performance.now();
 const asset=roadLock?'canyon_cliff_pass_r4.glb':'canyon_art_only.glb';
 const loader=new GLTFLoader();
 if(roadLock)loader.register(parser=>({
  name:'OutRunCanyonTrees',
  createNodeMesh(index){
   const node=parser.json.nodes[index];
   if(node.name!=='Sparse dead cottonwood silhouettes')return null;
   const primitive=parser.json.meshes[node.mesh].primitives[0];
   return parser.getDependency('material',primitive.material).then(material=>{
    const branches=natureGeometry(roadsideTrees.RoadOak.parts[0]);
    branches.computeBoundingBox();
    const trees=new THREE.InstancedMesh(branches,material,dryTreeSites.length),pose=new THREE.Object3D();
    dryTreeSites.forEach(([x,y,z,h],i)=>{
     pose.position.set(x,y,z);pose.rotation.y=i*2.4;
     pose.scale.setScalar(h/branches.boundingBox!.max.y);pose.updateMatrix();
     trees.setMatrixAt(i,pose.matrix);
    });
    return trees;
   });
  },
 }));
 const url=roadLock?import.meta.env.BASE_URL+runtimeArt.canyon.path.slice(1):'/__local_art/'+asset;
 const gltf=data?await loader.parseAsync(data,''):await loader.loadAsync(url);
 const root=gltf.scene;root.name=roadLock?'blender-canyon-cliff-pass-r4':'blender-canyon-v2';
 // glTF is already meters/Y-up in the production track's world coordinates.
 // Do not recenter, rotate or normalize the model.
 root.updateMatrixWorld(true);
 let meshes=0,triangles=0;
 let flow:THREE.CanvasTexture|undefined;
 root.traverse(object=>{if(object instanceof THREE.Mesh){
  if(/REFERENCE/i.test(object.name))throw Error('GLB contains reference road geometry');
  meshes++;triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3*(object instanceof THREE.InstancedMesh?object.count:1);
  for(const material of Array.isArray(object.material)?object.material:[object.material]){
   if(material instanceof THREE.MeshStandardMaterial&&palette[material.name])material.color.set(palette[material.name]);
   if(material instanceof THREE.MeshStandardMaterial&&material.name==='R3 flowing river'){
    // The river mesh/UVs are authored in Blender. Only this repeating surface
    // texture moves downstream; no terrain or river geometry is generated here.
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle='#426d68';ctx.fillRect(0,0,128,256);
    let seed=31;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<150;i++){
     const x=random()*128,y=random()*256,length=8+random()*35;
     ctx.strokeStyle=`rgba(190,212,190,${.08+random()*.26})`;ctx.lineWidth=.5+random()*1.5;
     for(const wrap of [-256,0,256]){ctx.beginPath();ctx.moveTo(x,y+wrap);ctx.quadraticCurveTo(x+3,y+length*.5+wrap,x+1,y+length+wrap);ctx.stroke();}
    }
    flow=new THREE.CanvasTexture(canvas);flow.colorSpace=THREE.SRGBColorSpace;flow.wrapS=flow.wrapT=THREE.RepeatWrapping;
    material.map=flow;material.color.set('#ffffff');material.roughness=.36;material.metalness=.12;material.needsUpdate=true;
   }
  }
  object.receiveShadow=true;object.castShadow=false;
 }});
 if(!meshes)throw Error('GLB contains no artwork');
 const box=new THREE.Box3().setFromObject(root);
 if(!roadLock&&(box.min.y>57||box.max.y<300))throw Error('Unexpected canyon world bounds; check the GLB coordinate export');
 return {root,update:(elapsed:number)=>{if(flow)flow.offset.y=elapsed*.06;},stats:{status:'ready',asset,loadMs:performance.now()-started,meshes,triangles,flowingRiver:!!flow,
  position:root.position.toArray(),scale:root.scale.toArray(),quaternion:root.quaternion.toArray(),
  bounds:{min:box.min.toArray(),max:box.max.toArray()}}};
}
