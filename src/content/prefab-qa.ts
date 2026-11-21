import * as THREE from 'three';
import type {StageStaticContent} from './stage-data';
import type {PlacedStaticProp} from './static-props';

/** Opt-in, dev-only visual QA. Project the *loaded GLB* into screen space;
 * never guess which house in a screenshot was authored. */
export function mountPrefabQa(scene:THREE.Scene,stage:StageStaticContent,placed:readonly PlacedStaticProp[]){
 const panel=document.createElement('aside');
 panel.id='prefab-qa';
 panel.setAttribute('role','status');
 panel.style.cssText='position:fixed;z-index:180;top:58px;right:14px;max-width:min(340px,70vw);padding:10px 13px;border:2px solid #ffcf67;border-radius:8px;background:#111d25e8;color:#ffedc1;font:700 13px/1.6 system-ui,sans-serif;text-shadow:0 1px 2px #000;pointer-events:none';
 const badge=document.createElement('div');
 badge.style.cssText='font-size:14px;color:#ffe18b;letter-spacing:.04em';
 badge.textContent='PREFAB QA · 開發模式';
 const detail=document.createElement('div');
 detail.dataset.qa='status';
 panel.append(badge,detail);
 document.body.append(panel);
 const items=stage.staticProps.map(item=>{
  const record=placed.find(p=>p.id===item.id);
  const root=scene.getObjectByName('authored-prop:'+item.id);
  const box=root?new THREE.Box3().setFromObject(root):null;
  const helper=root?new THREE.BoxHelper(root,0xffcf32):null;
  if(helper){
   helper.name='prefab-qa-outline:'+item.id;
   helper.renderOrder=1000;
   const material=helper.material as THREE.LineBasicMaterial;
   material.depthTest=false;
   material.transparent=true;
   material.opacity=.95;
   scene.add(helper);
  }
  const marker=document.createElement('div');
  marker.dataset.prefabId=item.id;
  marker.className='prefab-qa-marker';
  marker.style.cssText='position:fixed;z-index:180;pointer-events:none;white-space:nowrap;padding:5px 9px;background:#201c13f0;color:#ffde73;border:2px solid #ffd15b;border-radius:5px;box-shadow:0 2px 10px #0009;font:900 14px/1.2 system-ui,sans-serif;transform:translate(-50%,-100%);text-shadow:0 1px 2px #000';
  marker.textContent='▼ GLB · '+item.roadDistance.toFixed(0)+'m · '+item.prefab;
  marker.hidden=true;
  document.body.append(marker);
  return {item,record,box,helper,marker};
 });
 let shownMetres=-Infinity;
 function update(camera:THREE.Camera,playerDistance:number){
  const position=new THREE.Vector3();
  camera.updateMatrixWorld();
  for(const entry of items){
   const {box,marker}=entry;
   if(!box){marker.hidden=true;continue;}
   box.getCenter(position);
   position.y=box.max.y+3;
   position.project(camera);
   const visible=position.z>=-1&&position.z<1&&Math.abs(position.x)<.96&&Math.abs(position.y)<.9;
   marker.hidden=!visible;
   if(visible){
    marker.style.left=((position.x+1)*.5*innerWidth).toFixed(1)+'px';
    marker.style.top=((1-position.y)*.5*innerHeight).toFixed(1)+'px';
   }
  }
  const metres=Math.floor(playerDistance/5)*5;
  if(metres===shownMetres)return;
  shownMetres=metres;
  const target=items[0];
  if(!target){
   detail.textContent='本關沒有靜態 Prefab';return;
  }
  const gap=Math.round(target.item.roadDistance-playerDistance);
  detail.textContent=(target.record?'✅ GLB 已載入':'⚠ GLB 未載入')+
   ' · '+target.item.id+
   ' | 玩家 '+Math.round(playerDistance)+'m / 目標 '+target.item.roadDistance+'m'+
   ' | '+(gap>=0?'前方 '+gap+'m':'已通過 '+(-gap)+'m')+
   (target.record?' | 模型 '+target.record.model:'');
 }
 function dispose(){
  panel.remove();
  for(const {helper,marker} of items){
   marker.remove();
   if(helper){
    helper.removeFromParent();
    helper.geometry.dispose();
    (helper.material as THREE.Material).dispose();
   }
  }
 }
 return {update,dispose};
}
