import harbour from '../content/stages/coast/working-harbour.json';
import {KENTING_INSTALLATION} from './kenting-installation';
import {beach2} from './beach2-profile';

export const WORKING_HARBOUR_ACTIVE=KENTING_INSTALLATION.mode==='immediate';

/** Gate 2 whitebox, on the unchanged 7100–7540 road. Only this installation
 * knows absolute track stations. Local s and lateral setbacks describe the kit. */
export const WORKING_HARBOUR = {
 entry:harbour.entryPort,exit:harbour.exitPort,rockStart:harbour.rockApproachStart,rockEnd:harbour.rockExitBlendEnd,quayStart:155,quayEnd:363,
 shoreVersion:2, // increment if the analytic surface changes
 breakwater:[[142,1],[156,22],[171,50],[192,74],[218,91],[233,93]] as const,
 outerWorkS:222,outerWorkOut:80,
 berths:[[225,65,18],[269,22,19],[316,19,14]] as const,
} as const;

const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const smooth=(a:number,b:number,x:number)=>{
 const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);
};
export function harbourRockWeight(d:number){
 // The immediate full setup is shared by page, Worker and shore bake.
 // Older partial Beach Flow/Close authoring fixtures retain their own coast.
 if(!WORKING_HARBOUR_ACTIVE||!beach2())return 0;
 const h=WORKING_HARBOUR;
 return smooth(h.rockStart,h.entry,d)*(1-smooth(h.exit,h.rockEnd,d));
}
export function harbourShoreWidth(d:number,original:number){
 const s=d-WORKING_HARBOUR.entry,w=harbourRockWeight(d);
 if(!w)return original;
 // A narrow irregular cliff foot; the indentation opens into the basin.
 const inlet=smooth(100,183,s)*(1-smooth(360,425,s));
 return mix(original,13+3*Math.sin(s*.023)+1.8*Math.cos(s*.049)-8*inlet,w);
}

export function harbourGround(d:number,x:number,shore:number,sea:number,road:number,bank:number,original:number){
 const w=harbourRockWeight(d);
 if(!w||x>=-13)return original;
 const dry=road-bank*13-.28;
 if(x<=shore)return mix(original,sea-Math.min(15,(shore-x)*.31),w);
 // A narrow rock toe, fractured face, then a low shoulder. Resolve at the
 // same analytic waterline as the signed shore mask, not at road height.
 const t=(x-shore)/(-13-shore);
 const s=d-WORKING_HARBOUR.entry;
 const sightWindow=smooth(55,101,s)*(1-smooth(174,224,s));
 const ledge=mix(.21,.43,(1+Math.sin(s*.048)+.45*Math.sin(s*.105))/2.45)+.15*sightWindow;
 const face=.10*t+.75*smooth(ledge,ledge+.34,t)+.15*smooth(.76,1,t);
 const coast=mix(sea,dry,face);
 return mix(original,coast,w*smooth(0,3,-13-x));
}
