import './trip-pause-dock.css';

/** Road Trip pause controls stay in the corner; full reviews are explicitly opt-in. */
export interface TripPauseActions {
 resume():void;replay():void;newRoute():void;settings():void;
 sound():void;fullscreen():void;review():void;
}
export class TripPauseDock {
 readonly element:HTMLElement;
 readonly resumeButton:HTMLButtonElement;
 readonly moreButton:HTMLButtonElement;
 readonly reviewButton:HTMLButtonElement;
 private readonly options:HTMLElement;
 private expanded=false;
 constructor(root:HTMLElement,actions:TripPauseActions,reviewAvailable:boolean){
  const element=document.createElement('aside');this.element=element;
  element.id='trip-pause-dock';element.hidden=true;element.setAttribute('aria-label','暫停操作');
  element.innerHTML=`<div class="tp-top">
    <span class="tp-indicator">Ⅱ 暫停</span>
    <button id="tp-resume" type="button">▶ 繼續</button>
    <button id="tp-more" type="button" aria-expanded="false" aria-controls="tp-actions">☰ 功能</button>
   </div>
   <div id="tp-actions" hidden>
    <button id="tp-replay" type="button">↻ 重新開始</button>
    <button id="tp-new-route" type="button">新路線</button>
    <button id="tp-settings" type="button">操作設定</button>
    <button id="tp-sound" type="button">音效開</button>
    <button id="tp-fullscreen" type="button">全螢幕</button>
    <button id="tp-review" type="button" aria-expanded="false">評分／匯出</button>
   </div>`;
  root.append(element);
  const button=(id:string)=>element.querySelector<HTMLButtonElement>('#'+id)!;
  this.resumeButton=button('tp-resume');this.moreButton=button('tp-more');
  this.reviewButton=button('tp-review');this.options=element.querySelector('#tp-actions')!;
  this.reviewButton.hidden=!reviewAvailable;
  this.resumeButton.onclick=actions.resume;
  this.moreButton.onclick=()=>this.setExpanded(!this.expanded);
  button('tp-replay').onclick=actions.replay;
  button('tp-new-route').onclick=actions.newRoute;
  button('tp-settings').onclick=actions.settings;
  button('tp-sound').onclick=actions.sound;
  button('tp-fullscreen').onclick=actions.fullscreen;
  this.reviewButton.onclick=actions.review;
 }
 private setExpanded(value:boolean){
  this.expanded=value;this.options.hidden=!value;
  this.moreButton.setAttribute('aria-expanded',String(value));
  this.moreButton.textContent=value?'收起':'☰ 功能';
 }
 collapse(){this.setExpanded(false);}
 get isExpanded(){return this.expanded;}
 focusResume(){this.resumeButton.focus();}
 update(paused:boolean,muted:boolean,reviewOpen=false){
  this.element.hidden=!paused;if(!paused)this.collapse();
  (this.element.querySelector('#tp-sound') as HTMLButtonElement).textContent=muted?'音效關':'音效開';
  this.reviewButton.textContent=reviewOpen?'收起評分':'評分／匯出';
  this.reviewButton.setAttribute('aria-expanded',String(reviewOpen));
 }
}
