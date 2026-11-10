import './trip-pause-dock.css';
import {COAST_SHADOW_TECHNIQUES,coastShadowTechniqueSnapshot,type CoastShadowTechnique} from './coast-shadow-techniques';

/** The pause dock has a primary menu and a settings submenu. */
export interface TripPauseActions {
 startFpsTest?:()=>void;
 resume():void;exitToMenu():void;settings():void;
 sound():void;
}
export interface TripShadowAudit {onChange(technique:CoastShadowTechnique,enabled:boolean):void}
export class TripPauseDock {
 readonly element:HTMLElement;
 readonly resumeButton:HTMLButtonElement;
 readonly moreButton:HTMLButtonElement;

 readonly controlsButton:HTMLButtonElement;
 private readonly primary:HTMLElement;
 private readonly options:HTMLElement;
 private readonly title:HTMLElement;
 private expanded=false;
 constructor(root:HTMLElement,actions:TripPauseActions,shadowAudit?:TripShadowAudit){
  const element=document.createElement('aside');this.element=element;
  element.id='trip-pause-dock';element.hidden=true;element.setAttribute('aria-label','暫停操作');
  const shadowMarkup=shadowAudit?
   `<details id="tp-shadow-audit">
    <summary>陰影技術／成本測試 ▸</summary>
    <small>勾選＝啟用這套技術。預期成本是待驗證假設；物件仍全部顯示。</small>
    <div class="tp-shadow-options">
     ${COAST_SHADOW_TECHNIQUES.map(tech=>`<label class="tp-shadow-tech"><input type="checkbox" data-shadow-technique="${tech.id}" ${coastShadowTechniqueSnapshot()[tech.id]?'checked':''}><span><strong>${tech.label}</strong><small>${tech.cost} · 預期：${tech.expected}</small></span></label>`).join('')}
    </div>
    <button id="tp-shadow-reset" type="button">全部開啟</button>
   </details>`:'';
  element.innerHTML=`<h2 class="tp-title">暫停</h2>
   <div class="tp-list" id="tp-primary">
     <button id="tp-resume" type="button">繼續</button>
     <button id="tp-exit" type="button">回到主選單</button>
     <button id="tp-more" type="button" aria-controls="tp-actions">設定</button>
   </div>
   <div class="tp-list" id="tp-actions" hidden>
     <button id="tp-settings" type="button">操作設定</button>
     <button id="tp-sound" type="button" aria-pressed="true">音效　開</button>
     ${shadowMarkup}${actions.startFpsTest?'<button id="tp-fps-test" type="button">開始標準 FPS 測試 · 10＋20 秒</button>':''}
     <button id="tp-back" type="button">返回</button>
   </div>`;
  root.append(element);
  const button=(id:string)=>element.querySelector<HTMLButtonElement>('#'+id)!;
  this.title=element.querySelector('.tp-title')!;
  this.primary=element.querySelector('#tp-primary')!;
  this.options=element.querySelector('#tp-actions')!;
  this.resumeButton=button('tp-resume');
  this.moreButton=button('tp-more');
  this.controlsButton=button('tp-settings');
  for(const [id,key,pad] of [
   ['tp-resume','P','OPTIONS'],['tp-exit','↵','✕'],['tp-more','↵','✕'],
   ['tp-settings','C','✕'],['tp-sound','M','✕'],['tp-back','Esc','○'],
  ]){
   const node=button(id);node.dataset.keyHint=key;node.dataset.padHint=pad;
  }
  this.resumeButton.onclick=actions.resume;
  button('tp-exit').onclick=actions.exitToMenu;
  this.moreButton.onclick=()=>{this.openSettings();this.controlsButton.focus();};
  this.controlsButton.onclick=actions.settings;
  button('tp-back').onclick=()=>{this.collapse();this.moreButton.focus();};
  button('tp-sound').onclick=actions.sound;
  if(actions.startFpsTest)button('tp-fps-test').onclick=actions.startFpsTest;
  if(shadowAudit){
   const inputs=element.querySelectorAll<HTMLInputElement>('input[data-shadow-technique]');
   inputs.forEach(input=>input.addEventListener('change',()=>{
    shadowAudit.onChange(input.dataset.shadowTechnique as CoastShadowTechnique,input.checked);
   }));
   button('tp-shadow-reset').onclick=()=>{
    inputs.forEach(input=>{if(!input.checked){input.checked=true;shadowAudit.onChange(input.dataset.shadowTechnique as CoastShadowTechnique,true);}});
   };
  }
 }
 private setExpanded(value:boolean){
  this.expanded=value;
  this.primary.hidden=value;
  this.options.hidden=!value;
  this.title.textContent=value?'設定':'暫停';
 }
 openSettings(){this.setExpanded(true);}
 collapse(){this.setExpanded(false);}
 setShadowAuditVisible(visible:boolean){
  const node=this.element.querySelector<HTMLDetailsElement>('#tp-shadow-audit');
  if(node){node.hidden=!visible;if(!visible)node.open=false;}
 }
 get isExpanded(){return this.expanded;}
 focusResume(){this.resumeButton.focus();}
 update(paused:boolean,muted:boolean){
  this.element.hidden=!paused;
  const sound=this.element.querySelector<HTMLButtonElement>('#tp-sound')!;
  sound.textContent=muted?'音效　關':'音效　開';
  sound.setAttribute('aria-pressed',String(!muted));
 }
}
