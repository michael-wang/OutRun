/** A completed pass means the PLAYER has actually cleared the other car.
 * Use longitudinal hysteresis so side-by-side jockeying cannot spam applause. */
export const RIVAL_PASS_CLEARANCE=5.5;
export interface OvertakeRival {entry:{id:string};distance:number;finishTime:number|null}

/** Pure race-state observer; it never changes driving or opponent AI. */
export class RivalOvertakes {
 private armed=new Map<string,boolean>();
 reset(playerDistance:number,rivals:readonly OvertakeRival[]){
  this.armed.clear();
  for(const r of rivals)this.armed.set(r.entry.id,r.finishTime===null&&r.distance-playerDistance>=RIVAL_PASS_CLEARANCE);
 }
 update(playerDistance:number,rivals:readonly OvertakeRival[]):string[]{
  const passed:string[]=[];
  for(const r of rivals){
   if(r.finishTime!==null){this.armed.delete(r.entry.id);continue;}
   const lead=r.distance-playerDistance;
   if(lead>=RIVAL_PASS_CLEARANCE)this.armed.set(r.entry.id,true);
   else if(lead<=-RIVAL_PASS_CLEARANCE&&this.armed.get(r.entry.id)){
    this.armed.set(r.entry.id,false);
    passed.push(r.entry.id);
   }
  }
  return passed;
 }
}
