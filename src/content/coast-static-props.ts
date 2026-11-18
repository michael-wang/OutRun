import {beachPlan} from '../beach-macro';
import {beachKitPose} from '../beach-zone-layout';
import * as THREE from 'three';
import {beachMacro,beachVista,beachFlow,macroScenicDistance,macroLighthouseX,macroLighthouseStation,macroLighthouseScale} from '../beach-macro';
import {KENTING_ANCHOR} from '../beach-blockout-config';
import {coastBeachHeight} from '../scenery-cross-section';
import {coastStaticStage,staticPrefabCatalog} from './stage-data';
import {mountStageStaticProps,type RoadSampler} from './static-props';

/** Coast-specific terrain adapter; the generic GLB placer knows no coastline. */
export function mountCoastStaticProps(scene:THREE.Scene,sample:RoadSampler,signal?:AbortSignal,includeLocalBeach=false,anchor=KENTING_ANCHOR){
 const stage={...coastStaticStage,staticProps:coastStaticStage.staticProps.filter(p=>(includeLocalBeach||!p.id.startsWith('kenting-beach-'))&&!(beachMacro()==='b'&&/^kenting-beach-parasol-(8|9|10|11)$/.test(p.id))).map(p=>p.id.startsWith('kenting-beach-')?{...p,roadDistance:p.id==='kenting-beach-lighthouse'&&beachVista()?macroLighthouseStation():macroScenicDistance(p.roadDistance+anchor-KENTING_ANCHOR,anchor),lateral:p.id==='kenting-beach-lighthouse'?macroLighthouseX():p.lateral,scale:p.id==='kenting-beach-lighthouse'?p.scale*macroLighthouseScale():p.scale}:p)};
 // Keep the last relaxation cluster on the low sand before the new coastal
 // climb; a rigid chair kit cannot conform to the steep cross-slope at 6140m.
 if(beachFlow()&&!beachPlan())for(const p of stage.staticProps)if(/^kenting-beach-parasol-(8|9|10|11)$/.test(p.id))p.roadDistance=5780+(Number(p.id.split('-').at(-1))>=10?25:0);
 if(beachPlan())for(const p of stage.staticProps){const pose=beachKitPose(p.id,anchor);if(pose){p.roadDistance=pose.station;p.lateral=pose.lateral;}}
 return mountStageStaticProps(scene,sample,stage,staticPrefabCatalog,
  (item,road)=>coastBeachHeight(item.lateral,road.position.y,road.right.y,item.roadDistance),signal).then(placed=>{
   if(beachVista())scene.getObjectByName('authored-prop:kenting-beach-lighthouse')?.traverse(o=>{
    if(!(o instanceof THREE.Mesh))return;
    // Landmark-specific aerial perspective, like the existing distant hills.
    // Retain fog, real lighting and geometry; don't change whole-scene atmosphere.
    const adapt=(m:THREE.Material)=>{const c=m.clone();c.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`\n#ifdef USE_FOG\n float landmarkFog=smoothstep(fogNear,fogFar*2.1,vFogDepth);\n gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,landmarkFog);\n#endif\n`);};c.customProgramCacheKey=()=> 'beach-vista-landmark-fog-v1';return c;};
    o.material=Array.isArray(o.material)?o.material.map(adapt):adapt(o.material);
   });
   return placed;
  });
}
