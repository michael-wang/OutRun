// The loading surface lives in HTML so it also covers module downloads.
let progress=0,complete=false,failed=false;
const node=(id:string)=>document.getElementById(id)!;
const slow=setTimeout(()=>{node('loading-slow').hidden=false;},15000);
const retry=setTimeout(()=>{node('startup-fallback').hidden=false;},45000);

export function loadingProgress(value:number,title:string,detail:string){
 if(complete||failed)return;
 progress=Math.max(progress,Math.min(100,Math.round(value)));
 node('loading-fill').style.transform=`scaleX(${progress/100})`;
 node('loading-percent').textContent=`${progress}%`;
 node('loading-track').setAttribute('aria-valuenow',String(progress));
 node('loading-track').setAttribute('aria-valuetext',`${title}，準備進度 ${progress}%`);
 if(node('loading-title').textContent!==title)node('loading-title').textContent=title;
 node('loading-detail').textContent=detail;
}
/** Let the status paint before starting the next synchronous preparation step. */
export async function loadingStep(value:number,title:string,detail:string){
 loadingProgress(value,title,detail);
 await new Promise<void>(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
}
export function loadingFailed(message='遊戲無法啟動，請檢查連線後再試一次。'){
 if(complete)return;
 failed=true;clearTimeout(slow);clearTimeout(retry);
 node('loading-title').textContent='暫時無法出發';
 node('loading-detail').textContent=message;
 node('startup-error').textContent='請重新載入，再試一次。';
 node('startup-fallback').hidden=false;
 node('loading-slow').hidden=true;
 node('game-loading').setAttribute('aria-busy','false');
 node('loading-hint').textContent='你的旅程還沒開始';
}
export function loadingFinished(){
 if(complete||failed)return;
 loadingProgress(100,'風景已就緒','準備好了，出發吧。');
 complete=true;clearTimeout(slow);clearTimeout(retry);
 node('game-loading').setAttribute('aria-busy','false');
 setTimeout(()=>{
  node('game-loading').hidden=true;
  delete document.documentElement.dataset.loading;
 },300);
}
