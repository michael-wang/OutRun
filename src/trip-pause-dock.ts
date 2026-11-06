import './trip-pause-dock.css';
import {COAST_SHADOW_TECHNIQUES,coastShadowTechniqueSnapshot,type CoastShadowTechnique} from './coast-shadow-techniques';

/** Road Trip pause controls stay in the corner; full reviews are explicitly opt-in. */
export interface TripPauseActions {
 resume():void;replay():void;settings():void;
 sound():void;fullscreen():void;review():void;
}
export interface TripShadowAudit {onChange(technique:CoastShadowTechnique,enabled:boolean):void}
export class TripPauseDock {
 readonly element:HTMLElement;
 readonly resumeButton:HTMLButtonElement;
 readonly moreButton:HTMLButtonElement;
 readonly reviewButton:HTMLButtonElement;
 private readonly options:HTMLElement;
 private expanded=false;
 private reviewOpen=false;
 constructor(root:HTMLElement,actions:TripPauseActions,reviewAvailable:boolean,shadowAudit?:TripShadowAudit){
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
  element.innerHTML=`<div class="tp-top">
    <span class="tp-indicator">Ⅱ 暫停</span>
    <button id="tp-resume" type="button">▶ 繼續</button>
    <button id="tp-more" type="button" aria-expanded="false" aria-controls="tp-actions">☰ 功能</button>
   </div>
   <div id="tp-actions" hidden>
    <button id="tp-replay" type="button">↻ 再玩一次</button>
    <button id="tp-settings" type="button">操作設定</button>
    <button id="tp-sound" type="button">音效開</button>
    <button id="tp-fullscreen" type="button">全螢幕</button>
    <button id="tp-review" type="button" aria-expanded="false">評分／匯出</button>
   </div>${shadowMarkup}`;
  root.append(element);
  const button=(id:string)=>element.querySelector<HTMLButtonElement>('#'+id)!;
  this.resumeButton=button('tp-resume');this.moreButton=button('tp-more');
  this.reviewButton=button('tp-review');this.options=element.querySelector('#tp-actions')!;
  this.reviewButton.hidden=!reviewAvailable;
  // Only show keys that actually work. PS4 ✕ means confirm the focused control.
  for(const [id,keyboard,pad] of [
   ['tp-resume','P','OPTIONS'],['tp-more','↵','✕'],
   ['tp-replay','R','✕'],
   ['tp-settings','C','✕'],['tp-sound','M','✕'],
   ['tp-fullscreen','F','SHARE'],['tp-review','V','✕'],
  ]){const node=button(id);node.dataset.keyHint=keyboard;node.dataset.padHint=pad;
   if(keyboard!=='↵')node.setAttribute('aria-keyshortcuts',keyboard);
  }
  this.resumeButton.onclick=actions.resume;
  this.moreButton.onclick=()=>{if(this.reviewOpen)actions.review();else this.setExpanded(!this.expanded);};
  button('tp-replay').onclick=actions.replay;
  button('tp-settings').onclick=actions.settings;
  button('tp-sound').onclick=actions.sound;
  button('tp-fullscreen').onclick=actions.fullscreen;
  this.reviewButton.onclick=actions.review;
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
  this.expanded=value;this.options.hidden=!value;
  this.moreButton.setAttribute('aria-expanded',String(value));
  this.moreButton.textContent=value?'收起':'☰ 功能';
 }
 collapse(){this.setExpanded(false);}
 setShadowAuditVisible(visible:boolean){
  const node=this.element.querySelector<HTMLDetailsElement>('#tp-shadow-audit');
  if(node){node.hidden=!visible;if(!visible)node.open=false;}
 }
 get isExpanded(){return this.expanded;}
 focusResume(){this.resumeButton.focus();}
 update(paused:boolean,muted:boolean,reviewOpen=false){
  this.element.hidden=!paused;this.reviewOpen=reviewOpen;
  if(!paused||reviewOpen)this.collapse();
  if(!paused){const audit=this.element.querySelector<HTMLDetailsElement>('#tp-shadow-audit');if(audit)audit.open=false;}
  (this.element.querySelector('#tp-sound') as HTMLButtonElement).textContent=muted?'音效關':'音效開';
  this.moreButton.textContent=reviewOpen?'收起評分':this.expanded?'收起':'☰ 功能';
  this.moreButton.setAttribute('aria-expanded',String(reviewOpen||this.expanded));
  this.reviewButton.textContent='評分／匯出';
  this.reviewButton.setAttribute('aria-expanded',String(reviewOpen));
 }
}
