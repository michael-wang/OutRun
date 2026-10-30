/** One authored environmental vignette; never changes the route sampler or Trip Code. */
export const CANYON_BEND={start:600,end:900};
export const canyonBend=(d:number)=>d>=CANYON_BEND.start&&d<CANYON_BEND.end;
export const canyonBlend=(d:number)=>Math.max(0,Math.min(1,(d-600)/50,(900-d)/60));
