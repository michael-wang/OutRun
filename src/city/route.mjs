// Metres measured along the driving line; positive curvature bends to driver's left.
export const length=7110;
export const districts=[[0,'中央街廓'],[1200,'市民公園大道'],[2220,'高架市集'],[4150,'港灣大橋'],[5650,'百貨廣場'],[6510,'中央車站']];
export function district(d){return districts.filter(s=>s[0]<=d).at(-1)||districts[0];}
export function smooth(x,a,b){const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);}
// Centre, length, peak curvature, shoulder fraction. Contiguous same-hand arcs
// make late apexes and tightening corners instead of a sequence of mirrored gates.
export const turns=[
 [295,350,-.0039,.32],[661,104,.0125,.18],[878,187,.0053,.30],
 [1495,510,-.0028,.33],[2040,120,.0108,.24],
 [2330,230,.0040,.29],[2500,116,.0114,.21],[2755,225,-.0081,.22],[3150,92,.0132,.20],
 [3470,380,-.0049,.29],[3890,153,.0092,.22],
 [4320,286,.00415,.31],[5010,440,-.0028,.30],[5515,235,.0050,.30],
 [5990,300,-.0056,.26],[6205,116,-.0128,.19],[6500,210,.0074,.27],
 [6740,180,-.0059,.27],[6945,130,.0071,.25]
];
export function bend(d){let k=0;for(const [c,l,p,r] of turns){const t=(d-c)/l+.5;if(t>0&&t<1)k+=p*smooth(t,0,r)*(1-smooth(t,1-r,1));}return k;}
export const laneWidth=4.8;
// [begin taper, end taper out, side, lane added (+1) or dropped (-1)].
export const zones=[[1120,1980,1,1],[2330,2890,-1,-1],[4230,5550,-1,1],[5950,6430,1,-1]];
export const closures=zones.filter(z=>z[3]<0);
export function widthChange(d,side){let n=0;for(const [a,b,s,delta] of zones)if(s===side&&a<d&&d<b)n+=delta*smooth(d,a,a+115)*(1-smooth(d,b-100,b));return n;}
export function edge(d,side){return (2+widthChange(d,side))*laneWidth;}
export function trafficX(d,slot){
 const side=Math.sign(slot),rank=Math.abs(slot),change=widthChange(d,side);
 // An outer-lane driver merges into the continuing lane before the taper pinches.
 // In a newly opened fifth lane the outward movement follows its available width.
 const outer=rank===1?.5:rank===3?1.5+smooth(change,.54,1):1.5;
 const index=rank>1?outer-smooth(-change,0,.65):outer;
 return side*laneWidth*index;
}
export function grade(d){return 8+4*smooth(d,1700,2130)-6*smooth(d,2310,2690)+21*smooth(d,4190,4840)-17*smooth(d,5330,5830)-2*smooth(d,6430,6630);}
