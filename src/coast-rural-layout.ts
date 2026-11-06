/** Finite, drive-by art experiment: Taiwan coastal farming hamlet.
 * All positions are absolute route metres; no per-frame layout work.
 * Visit with ?at=2960 and drive through the 3.0km field transition.
 */
export const COAST_RURAL_SHOWCASE={start:3008,end:3095,approachAt:2960} as const;

export type RuralHouseKind='townhouse'|'farmhouse'|'courtyard';
export const COAST_RURAL_HOUSES:readonly {d:number;x:number;kind:RuralHouseKind;yaw:number}[]=[
 {d:3027,x:43,kind:'townhouse',yaw:-.06},
 {d:3056,x:73,kind:'courtyard',yaw:.04},
 {d:3085,x:45,kind:'farmhouse',yaw:-.05},
 {d:3034,x:124,kind:'farmhouse',yaw:.16},
];

/** Replace just two primitive farm homes that occupy this hand-authored
 * demonstration pocket; leave the other eight farm homes untouched. */
export const ruralShowcaseReplacesFarmHome=(d:number)=>d===3025||d===3065;

export const RURAL_CREEK={start:3010,end:3092,left:22,right:29} as const;
const smooth=(a:number,b:number,v:number)=>{
 const t=Math.max(0,Math.min(1,(v-a)/(b-a)));
 return t*t*(3-2*t);
};
/** A shallow watercourse cut into existing coastal grass mesh. Terrain,
 * banks and visual water all sample this same deterministic cross-section. */
export function coastRuralCreekCut(x:number,d:number){
 const along=smooth(3007,3020,d)*(1-smooth(3082,3097,d));
 const across=smooth(18,23,x)*(1-smooth(29,34,x));
 return .66*along*across;
}
