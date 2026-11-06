/** Finite, drive-by art experiment: Taiwan coastal farming hamlet.
 * All positions are absolute route metres; no per-frame layout work.
 * Visit with ?at=850 and drive through the opening 1.0km hamlet.
 */
export const COAST_RURAL_SHOWCASE={start:1008,end:1095,approachAt:850} as const;

export type RuralHouseKind='townhouse'|'farmhouse'|'courtyard';
export const COAST_RURAL_HOUSES:readonly {d:number;x:number;kind:RuralHouseKind;yaw:number}[]=[
 {d:1027,x:94,kind:'townhouse',yaw:-.06},
 {d:1056,x:46,kind:'courtyard',yaw:.04}, // road-facing gate; still clear of the creek cut
 {d:1085,x:45,kind:'farmhouse',yaw:-.05},
 {d:1034,x:124,kind:'farmhouse',yaw:.16},
];

/** Replace just two primitive farm homes that occupy this hand-authored
 * demonstration pocket; leave the other eight farm homes untouched. */
export const ruralShowcaseReplacesFarmHome=(d:number)=>d===1015||d===1065;

export const RURAL_CREEK={start:1010,end:1092,left:22,right:29} as const;
const smooth=(a:number,b:number,v:number)=>{
 const t=Math.max(0,Math.min(1,(v-a)/(b-a)));
 return t*t*(3-2*t);
};
/** A shallow watercourse cut into existing coastal grass mesh. Terrain,
 * banks and visual water all sample this same deterministic cross-section. */
export function coastRuralCreekCut(x:number,d:number){
 const along=smooth(1007,1020,d)*(1-smooth(1082,1097,d));
 const across=smooth(18,23,x)*(1-smooth(29,34,x));
 return .66*along*across;
}
