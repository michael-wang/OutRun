import {it,expect} from 'vitest';
import {HeroineOpportunities} from '../src/heroine-opportunities';
const rival=(lead:number,localX=3,id='A')=>({id,lead,localX,finished:false});
it('reacts alongside before score clearance, once per encounter, alternating deterministically',()=>{
 const o=new HeroineOpportunities();o.update(.1,[rival(8)]);o.update(.1,[rival(4)]);
 const trigger=o.update(.1,[rival(2)]);expect(trigger).toEqual({id:'A',side:'left',action:'shoutLeft'});
 expect(o.update(.1,[rival(0,-3)])).toBeUndefined();expect(trigger?.side).toBe('left');
 for(let i=0;i<42;i++)expect(o.update(.1,[rival(-8)])).toBeUndefined();
 o.update(.1,[rival(8,-3)]);expect(o.update(.1,[rival(2,-3)])?.action).toBe('kissRight');
});
it('rejects player being overtaken, collisions, first-frame teleports, finish, and stalls',()=>{
 const o=new HeroineOpportunities();expect(o.update(.1,[rival(2)])).toBeUndefined();
 o.update(.1,[rival(8)]);o.update(.1,[rival(1)],true);expect(o.update(.1,[rival(0)])).toBeUndefined();
 o.reset();o.update(.1,[rival(-8)]);expect(o.update(.1,[rival(0)])).toBeUndefined();
 o.update(.1,[rival(8)]);expect(o.update(.1,[{...rival(1),finished:true}])).toBeUndefined();
 o.reset();o.update(.1,[rival(8)]);expect(o.update(.5,[rival(1)])).toBeUndefined();expect(o.update(.1,[rival(0)])).toBeUndefined();
});
it('chooses a single readable rival and freezes the returned direction',()=>{
 const o=new HeroineOpportunities();o.update(.1,[rival(8,3,'A'),rival(9,-3,'B')]);
 expect(o.update(.1,[rival(2,3,'A'),rival(1,-3,'B')])).toEqual({id:'B',side:'right',action:'shoutRight'});
});
