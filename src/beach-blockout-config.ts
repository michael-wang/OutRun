import layout from '../content/stages/coast/scenic-layout.json';
export const KENTING_ANCHOR=layout.heroAnchors.find(a=>a.id==='beach-market')!.roadDistance;
/** Development preview; stage layout owns the absolute track anchor. */
export function beachBlockoutAnchor(params:URLSearchParams,length:number){
 if(params.get('beachBlockout')!=='1')return undefined;
 const value=Number(params.get('beachAnchor')??KENTING_ANCHOR);
 return Number.isFinite(value)?Math.max(600,Math.min(length-600,value)):KENTING_ANCHOR;
}
/** The completed local kit is enabled by default on dev; explicit zero restores old scenery. */
export function beachPreviewAnchor(params:URLSearchParams,length:number){
 if(params.get('beachBlockout')==='0')return undefined;
 const enabled=new URLSearchParams(params);enabled.set('beachBlockout','1');
 return beachBlockoutAnchor(enabled,length);
}
/** Clear only the sea-side market frontage at the selected temporary site. */
export function blockoutReplacesStall(d:number,x:number,anchor:number|undefined){
 return anchor!==undefined&&x< -11&&d>=anchor-160&&d<=anchor+160;
}
