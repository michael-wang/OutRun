import {smoothstep,vnoise2} from './vendor/procedural-terrains/cpuNoise.js';
import {FARM_HOMES,FARM_ZONES} from './coast-farm-layout';
import {COAST_DISTRICTS} from './coast-layout';
import {COAST_RURAL_SHOWCASE,coastRuralCreekCut} from './coast-rural-layout';
import {COAST_DRAIN_X} from './coast-roadside-layout';

// Uncultivated headlands between the farmyards, the town and the finish.
const rollingHeadlands=[[1764,3408],[6995,7137],[8182,8405],[9700,10012]] as const;

const cropland=FARM_ZONES.flatMap(z=>[
  {start:z.rice[0],end:z.rice[1],right:z.right+3},
  {start:z.flowerApproach,end:z.flowers[1],right:z.flowerRight+3},
 ]);
const lawns=[
 ...FARM_HOMES.map(h=>({start:h.d-14,end:h.d+14,right:h.x+16})),
 ...COAST_DISTRICTS.map(z=>({...z,right:210})),
 {...COAST_RURAL_SHOWCASE,right:150},
];

export function meadowCover(x:number,d:number){
 const open=smoothstep(COAST_DRAIN_X.rightLip,COAST_DRAIN_X.outerLand,x);
 if(!open)return 0;
 let cover=open;
 for(const {start,end,right} of cropland){
  const gap=Math.max(start-d,d-end,x-right);
  // Keep turf on the narrow bank between the channel and the first crop.
  cover=Math.min(cover,open*Math.max(1-smoothstep(16,20,x),smoothstep(0,12,gap)));
 }
 return cover*(1-smoothstep(.05,.35,coastRuralCreekCut(x,d)));
}

export function lawnWeight(x:number,d:number){
 let weight=0;
 for(const {start,end,right} of lawns){
  const gap=Math.max(start-d,d-end,x-right);
  weight=Math.max(weight,1-smoothstep(0,18,gap));
 }
 return weight;
}

function headlandCover(x:number,d:number){
 if(x<16||x>245)return 0;
 for(const [start,end] of rollingHeadlands){
  if(d<=start||d>=end)continue;
  return smoothstep(start,start+16,d)*(1-smoothstep(end-24,end,d))
   *smoothstep(16,21,x)*(1-smoothstep(177,245,x));
 }
 return 0;
}

export function meadowRelief(x:number,d:number){
 const cover=headlandCover(x,d);
 if(!cover||x<=19)return 0;
 const swell=vnoise2(x/42+7,d/55),hummock=vnoise2(x/14,d/21+4);
 return cover*smoothstep(19,46,x)*(2.65*swell+.68*hummock-.54);
}
