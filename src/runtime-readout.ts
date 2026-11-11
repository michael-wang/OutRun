import {GAME_VERSION} from './build-info';

/** Persistent, inexpensive app readout: boot → stage select → loading → race.
 * Once the driving loop exists, its existing FPS counter owns the value. */
export function mountRuntimeReadout(){
 const fps=document.getElementById('drive-fps');
 const version=document.getElementById('game-version');
 if(!fps||!version)return;
 version.textContent='v'+GAME_VERSION;
 let start=0,frames=0;
 const measure=(now:number)=>{
  if(!document.hidden){
   if(!start)start=now;
   frames++;
   if(now-start>=850){
    const gameplayActive=!!document.getElementById('view')&&document.documentElement.dataset.loading!=='true';
    if(!gameplayActive)fps.textContent=Math.round(frames*1000/(now-start))+' FPS';
    frames=0;start=now;
   }
  }else{frames=0;start=now;}
  requestAnimationFrame(measure);
 };
 requestAnimationFrame(measure);
}
