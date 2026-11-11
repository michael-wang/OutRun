import {landscapeControl} from './immersive';
import { GamepadInput, type PadAction } from './gamepad';
import { InputLatch } from './input';
import { renderMiniatures } from './racing-miniatures';
import { stages, type RacingStage } from './racing-stages';

export async function mountMenu(enter: (stage: RacingStage) => void, waitForEntry: () => Promise<void>) {
  const menu=document.createElement('main');
  menu.id='racing-menu';
  menu.innerHTML=`
    <header class="cabinet-header">
      <div class="cabinet-logo"><strong lang="en">OUTRUN</strong><span>極速漫遊</span></div>
      <div class="mode-mark"><i></i> ARCADE RACING</div>
    </header>
    <div class="stage-heading"><h1 lang="en">STAGE SELECT</h1><span>選擇賽道</span></div>
    <div class="stage-grid" role="group" aria-label="賽道">
      ${stages.map((s,i)=>`<button class="mini-stage" type="button" data-stage="${s.id}" aria-label="${s.name}，${s.enter?'可競速':'製作中'}">
        <span class="model-view"><canvas aria-hidden="true"></canvas></span>
        <span class="stage-caption"><span class="serial">0${i+1}</span><span class="stage-names">
        <strong>${s.name}</strong><small lang="en">${s.english}</small></span></span>
        <span class="stage-status">${s.enter?'可競速':'製作中'}</span>
      </button>`).join('')}
    </div>
    <footer class="cabinet-footer"><div class="stage-index" aria-hidden="true"><i></i><b>01</b> / 03</div>
      <button id="start-race" type="button"><span>開始競速</span><em aria-hidden="true">»</em></button>
    </footer>
    <span class="racing-sr" role="status" aria-live="polite"></span>`;
  const buttons=Array.from(menu.querySelectorAll<HTMLButtonElement>('.mini-stage'));
  renderMiniatures(stages,buttons.map(button=>button.querySelector('canvas')!));
  await waitForEntry();
  menu.querySelector('.cabinet-footer')!.prepend(landscapeControl());
  const start=menu.querySelector<HTMLButtonElement>('#start-race')!;
  const status=menu.querySelector<HTMLElement>('.racing-sr')!;
  const events=new AbortController();
  let selected=0, closed=false, frame=0;
  function select(index:number,focus=false) {
    selected=(index+stages.length)%stages.length;
    buttons.forEach((button,i)=>{
      button.setAttribute('aria-pressed',String(selected===i));
      button.tabIndex=selected===i?0:-1;
    });
    const stage=stages[selected];
    start.setAttribute('aria-disabled',String(!stage.enter));
    start.querySelector('span')!.textContent=stage.enter?'開始競速':'製作中';
    menu.querySelector('.stage-index b')!.textContent=String(selected+1).padStart(2,'0');
    status.textContent='';
    if(focus)buttons[selected].focus({preventScroll:true});
  }
  function confirm() {
    if(closed)return;
    const stage=stages[selected];
    if(!stage.enter){
      const message=stage.name+'製作中';
      status.textContent=message;
      start.querySelector('span')!.textContent=message;
      return;
    }
    closed=true;
    events.abort();cancelAnimationFrame(frame);pad.dispose();menu.remove();
    enter(stage);
  }
  function navigate(action: PadAction) {
    if(action==='left'||action==='right')select(selected+(action==='left'?-1:1),true);
    if(action==='confirm')confirm();
  }
  const pad=new GamepadInput(new InputLatch(),navigate);
  function poll() {
    frame=0;
    pad.poll('stage-menu');
    if(!closed)frame=requestAnimationFrame(poll);
  }
  function syncGamepads() {
    cancelAnimationFrame(frame);
    frame=0;
    try {
      if(!closed&&!document.hidden&&Array.from(navigator.getGamepads?.()??[]).some(p=>p?.connected))
        frame=requestAnimationFrame(poll);
    } catch { /* Some embedded browsers block the Gamepad API. */ }
  }
  for(const event of ['gamepadconnected','gamepaddisconnected'])window.addEventListener(event,syncGamepads,{signal:events.signal});
  document.addEventListener('visibilitychange',syncGamepads,{signal:events.signal});
  window.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Enter'].includes(e.key)||e.isComposing||e.altKey||e.ctrlKey||e.metaKey)return;
    if(e.key==='Enter' && (e.target as HTMLElement)?.closest('.landscape-control'))return;
    e.preventDefault();
    if(!e.repeat)navigate(e.key==='Enter'?'confirm':e.key==='ArrowLeft'?'left':'right');
  },{signal:events.signal});
  buttons.forEach((button,i)=>button.onclick=()=>select(i));
  start.onclick=confirm;
  select(0);
  document.body.append(menu);
  syncGamepads();
}
