import {it,expect} from 'vitest';
import {RivalOvertakes,RIVAL_PASS_CLEARANCE} from '../src/rival-overtakes';
import {createOccupantMotion} from '../src/occupants';

type Rival={entry:{id:string};distance:number;finishTime:number|null};
const rival=(id:string,distance:number):Rival=>({entry:{id},distance,finishTime:null});

it('acknowledges each fully completed Rival pass once, not a side-by-side flicker',()=>{
 const tracker=new RivalOvertakes();
 const cars=[rival('RIVAL 1',12),rival('RIVAL 2',27),rival('RIVAL 3',42)];
 tracker.reset(0,cars);
 expect(RIVAL_PASS_CLEARANCE).toBeGreaterThan(4.9);
 expect(tracker.update(15,cars)).toEqual([]);
 expect(tracker.update(18,cars)).toEqual(['RIVAL 1']);
 expect(tracker.update(20,cars)).toEqual([]);
 expect(tracker.update(34,cars)).toEqual(['RIVAL 2']);
 expect(tracker.update(48,cars)).toEqual(['RIVAL 3']);
 expect(tracker.update(52,cars)).toEqual([]);
 // Rival truly retakes the lead: a second player overtake earns a new cheer.
 cars[0].distance=59;
 expect(tracker.update(52,cars)).toEqual([]);
 expect(tracker.update(65,cars)).toEqual(['RIVAL 1']);
});

it('does not applaud a rival finishing, jumping, or appearing behind on reset',()=>{
 const tracker=new RivalOvertakes(),cars=[rival('RIVAL 1',11)];
 tracker.reset(0,cars);
 cars[0].finishTime=8;
 expect(tracker.update(20,cars)).toEqual([]);
 cars[0].finishTime=null;cars[0].distance=2;
 tracker.reset(20,cars);
 expect(tracker.update(21,cars)).toEqual([]);
});

it('applauds the first rival pass and ignores all overtakes during the gesture',()=>{
 const motion=createOccupantMotion([]);
 expect(motion.onRivalPass()).toBe('applause');
 expect(motion.inspect()).toMatchObject({cheer:'applause',cheerTime:0});
 expect(motion.onRivalPass()).toBeUndefined();
 expect(motion.onRivalPass()).toBeUndefined();
 motion.advance(0,0,1.7);
 expect(motion.inspect().cheerTime).toBe(-1);
 // No queued applause after the animation has ended.
 motion.advance(0,0,2.0);
 expect(motion.inspect().cheerTime).toBe(-1);
 expect(motion.onRivalPass()).toBe('applause');
 motion.reset();
 expect(motion.inspect().cheerTime).toBe(-1);
});
