// Asset QA only; does not add a route, camera mode or UI to the game.
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const root='docs/evidence/coast-r86/models';await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1000,height:650}});await page.goto('http://127.0.0.1:5180/');await page.waitForFunction(()=>window.__drive?.streaming()?.ready);
 for(const name of ['rice-original','rice-near','rice-mid']){
  await page.evaluate(async name=>{
   window.__drive.manual(true);
   const T=await import('/node_modules/three/build/three.module.js'),{GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
   document.getElementById('model-qa')?.remove();const r=new T.WebGLRenderer({antialias:true});r.setSize(1000,650);r.domElement.id='model-qa';r.domElement.style='position:fixed;inset:0;z-index:99999';document.body.append(r.domElement);
   const s=new T.Scene();s.background=new T.Color('#434956');const asset=await new GLTFLoader().loadAsync(`/assets/coast-farm/${name}.glb`);s.add(asset.scene);
   s.add(new T.HemisphereLight('#ffffff','#63583b',2));const sun=new T.DirectionalLight('#fff3d4',2);sun.position.set(-3,5,4);s.add(sun);
   const box=new T.Box3().setFromObject(asset.scene),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()).length();const c=new T.PerspectiveCamera(40,1000/650,.01,100);c.position.copy(center).add(new T.Vector3(1,.55,1.7).normalize().multiplyScalar(size*1.6));c.lookAt(center);r.render(s,c);
   window.modelQA={r,s};
  },name);
  await page.screenshot({path:`${root}/${name}.png`});
  await page.evaluate(()=>{window.modelQA.s.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});window.modelQA.r.dispose();});
 }
}finally{await browser.close();}
