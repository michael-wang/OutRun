import {canyonSceneEnvelope,type GrandCanyonScene} from './grand-canyon-scene';
/** A purely spatial view-clearance rule; no abandoned Pilot camera planner. */
function canyonVistaClearance(scene:GrandCanyonScene,d:number,raw:number){
 const vista=scene.vista;
 return !!vista&&raw< -16&&d>=vista.revealDistance-110&&
  d<=vista.focusDistance+55;
}

export type CanyonPropKind='talus'|'sage'|'scree-bank'|'road-post'|'low-terrace';
export interface CanyonPropSlot {
 readonly distance:number;
 readonly offset:number;
 readonly side:-1|1;
 readonly kind:CanyonPropKind;
 readonly scale:number;
}
const noise=(n:number)=>{const x=Math.sin(n*127.17+43.17)*43758.5453;return x-Math.floor(x);};
const palette={
 roadside:['#c9a476','#d3ad7e','#c49a6c','#d5b487'],
 cliff:['#aa714d','#c18a5d','#b77c54','#95694d'],
 valley:['#a57b57','#c09869','#99745b','#b28b65'],
 far:['#ad9a85','#ae8e79','#9f8c80','#c4a48e'],
} as const;
/** Far mountains read as continuous color planes / strata. No one-isolated
 * tower every 30m: the world terrain itself carries the larger silhouette. */
export function canyonStratumColor(scene:GrandCanyonScene,d:number,raw:number,y:number){
 const group=Math.abs(raw)<45?'roadside':raw>0?'cliff':raw< -180?'far':'valley';
 const bank=palette[group],band=Math.abs(Math.floor((y+scene.seed*5)/15))%bank.length;
 const along=Math.floor((d-scene.start)/130);
 return bank[(band+Math.abs(along)%2)%bank.length];
}
/** Seed-stable natural patches, evaluated at the existing 30m absolute
 * scenery grid in the worker (never per frame). Three independent rhythms
 * create long empty sections, short clusters, and asymmetry. */
export function canyonPropSlots(scene:GrandCanyonScene,d:number):readonly CanyonPropSlot[]{
 if(!scene.vista||canyonSceneEnvelope(scene,d)<.33)return [];
 const step=Math.round((d-16)/30),seed=scene.seed;
 const patch=(salt:number)=>.5+.5*Math.sin(d/(150+salt*25)+seed*1.37+salt*2.3);
 const rand=(salt:number)=>noise(step*11.9+seed*109+salt*19.3);
 const sites:CanyonPropSlot[]=[];
 const add=(kind:CanyonPropKind,side:-1|1,offset:number,scale:number)=>{
  if(canyonVistaClearance(scene,d,offset))return;
  sites.push(Object.freeze({kind,side,offset,distance:d,scale}));
 };
 const slopeSide:1|-1=rand(1)>.52?1:-1;
 if(patch(1)>.65&&rand(2)>.35)
  add('talus',slopeSide,slopeSide*(19+rand(3)*18),.7+rand(4)*.9);
 if(patch(2)>.74&&rand(5)>.55)
  add('sage',rand(6)>.6?1:-1,(rand(6)>.6?1:-1)*(25+rand(7)*25),.7+rand(8)*.7);
 if(patch(3)>.78&&rand(9)>.85)
  add('scree-bank',1,55+rand(10)*48,.75+rand(11)*.6);
 if(patch(4)>.85&&rand(12)>.93)
  add('low-terrace',rand(13)>.55?1:-1,(rand(13)>.55?1:-1)*(150+rand(14)*75),.8+rand(15)*.4);
 if(rand(16)>.78&&step%3!==0)
  add('road-post',rand(17)>.55?1:-1,(rand(17)>.55?1:-1)*(16+rand(18)*2),.85+rand(19)*.5);
 return Object.freeze(sites);
}
