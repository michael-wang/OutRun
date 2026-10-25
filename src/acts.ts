import {REFERENCE_TRAVEL,TRACK_LENGTH} from './challenges';
export const ACTS=[
 {id:'coast',name:'Azure Coast',start:0,end:40*REFERENCE_TRAVEL,ground:'#c4c49a',shoulder:'#dfcea4',sky:'#9bd8ea',fog:'#b7dce5',families:['palms','villas','sea cliffs'],landmarks:[{name:'Beacon Point lighthouse',fraction:.36,offset:-42},{name:'Twin sails',fraction:.73,offset:-105}],beats:'Low, two full-gas sweepers, lighthouse crest'},
 {id:'canyon',name:'Golden Canyon',start:40*REFERENCE_TRAVEL,end:80*REFERENCE_TRAVEL,ground:'#c58b55',shoulder:'#dca86b',sky:'#b7d3da',fog:'#d5c4a1',families:['layered mesas','dry branching trees','stone walls'],landmarks:[{name:'Sun Arch',fraction:.47,offset:-85},{name:'The Sentinels',fraction:.7,offset:-90}],beats:'Brake-required right, rising S, tight left, ridge exit'},
 {id:'city',name:'Sunlit Coastal City',start:80*REFERENCE_TRAVEL,end:120*REFERENCE_TRAVEL,ground:'#c8c8ad',shoulder:'#d5cbb2',sky:'#a8d9e8',fog:'#c4dce0',families:['stepped midrises','promenade lamps','harbor skyline'],landmarks:[{name:'Harbor clock tower',fraction:.25,offset:-52},{name:'Port cranes',fraction:.65,offset:-85}],beats:'Broad boulevard, harbor descent, skyline sweep, acceleration'}
] as const;
export const TRANSITION_DISTANCE=600;
/** Fixed spatial overlap: the same position has the same scenery at every speed. */
export function actWeights(distance:number){const d=((distance%TRACK_LENGTH)+TRACK_LENGTH)%TRACK_LENGTH,weights=[0,0,0],index=ACTS.findIndex(a=>d<a.end),i=Math.max(0,index),a=ACTS[i],half=TRANSITION_DISTANCE/2;
 if(d-a.start<half){const t=(d-a.start+half)/TRANSITION_DISTANCE,u=t*t*(3-2*t);weights[(i+2)%3]=1-u;weights[i]=u;}
 else if(a.end-d<half){const t=(d-a.end+half)/TRANSITION_DISTANCE,u=t*t*(3-2*t);weights[i]=1-u;weights[(i+1)%3]=u;}
 else weights[i]=1;return weights;
}
export const actAt=(distance:number)=>ACTS[actWeights(distance).indexOf(Math.max(...actWeights(distance)))];
