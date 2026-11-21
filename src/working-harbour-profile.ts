import harbour from '../content/stages/coast/working-harbour.json';
import {KENTING_INSTALLATION} from './kenting-installation';
import {beach2} from './beach2-profile';

export const WORKING_HARBOUR_ACTIVE=KENTING_INSTALLATION.mode==='immediate';

/** Gate 2 whitebox, on the unchanged 7100–7540 road. Only this installation
 * knows absolute track stations. Local s and lateral setbacks describe the kit. */
export const WORKING_HARBOUR = {
 entry:harbour.entryPort,exit:harbour.exitPort,rockStart:harbour.rockApproachStart,rockEnd:harbour.rockExitBlendEnd,quayStart:-83,quayEnd:425,
 shoreVersion:5, // increment if the analytic surface changes
 breakwater:[[-167,1],[-135,47],[-73,78],[24,95],[112,103],[200,108],[280,101],[336,90],[392,74]] as const,
 outerWorkS:357,outerWorkOut:67,outerWorkJoin:84,
 berths:[[-47,29,34],[-4,45,36],[42,28,39],[89,42,34],[139,29,41],[193,49,37],[243,30,40],[296,38,36],[354,30,33]] as const,
 scrubSites:[[-260,.59],[-217,.42],[-150,.64],[-106,.61],[-43,.43],[36,.36],[101,.39],[152,.34],[425,.46],[477,.62],[526,.54]] as const,
 lighthouse:[407,.78] as const,
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
 const nose=smooth(-295,-145,s)*(1-smooth(-90,145,s));
 const turnout=smooth(210,399,s)*(1-smooth(452,598,s));
 const basin=smooth(-165,-64,s)*(1-smooth(380,518,s));
 const rough=2.4*Math.sin(s*.061)+1.8*Math.sin(s*.017+1.5);
 return mix(original,72+70*nose+55*turnout+22*basin+rough,w);
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
 const sightWindow=smooth(-230,-125,s)*(1-smooth(268,363,s));
 const ledge=.43+.08*Math.sin(s*.044)+.045*Math.sin(s*.107)+.09*sightWindow;
 const ledgeEdge=ledge+.22+.035*Math.cos(s*.032);
 const face=.10*smooth(0,.10,t)+.065*smooth(.13,.32,t)+.62*smooth(ledge,ledgeEdge,t)+.215*smooth(.76,1,t);
 // Reveal the water by dropping the ground, not the approved driving road.
 // Beyond the retained shoulder this loses most of its height in ~35 metres
 // and then descends more gently to the measured waterline. Preserve the
 // high, dry exit headland under the lighthouse; it lies past the main reveal.
 const distanceFromShoulder=-13-x;
 const reveal=smooth(-258,-137,s)*(1-smooth(335,401,s));
 const edge=30+4*Math.sin(s*.037)+2.5*Math.cos(s*.069);
 const talus=.205*Math.pow(t,1.36)+(.025+.012*Math.sin(s*.047))*smooth(.10,.42,t);
 const rapid=talus+(1-talus)*(1-smooth(3.5,edge,distanceFromShoulder));
 const coast=mix(sea,dry,mix(face,rapid,reveal));
 return mix(original,coast,w*smooth(0,3,-13-x));
}
