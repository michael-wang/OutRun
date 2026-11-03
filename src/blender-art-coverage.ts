/** Fixed footprint of the existing v2 foundation, in its authored world frame.
 * These masks only remove old visuals; they never generate terrain or road. */
export const BLENDER_HERO={start:1340,end:1940} as const;
const originX=-358.40376,originZ=1357.11137,heading=.8156356975985335;
export function insideBlenderFootprint(x:number,z:number,padding=0){
 const dx=x-originX,dz=z-originZ;
 const left=dx*Math.cos(heading)+dz*Math.sin(heading);
 const forward=-dx*Math.sin(heading)+dz*Math.cos(heading);
 return left>=-700-padding&&left<=1250+padding&&forward>=-220-padding&&forward<=2200+padding;
}
export const insideBlenderHero=(distance:number)=>distance>=BLENDER_HERO.start&&distance<BLENDER_HERO.end;
