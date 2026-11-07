/** The farming story begins immediately: a broad opening rice plain and
 * flowers, two *small* farm breaks amid town streets, then a larger working
 * countryside on the fishing coast. Every plot stays within one 1km chunk.
 */
export const FARM_ZONES=[
 {start:65,end:1780,right:252,rice:[200,900],flowers:[1200,1700],main:true},
 {start:4450,end:4900,right:152,rice:[4500,4700],flowers:[4750,4850],main:false},
 {start:5740,end:6190,right:152,rice:[5800,6000],flowers:[6040,6140],main:false},
 {start:7140,end:8230,right:200,rice:[7200,7600],flowers:[7800,8100],main:false},
 {start:8390,end:9760,right:252,rice:[8500,9100],flowers:[9300,9600],main:false},
] as const;
export const COAST_FARM={start:65,end:1780,riceStart:200,riceEnd:900,flowerStart:1200,flowerEnd:1700} as const;
/** Authored flower-band palette shared by Worker baking and runtime materialization. */
export const FARM_FLOWER_COLORS=['#ecc341','#e679a7','#a382d8'] as const;
/** Only the near two flower terraces use costly individual petal/grass meshes.
 * Far terraces retain the original opaque coloured ground/field rows.
 * Golden rice (canopy + real near-heads) is deliberately unchanged. */
export const FARM_FLOWER_DETAIL={
 0:{bladeDensity:.105,flowerDensity:.65,maxFlowers:1400},
 1:{bladeDensity:.047,flowerDensity:.20,maxFlowers:360},
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
 {d:8550,x:76},{d:8750,x:125},{d:8950,x:76},{d:9350,x:76},{d:9550,x:35},
] as const;
// Farmsteads occupy existing breaks before/after crops, never cut a hole in the
// golden canopy. Keep each yard on one of the flat planting benches.
export const FARM_HOMES=[
 {d:115,x:35},{d:1015,x:35},{d:1065,x:76},{d:1750,x:35},
 {d:4465,x:35},{d:4870,x:35},
 {d:5755,x:35},{d:6170,x:35},
 {d:7160,x:35},{d:8160,x:35},
 {d:8430,x:35},{d:9670,x:35},
].map((site,i)=>({...site,key:81000+i*71,yaw:Math.sin(i*4.3)*.12}));
export type FarmPlot={id:number;start:number;end:number;left:number;right:number;kind:'rice'|'flowers';band:number};
const bands=[[20,50],[56,96],[102,148],[154,200],[206,252]];
export const FARM_PLOTS:FarmPlot[]=[];
for(const zone of FARM_ZONES)for(const kind of ['rice','flowers'] as const)for(let d=zone[kind][0];d<zone[kind][1];d+=100)
 for(const [band,[left,right]] of bands.entries())if(right<=zone.right)FARM_PLOTS.push({id:FARM_PLOTS.length,start:d,end:d+(kind==='rice'?98:96),left,right,kind,band});
export const farmClearing=(d:number,x:number)=>FARM_ZONES.some(z=>d>=z.start&&d<z.end&&x<z.right+10);
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
 }return mask;
}
