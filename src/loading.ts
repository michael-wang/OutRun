import {startupDiagnostics} from './startup-diagnostics';
// The loading surface lives in HTML so it also covers module downloads.
let progress=0,complete=false,failed=false;
const node=(id:string)=>document.getElementById(id)!;
let slow:ReturnType<typeof setTimeout>,retry:ReturnType<typeof setTimeout>,finish:ReturnType<typeof setTimeout>|undefined;
function armTimers(){
 clearTimeout(slow);clearTimeout(retry);clearTimeout(finish);
 slow=setTimeout(()=>{node('loading-slow').hidden=false;},15000);
 retry=setTimeout(()=>{node('startup-fallback').hidden=false;},45000);
}
armTimers();

/** Reuse the initial artwork/status surface for an explicitly requested replay. */
export function loadingStarted(title='正在準備重新出發',detail='沿著海岸，再走一段好風景。'){
 progress=0;complete=false;failed=false;armTimers();
 document.documentElement.dataset.loading='true';node('game-loading').hidden=false;
 node('game-loading').dataset.phase='loading';node('loading-ready').hidden=true;
 node('game-loading').setAttribute('aria-busy','true');node('loading-slow').hidden=true;node('startup-fallback').hidden=true;
 node('startup-error').textContent='準備時間較長。你可以繼續等待，或重新載入。';
 node('loading-slow').textContent='風景準備中，請保持此頁開啟。';
 node('loading-hint').textContent='準備完成後，自動重新出發';loadingProgress(0,title,detail);
}

export function loadingProgress(value:number,title:string,detail:string){
 if(complete||failed)return;
 progress=Math.max(progress,Math.min(100,Math.round(value)));
 node('loading-fill').style.transform=`scaleX(${progress/100})`;
 node('loading-percent').textContent=`${progress}%`;
 node('loading-track').setAttribute('aria-valuenow',String(progress));
 node('loading-track').setAttribute('aria-valuetext',`${title}，準備進度 ${progress}%`);
 const displayTitle=document.documentElement.dataset.playerUi==='true'?'正在準備旅程…':title;
 if(node('loading-title').textContent!==displayTitle)node('loading-title').textContent=displayTitle;
 node('loading-detail').textContent=detail;
 startupDiagnostics.progress(progress,title);
}
/** Let the status paint before starting the next synchronous preparation step. */
export async function loadingStep(value:number,title:string,detail:string){
 loadingProgress(value,title,detail);
 await new Promise<void>(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
}
export function loadingFailed(message='遊戲無法啟動，請檢查連線後再試一次。'){
 if(complete)return;
 failed=true;clearTimeout(slow);clearTimeout(retry);
 node('game-loading').dataset.phase='error';node('loading-ready').hidden=true;
 node('loading-title').textContent='暫時無法出發';
 node('loading-detail').textContent=message;
 node('startup-error').textContent='請重新載入，再試一次。';
 node('startup-fallback').hidden=false;
 node('loading-slow').hidden=true;
 node('game-loading').setAttribute('aria-busy','false');
 node('loading-hint').textContent='你的旅程還沒開始';
 startupDiagnostics.fail(message);
}
/** Public ready state keeps the SAME scenic image and overlay.
 * The progress bar becomes the Play button without a page transition. */
export function loadingFinished(holdForPlay=false){
 if(complete||failed)return;
 loadingProgress(100,'風景已就緒','準備好了，出發吧。');
 complete=true;clearTimeout(slow);clearTimeout(retry);clearTimeout(finish);
 startupDiagnostics.finish();
 node('game-loading').setAttribute('aria-busy','false');
 if(holdForPlay){
  node('game-loading').dataset.phase='ready';
  node('loading-title').textContent='準備好了';
  node('loading-ready').hidden=false;
  node('startup-fallback').hidden=true;
  return;
 }
 finish=setTimeout(dismissLoadingSurface,300);
}
function dismissLoadingSurface(){
 clearTimeout(finish);
 node('game-loading').hidden=true;
 node('loading-ready').hidden=true;
 delete document.documentElement.dataset.loading;
}
/** Hide only when the playable road is ready and Play has been accepted. */
export function loadingDismissReady(){
 if(node('game-loading').dataset.phase==='ready')dismissLoadingSurface();
}
