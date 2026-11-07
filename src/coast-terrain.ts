import {fbm2,ridged2,smoothstep} from './vendor/procedural-terrains/cpuNoise.js';
import {COAST_DISTRICTS} from './coast-layout';
import {farmPlainMask,farmTerraceHeight} from './coast-farm-layout';

export const COAST_HILL_STRIPS=[13,18,23,29,36,48,51,53,55,58,70,88,94,97,99,101,104,125,140,146,149,151,153,156,180,198,201,203,205,208,220,250,252,270,340,450] as const;

/** District forecourts stay flat; hills ease in beyond their ends and behind them. */
export function coastWildness(d:number){
 let gap=Infinity;
 for(const zone of COAST_DISTRICTS)gap=Math.min(gap,Math.max(zone.start-d,0,d-zone.end));
 return smoothstep(0,115,gap);
}

/** ProceduralTerrains' rotated-domain FBM and erosion-aware ridges, evaluated
 * during worker preparation only. Absolute route coordinates join all chunks.
 * The road and beach are deliberately outside this inland height field. */
export function coastHillHeight(x:number,d:number){
 const farm=farmPlainMask(x,d),bench=farmTerraceHeight(x);
 if(x<=88)return farm*bench;
 if(farm===1)return bench;
 const wild=coastWildness(d);
 // Slide the foothills inland through inhabited districts, tapering the
 // displacement at each town entrance so the plain joins the countryside.
 const hillX=x-105*(1-wild),behindTown=smoothstep(140,220,hillX);
 const envelope=Math.max(wild,behindTown);
 const broad=fbm2(x/115+8.04,d/180+17.3,4,.48,2.03,.6,.35);
 const ridge=ridged2(x/170+31.7,d/260+4.2,3,.5,2.1,1.7,.3,.25);
 const crest=200+32*fbm2(8.04,d/230,3,.5,2);
 const near=Math.exp(-(((hillX-crest)/(65+20*broad))**2))*(12+28*ridge);
 const back=Math.exp(-(((hillX-355)/125)**2))*(15+32*broad);
 return envelope*smoothstep(88,155,hillX)*(near+back)*(1-farm)+farm*bench;
}
