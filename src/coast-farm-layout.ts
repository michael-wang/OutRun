/** Route-anchored fields: a broad principal plain and three smaller farm visits. */
export const FARM_ZONES=[
 {start:2300,end:3670,right:252,rice:[2400,3000],flowers:[3100,3600],main:true},
 {start:4390,end:4890,right:152,rice:[4500,4700],flowers:[4700,4800],main:false},
 {start:5800,end:6520,right:152,rice:[5900,6200],flowers:[6200,6400],main:false},
 {start:7340,end:7850,right:152,rice:[7400,7600],flowers:[7600,7800],main:false},
] as const;
export const COAST_FARM={start:2300,end:3670,riceStart:2400,riceEnd:3000,flowerStart:3100,flowerEnd:3600} as const;
// Each scarecrow occupies the middle of a cultivated plot, never the roadside verge.
export const FARM_SCARECROWS=[{d:2450,x:76},{d:2650,x:125},{d:2850,x:76},{d:3250,x:76},{d:3450,x:35},{d:4550,x:76},{d:4750,x:35},{d:6050,x:76},{d:6350,x:35},{d:7550,x:76},{d:7750,x:35}] as const;
// Farmsteads occupy existing breaks before/after crops, never cut a hole in the
// golden canopy. Keep each yard on one of the flat planting benches.
export const FARM_HOMES=[{d:2370,x:35},{d:3025,x:35},{d:3065,x:76},{d:3630,x:35},{d:4460,x:35},{d:4830,x:35},{d:5860,x:35},{d:6430,x:35},{d:7370,x:35},{d:7825,x:35}].map((site,i)=>({...site,key:81000+i*71,yaw:Math.sin(i*4.3)*.12}));
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
