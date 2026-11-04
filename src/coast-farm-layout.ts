/** One authored farm visit. Absolute route coordinates make chunk ownership stable. */
export const COAST_FARM={start:2300,end:3670,riceStart:2400,riceEnd:3000,flowerStart:3100,flowerEnd:3600} as const;
export const FARM_SCARECROWS=[2470,2680,2900] as const;
export type FarmPlot={id:number;start:number;end:number;left:number;right:number;kind:'rice'|'flowers';band:number};
export const FARM_PLOTS:FarmPlot[]=Array.from({length:11},(_,row)=>Array.from({length:3},(_,band)=>({
 id:row*3+band,start:row<6?2400+row*100:3100+(row-6)*100,
 end:row<6?2496+row*100:3196+(row-6)*100,left:20+band*22,right:40+band*22,
 kind:row<6?'rice' as const:'flowers' as const,band,
}))).flat();
export const farmClearing=(d:number,x:number)=>d>=COAST_FARM.start&&d<COAST_FARM.end&&x<94;
export const farmPlotsInChunk=(start:number,end:number)=>FARM_PLOTS.filter(p=>p.start>=start&&p.start<end);
