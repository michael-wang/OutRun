import harbour from '../content/stages/coast/working-harbour.json';
import {KENTING_INSTALLATION} from './kenting-installation';
import {beach2} from './beach2-profile';

export const WORKING_HARBOUR_ACTIVE=KENTING_INSTALLATION.mode==='immediate';

/** Gate 2 whitebox, on the unchanged 7100–7540 road. Only this installation
 * knows absolute track stations. Local s and lateral setbacks describe the kit. */
export const WORKING_HARBOUR = {
 entry:harbour.entryPort,exit:harbour.exitPort,rockStart:harbour.rockApproachStart,rockEnd:harbour.rockExitBlendEnd,quayStart:258,quayEnd:411,
 shoreVersion:3, // increment if the analytic surface changes
 breakwater:[[229,1],[244,14],[277,36],[317,45],[360,44],[400,36]] as const,
 outerWorkS:369,outerWorkOut:33,
 berths:[[306,21,20],[349,22,23],[386,17,18]] as const,
 scrubSites:[[-94,.66],[-40,.58],[28,.67],[82,.43],[121,.47],[160,.32],[425,.46],[477,.62],[526,.54]] as const,
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
 // The first rocky nose reaches into the sea, followed by a recessed but
 // still offshore working bay and a quieter, asymmetric exit shoulder.
 const nose=smooth(-122,126,s)*(1-smooth(143,249,s));
 const turnout=smooth(294,424,s)*(1-smooth(453,593,s));
 const basin=smooth(190,272,s)*(1-smooth(380,486,s));
 const rough=2.4*Math.sin(s*.061)+1.8*Math.sin(s*.017+1.5);
 return mix(original,41+54*nose+31*turnout+27*basin+rough,w);
}

export function harbourGround(d:number,x:number,shore:number,sea:number,road:number,bank:number,original:number){
 const w=harbourRockWeight(d);
 if(!w||x>=-13)return original;
 const dry=road-bank*13-.28;
 if(x<=shore)return mix(original,sea-Math.min(15,(shore-x)*.31),w);
 // Rock toe + broad low shelf + irregular crack/crest. The lower shelf is
 // genuine ground, not a flat slab or background card. A low wet-dry break
 // meets the same shared mask; only the landward slope approaches road level.
 const t=(x-shore)/(-13-shore);
 const s=d-WORKING_HARBOUR.entry;
 const sightWindow=smooth(-70,20,s)*(1-smooth(268,363,s));
 const ledge=.43+.08*Math.sin(s*.044)+.045*Math.sin(s*.107)+.09*sightWindow;
 const ledgeEdge=ledge+.22+.035*Math.cos(s*.032);
 const face=.10*smooth(0,.10,t)+.065*smooth(.13,.32,t)+.62*smooth(ledge,ledgeEdge,t)+.215*smooth(.76,1,t);
 const coast=mix(sea,dry,face);
 return mix(original,coast,w*smooth(0,3,-13-x));
}
