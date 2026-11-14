import {COAST_EFFECTS} from './content/coast-effects';

/** The farming story begins immediately: a broad opening rice plain and
 * flowers, two *small* farm breaks amid town streets, then a larger working
 * countryside on the fishing coast. Every plot stays within one 1km chunk.
 */
export const FARM_ZONES=[
 {start:65,end:1780,right:252,rice:[200,900],flowers:[1200,1700],flowerApproach:1110,flowerRight:340,main:true},
 {start:4450,end:4900,right:152,rice:[4500,4700],flowers:[4750,4850],flowerApproach:4750,flowerRight:252,main:false},
 {start:5740,end:6190,right:152,rice:[5800,6000],flowers:[6040,6140],flowerApproach:6040,flowerRight:252,main:false},
 {start:7140,end:8230,right:200,rice:[7200,7600],flowers:[7800,8100],flowerApproach:7700,flowerRight:252,main:false},
 {start:9150,end:10530,right:252,rice:[9800,10400],flowers:[9300,9600],flowerApproach:9200,flowerRight:340,main:false},
] as const;
export const COAST_FARM={start:65,end:1780,riceStart:200,riceEnd:900,flowerStart:FARM_ZONES[0].flowerApproach,flowerEnd:1700} as const;
/** Authored flower-band palette shared by Worker baking and runtime materialization. */
export const FARM_FLOWER_COLORS=COAST_EFFECTS.flowers.palette;
/** Only the near two terraces grow individual flowers and blades.
 * The outer terraces use textured crowns above the dry planting beds. */
export const FARM_FLOWER_DETAIL={
 0:COAST_EFFECTS.flowers.near,
 1:COAST_EFFECTS.flowers.middle,
} as const;
export function farmFlowerDetail(band:number){
 return band===0?FARM_FLOWER_DETAIL[0]:band===1?FARM_FLOWER_DETAIL[1]:undefined;
}
// Each scarecrow occupies the middle of a cultivated plot, never the roadside verge.
export const FARM_SCARECROWS=[
 {d:350,x:76},{d:650,x:125},{d:1450,x:76},{d:1650,x:35},
 {d:4550,x:76},{d:4800,x:76},
 {d:5850,x:76},{d:6090,x:76},
 {d:7250,x:76},{d:7450,x:125},{d:7850,x:76},{d:8050,x:35},
 {d:9850,x:76},{d:10050,x:125},{d:10250,x:76},{d:9350,x:76},{d:9550,x:35},
] as const;
// Farmsteads occupy existing breaks before/after crops, never cut a hole in the
// golden canopy. Keep each yard on one of the flat planting benches.
export const FARM_HOMES=[
 {d:115,x:35},{d:1015,x:35},{d:1065,x:76},{d:1750,x:35},
 {d:4465,x:35},{d:4870,x:35},
 {d:5755,x:35},{d:6170,x:35},
 {d:7160,x:35},{d:8160,x:35},
 {d:10450,x:35},{d:9670,x:35},
].map((site,i)=>({...site,key:81000+i*71,yaw:Math.sin(i*4.3)*.12}));
/** Dry working bays cut into the outer bund, with room for a cart and a shade tree. */
export const RICE_YARDS=[
 {d:572,x:46,yaw:.42},{d:833,x:91,yaw:-.24},
 {d:4628,x:46,yaw:-.35},{d:5936,x:91,yaw:.56},
 {d:7374,x:46,yaw:.20},{d:9956,x:46,yaw:-.32},{d:10172,x:142,yaw:.55},
] as const;
export const FLOWER_YARDS=[
 {d:1338,x:46,yaw:-.28},{d:1562,x:91,yaw:.36},{d:4808,x:46,yaw:.23},
 {d:6106,x:91,yaw:-.44},{d:7942,x:46,yaw:.30},{d:9395,x:46,yaw:-.38},
] as const;
export const FARM_YARDS=[...RICE_YARDS,...FLOWER_YARDS];
export type FarmPlot={id:number;start:number;end:number;left:number;right:number;kind:'rice'|'flowers';band:number;yard?:typeof FARM_YARDS[number]};
export function flowerPlotColor(p:FarmPlot,palette:readonly string[]=FARM_FLOWER_COLORS){
 return palette[(Math.floor(p.start/190)+p.band)%palette.length];
}
export const FLOWER_ROW_PITCH=2;
export function flowerCoverage(plot:FarmPlot,clear:(d:number,x:number)=>boolean){
 return {sample:({uv}:{uv:{x:number;y:number}|null})=>{
  if(!uv||uv.y<=.015||uv.y>=.985)return 0;
  const x=uv.x*(plot.right-plot.left),d=plot.start+uv.y*(plot.end-plot.start);
  return (x/FLOWER_ROW_PITCH)%1>.16&&!clear(d,plot.left+x)?1:0;
 }};
}
// The broad outer headland leaves space for the existing field-edge trees.
const bands=[[20,50],[56,96],[102,148],[154,200],[206,252],[274,340]];
export const FARM_PLOTS:FarmPlot[]=[];
// Interior cross-bunds meet neighbouring terraces at different distances.
// Retain the exact farm entrances and streaming boundaries.
function farmDivision(d:number,band:number,limits:readonly number[],stagger:number){
 if(d===limits[0]||d===limits[1]||d%1000===0)return d;
 return d+[13,-6,6,-15,17,-9][band]*stagger;
}
function addFarmPlots(kind:FarmPlot['kind'],limits:readonly number[],inner:number,outer:number){
 for(let d=limits[0];d<limits[1];d+=100)for(const [band,[left,right]] of bands.entries())if(right>inner&&right<=outer){
  // Flower visits have shorter headlands around their central scarecrows.
  const division=(at:number)=>farmDivision(at,band,limits,kind==='rice'?1:.5);
  const start=division(d)+(d%1000===0?1.5:0),end=division(Math.min(d+100,limits[1]))-3;
  const yard=FARM_YARDS.find(s=>s.d>=start&&s.d<end&&s.x>left&&s.x<right);
  FARM_PLOTS.push({id:FARM_PLOTS.length,start,end,left,right,kind,band,yard});
 }
}
// Existing ids seed the accepted rice geometry and farmyards. Append new land
// after the original parcels so enlarging a flower visit keeps those seeds stable.
for(const zone of FARM_ZONES)for(const kind of ['rice','flowers'] as const)addFarmPlots(kind,zone[kind],0,zone.right);
for(const zone of FARM_ZONES){
 addFarmPlots('flowers',[zone.flowerApproach,zone.flowers[0]],0,zone.flowerRight);
 addFarmPlots('flowers',zone.flowers,zone.right,zone.flowerRight);
}
/** Piecewise banks in planting coordinates. Keep the planted rows straight
 * inside a field with chamfered corners, angled sides and a dry turning bay. */
export function farmPlotEdges(p:FarmPlot,d:number){
 const t=Math.max(0,Math.min(1,(d-p.start)/(p.end-p.start))),key=p.id;
 const left=p.left+1.1+(1+Math.sin(key*2.3+t*4.3))*1.45+Math.max(0,1-t*5)*(2+key%6);
 let right=p.right-.9-(1+Math.cos(key*1.7+t*3.5))*1.45-Math.max(0,t*5-4)*(3+key%4);
 if(p.yard)right=Math.min(right,p.yard.x-7+Math.max(0,Math.abs(d-p.yard.d)-8)*.65);
 return {left,right};
}
export const farmClearing=(d:number,x:number)=>FARM_ZONES.some(z=>d>=z.start&&d<z.end&&x<10+(d>=z.flowerApproach&&d<=z.flowers[1]?z.flowerRight:z.right));
export const farmPlotsInChunk=(start:number,end:number)=>FARM_PLOTS.filter(p=>p.start>=start&&p.start<end);
/** Horizontal planting benches separated by planted earth banks. The fine
 * terrain columns include these transitions; crops never follow the steep bank. */
export function farmTerraceHeight(x:number){
 const ramps=[[51,55,0,.65],[97,101,.65,1.5],[149,153,1.5,2.6],[201,205,2.6,4]];
 for(const [a,b,lo,hi] of ramps)if(x<=b)return x<=a?lo:lo+(hi-lo)*(x-a)/(b-a);
 return 4;
}
/** Local broad valley floor; blend back into untouched hills outside each visit. */
export function farmPlainMask(x:number,d:number){
 const smooth=(a:number,b:number,v:number)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
 let mask=0;
 for(const z of FARM_ZONES){const first=Math.min(z.rice[0],z.flowers[0]),last=Math.max(z.rice[1],z.flowers[1]);
  const along=smooth(z.start,first-15,d)*(1-smooth(last+10,z.end,d));
  mask=Math.max(mask,along*(1-smooth(z.right+10,z.right+125,x)));
  // The outer ground triangles span 20 m. Include their end stations in
  // the bench so the first and last rows do not tilt back into the hillside.
  const flowers=smooth(z.flowerApproach-55,z.flowerApproach-22,d)*(1-smooth(z.flowers[1]+22,z.flowers[1]+55,d));
  mask=Math.max(mask,flowers*(1-smooth(z.flowerRight+12,z.flowerRight+100,x)));
 }return mask;
}
