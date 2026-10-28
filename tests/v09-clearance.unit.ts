import {test,expect} from 'vitest';
import {generateTrip} from '../src/trip';
import {createPilotTrack} from '../src/pilot-composer';
import {BRICK_START} from '../src/bricks';
test('twenty generated routes avoid close non-adjacent road crossings',()=>{
 for(let seed=1;seed<=20;seed++){
  const trip=generateTrip(seed),track=createPilotTrack(trip),grid=new Map<string,{i:number,x:number,z:number}[]>(),cell=180;
  for(let s=0,i=0;s<trip.length;s+=40,i++){
   const p=track.sample(BRICK_START+s).position,x=Math.floor(p.x/cell),z=Math.floor(p.z/cell);
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const o of grid.get(`${x+dx},${z+dz}`)??[]){if(i-o.i>=20)expect(Math.hypot(p.x-o.x,p.z-o.z),`seed ${seed} near ${s} vs ${o.i*40}`).toBeGreaterThan(90);}
   const key=`${x},${z}`,list=grid.get(key)??[];list.push({i,x:p.x,z:p.z});grid.set(key,list);
  }
 }
},30000);
