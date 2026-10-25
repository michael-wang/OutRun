export const STEERING_STEPS=4,STEERING_DEAD_ZONE=.08,STEERING_HYSTERESIS=.025;
/** Schmitt bands, without time smoothing. Deliberate swipes change immediately. */
export function quantizeSteering(raw:number,previous=0,steps=STEERING_STEPS){
 raw=Math.max(-1,Math.min(1,raw));if(raw===0)return 0;
 const sign=Math.sign(raw),magnitude=Math.abs(raw);
 let level=Math.sign(previous)===sign?Math.round(Math.abs(previous)*steps):0;
 const threshold=(higher:number)=>higher===1?STEERING_DEAD_ZONE:(higher-.5)/steps;
 while(level<steps&&magnitude>=threshold(level+1)+STEERING_HYSTERESIS)level++;
 while(level>0&&magnitude<threshold(level)-STEERING_HYSTERESIS)level--;
 return level?sign*level/steps:0;
}
