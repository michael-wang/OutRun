/** Village street centres picked from frontage gaps, static route metres.
 * Standalone to avoid circular village -> coast -> roadside imports.
 * All consumers (buildings, drain, utility poles) use identical positions. */
export type CoastTownSideStreet={d:number;width:number;length:number;district:number};
export const COAST_TOWN_SIDE_STREETS:readonly CoastTownSideStreet[]=[
 {d:3610,width:6.6,length:80,district:0},
 {d:3746,width:6.6,length:80,district:0},
 {d:4216,width:6.6,length:64,district:1},
 {d:4980,width:6.6,length:80,district:2},
 {d:5180,width:6.6,length:80,district:2},
 {d:5544,width:6.6,length:64,district:3},
 {d:6270,width:6.6,length:80,district:4},
 {d:6390,width:6.6,length:80,district:4},
 {d:6754,width:6.6,length:64,district:5},
] as const;
export const townStreetAt=(d:number,clearance=0)=>
 COAST_TOWN_SIDE_STREETS.find(s=>Math.abs(s.d-d)<s.width*.5+clearance);
