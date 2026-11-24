import {kentingReference} from './kenting-installation';
import {fbm2,ridged2,smoothstep} from './vendor/procedural-terrains/cpuNoise.js';
import {beach2,kentingGroundBlend} from './beach2-profile';
import {macroMountainBlend} from './beach-macro';
import {COAST_DISTRICTS} from './coast-layout';
import {FARM_ZONES,farmPlainMask,farmTerraceHeight} from './coast-farm-layout';
import {meadowRelief} from './coast-meadow-layout';

export const COAST_HILL_STRIPS=[13,18,23,29,36,48,51,53,55,58,70,88,94,97,99,101,104,125,140,146,149,151,153,156,180,198,201,203,205,208,220,250,252,270,340,450] as const;

/** Cut the dry flower beds into the verge; retain a slight drainage slope.
 * The flooded rice benches instead cancel the crossfall across each paddy. */
export function farmBasinCut(x:number,d:number,roadBank:number){
 const blend=kentingGroundBlend(d);
 if(!blend)return farmCutAt(x,d,roadBank);
 const fitted=farmCutAt(x,kentingReference(d),roadBank);
 if(blend===1)return fitted;
 const ordinary=farmCutAt(x,d,roadBank);
 return ordinary+(fitted-ordinary)*blend;
}

function farmCutAt(x:number,d:number,roadBank:number){
 if(x<=15)return 0;
 for(const zone of FARM_ZONES){
  // Outer terrain rows are sampled every 20 m. Finish the transition one
  // row before planting so edge triangles are level under the entire field.
  if(d>zone.flowerApproach-43&&d<zone.flowers[1]+43){
   const coarse=smoothstep(zone.flowerApproach-43,zone.flowerApproach-21,d)*(1-smoothstep(zone.flowers[1]+21,zone.flowers[1]+43,d));
   const fine=smoothstep(zone.flowerApproach-12,zone.flowerApproach-5,d)*(1-smoothstep(zone.flowers[1]+5,zone.flowers[1]+12,d));
   const along=fine+(coarse-fine)*smoothstep(100,130,x);
   const terraceMask=smoothstep(15,19,x)*(1-smoothstep(zone.flowerRight+12,zone.flowerRight+100,x));
   const basin=Math.max(0,1-farmTerraceHeight(x)/1.5);
   // Level all planted terraces against road banking, including the higher inland rows.
   if(along>0)return along*terraceMask*(13*roadBank+basin*(1.50+.004*(x-13)));
  }
  const [a,b]=zone.rice;
  if(d<=a-22||d>=b+22||x>=zone.right+52)continue;
  const along=smoothstep(a-22,a-5,d)*(1-smoothstep(b+5,b+22,d));
  const across=smoothstep(15,18,x)*(1-smoothstep(zone.right+4,zone.right+52,x));
  return along*across*(1.13+13*roadBank+.008*(x-13)-.45*farmTerraceHeight(x));
 }
 return 0;
}

/** District forecourts stay flat; hills ease in beyond their ends and behind them. */
export function coastWildness(d:number){
 let gap=Infinity;
 for(const zone of COAST_DISTRICTS)gap=Math.min(gap,Math.max(zone.start-d,0,d-zone.end));
 return smoothstep(0,115,gap);
}

/** ProceduralTerrains' rotated-domain FBM and erosion-aware ridges, evaluated
 * during worker preparation only. Absolute route coordinates join all chunks.
 * The road and beach are deliberately outside this inland height field. */
export function beachApproachWeight(d:number){
 const ref=kentingReference(d);
 return beach2()?smoothstep(4050,4320,ref)*(1-smoothstep(4760,4990,ref)):0;
}

// Retain the accepted ridge and terrace profiles inside the installed scene.
// Its two skirts mix heights instead of warping noise through many metres at once.
export function coastHillHeight(x:number,station:number){
 const extension=macroMountainBlend(station),approach=beachApproachWeight(station);
 const blend=kentingGroundBlend(station);
 if(!blend)return hillAt(x,station,extension,approach);
 const fitted=hillAt(x,kentingReference(station),extension,approach);
 if(blend===1)return fitted;
 const ordinary=hillAt(x,station,extension,approach);
 return ordinary+(fitted-ordinary)*blend;
}
function hillAt(x:number,d:number,extension:number,approach:number){
 const farm=farmPlainMask(x,d)*(1-extension),bench=farmTerraceHeight(x);
 const grassland=meadowRelief(x,d);
 if(x<=88-75*extension)return farm*bench+grassland;
 if(farm===1)return bench+grassland;
 const wild=Math.max(coastWildness(d),extension);
 // Slide the foothills inland through inhabited districts, tapering the
 // displacement at each town entrance so the plain joins the countryside.
 // Vary the crest and toe along the route; keep the two inland ridges behind it.
 const fold=approach*(15*Math.sin((d-4200)/91)+9*Math.sin((d-4360)/47));
 const hillX=x+fold-105*(1-wild)+135*extension,behindTown=smoothstep(140,220,hillX);
 const envelope=Math.max(wild,behindTown);
 const broad=fbm2(x/115+8.04,d/180+17.3,4,.48,2.03,.6,.35);
 const ridge=ridged2(x/170+31.7,d/260+4.2,3,.5,2.1,1.7,.3,.25);
 const crest=200+32*fbm2(8.04,d/230,3,.5,2);
 const near=Math.exp(-(((hillX-crest)/(65+20*broad))**2))*(12+28*ridge);
 const back=Math.exp(-(((hillX-355)/125)**2))*(15+32*broad);
 const toe=13+approach*(5+4*Math.sin(d/59));
 const skirt=smoothstep(toe,48+approach*(14+8*broad),x);
 const hills=envelope*smoothstep(88,155,hillX)*(near+back)*(1-extension+extension*skirt)*(1-farm);
 if(!approach)return hills+farm*bench+grassland;
 // Two oblique spurs share a broad apron. The gully between them stays
 // open; far inland the existing ridgelines retain their elevation.
 const toeX=13+75*(1-extension);
 const mask=approach*smoothstep(toeX,toeX+16,x)*(1-smoothstep(145,225,x));
 const spurAxis=46+11*Math.sin((d-4430)/51)+.042*(d-4590);
 const shoulder=Math.exp(-(((x-spurAxis)/23)**2));
 const second=Math.exp(-(((x-spurAxis-43)/35)**2));
 const fingers=shoulder*(3.1+2.6*Math.cos((d-4460)/36))
  +second*(2.2+2.1*Math.sin((d-4520)/56));
 const gully=Math.exp(-(((x-spurAxis-20)/18)**2));
 return hills*(1-mask*(.20+.19*gully))+mask*fingers+farm*bench+grassland;
}
