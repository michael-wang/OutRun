import {ROAD_FEATURE_KINDS,ROAD_FEATURE_LABELS,type RoadFeature,type RoadFeatureKind} from './road-features';
/** Small, explicitly opt-in QA navigator. It never runs in public play. */
export type InspectorKind='clock'|'lighthouse'|'canyon-arch'|'city-grade'|'bridge'|'breakdown'|'junction'|'road-feature';
export interface InspectorStop {
 id:string;kind:InspectorKind;label:string;distance:number;
 landmarkDistance?:number;companions?:number;roadFeature?:RoadFeature;
}
export const INSPECTOR_CATEGORIES:{kind:InspectorKind;label:string}[]=[
 {kind:'clock',label:'鐘塔街區'},{kind:'lighthouse',label:'海岸燈塔'},
 {kind:'canyon-arch',label:'山區地標'},{kind:'city-grade',label:'城市坡度'},
 {kind:'bridge',label:'橋梁兩端'},{kind:'breakdown',label:'故障車'},
 {kind:'junction',label:'匯入／出口'},{kind:'road-feature',label:'道路特徵'},
];
export function canStepBack(distance:number,roadExists:(distance:number)=>boolean,length:number){
 return Number.isFinite(distance)&&distance>=0&&distance<length&&roadExists(distance);
}
export interface ClockAudit {faces:number;companions:number;expected:number}
export function clockAuditPass(report:ClockAudit){return report.faces===1&&report.companions>=report.expected;}
export interface InspectorCallbacks {
 pause():void;jump(distance:number):void;drive():void;
 view(mode:'road'|'side'):void;
 current():number;ready():boolean;roadExists(d:number):boolean;
 clockAudit(stop:InspectorStop):ClockAudit;
}
export class SceneInspector {
 readonly toggle:HTMLButtonElement;
 readonly panel:HTMLElement;
 private readonly info:HTMLElement;
 private readonly status:HTMLElement;
 private readonly audit:HTMLElement;
 private readonly driveButton:HTMLButtonElement;
 private readonly categoryButtons=new Map<InspectorKind,HTMLButtonElement>();
 private readonly featureButtons=new Map<'all'|RoadFeatureKind,HTMLButtonElement>();
 private featureFilter:'all'|RoadFeatureKind='all';
 private kind:InspectorKind='clock';
 private viewMode:'road'|'side'='road';
 private currentIndex=0;
 private previousReady=false;private lastRenderKey='';
 private scanToken=0;private scanSummary='';private scanning=false;
 constructor(private root:HTMLElement,private stops:InspectorStop[],private length:number,
  private callbacks:InspectorCallbacks,private seed:number) {
  this.toggle=document.createElement('button');this.toggle.id='scene-inspector-launcher';
  this.toggle.type='button';this.toggle.textContent='🔎 場景 QA';
  this.toggle.title='鍵盤 Q／PS4 △：開關場景檢查';this.toggle.setAttribute('aria-keyshortcuts','Q');
  this.toggle.dataset.keyHint='Q';this.toggle.dataset.padHint='△';
  this.toggle.addEventListener('click',()=>this.isOpen?this.close():this.open());
  root.append(this.toggle);
  this.panel=document.createElement('section');this.panel.id='scene-inspector';this.panel.hidden=true;
  this.panel.setAttribute('role','dialog');this.panel.setAttribute('aria-label','場景檢查');
  this.panel.innerHTML=`<h2>場景檢查 <small>僅 QA</small></h2>
   <div class="si-categories" id="si-categories"></div>
    <div class="si-feature-filters" id="si-feature-filters" aria-label="道路特徵種類" hidden></div>
   <div class="si-info" id="si-info"></div>
   <div class="si-row">
    <button type="button" data-si="prev">◀ 上一處</button><button type="button" data-si="next">下一處 ▶</button>
   </div>
   <div class="si-row">
    <button type="button" data-si="back">−100m</button><button type="button" data-si="forward">+100m</button>
   </div>
   <div class="si-row" aria-label="觀察視角">
    <button type="button" data-si="view-road" aria-pressed="true">正常視角</button><button type="button" data-si="view-side" aria-pressed="false">側面觀察</button>
   </div>
   <div class="si-status" id="si-status" role="status"></div>
   <div class="si-audit" id="si-audit"></div>
   <div class="si-row"><button type="button" data-si="scan">掃描全部鐘塔配套</button></div>
   <div class="si-row">
    <button type="button" data-si="link">複製檢查網址</button><button type="button" data-si="drive">▶ 試駕</button><button type="button" data-si="close">關閉</button>
   </div>
   <small>快捷鍵：Q／PS4 △ 開關 QA。十字鍵切換、✕ 確認、○ 返回；倒退僅限已載入道路。</small>`;
  root.append(this.panel);
  this.info=this.panel.querySelector('#si-info')!;
  this.status=this.panel.querySelector('#si-status')!;
  this.audit=this.panel.querySelector('#si-audit')!;
  this.driveButton=this.button('drive');
  for(const {kind,label} of INSPECTOR_CATEGORIES){
   const count=this.byKind(kind).length,button=document.createElement('button');
   button.type='button';button.textContent=`${label} (${count})`;
   button.dataset.siCategory=kind;button.disabled=count===0;
   button.addEventListener('click',()=>this.setCategory(kind));
   this.panel.querySelector('#si-categories')!.append(button);this.categoryButtons.set(kind,button);
  }
  // A compact filter is only shown when Road Features is selected.
   for(const kind of ['all',...ROAD_FEATURE_KINDS] as ('all'|RoadFeatureKind)[]){
    const count=this.stops.filter(s=>s.kind==='road-feature'&&(kind==='all'||s.roadFeature?.kind===kind)).length;
    const button=document.createElement('button');
    button.type='button';button.dataset.siFeature=kind;
    button.textContent=`${kind==='all'?'全部':ROAD_FEATURE_LABELS[kind]} (${count})`;
    button.disabled=count===0;button.setAttribute('aria-pressed',String(kind==='all'));
    button.addEventListener('click',()=>this.setFeatureFilter(kind));
    this.panel.querySelector('#si-feature-filters')!.append(button);this.featureButtons.set(kind,button);
   }
   // The left/right controls have real global QA shortcuts; close uses Esc/○.
  for(const [action,key,pad] of [
   ['prev','←','◀'],['next','→','▶'],['close','Esc','○'],
  ]){const button=this.button(action);button.dataset.keyHint=key;button.dataset.padHint=pad;}
  for(const [action,fn] of Object.entries({
   prev:()=>this.step(-1),next:()=>this.step(1),
   back:()=>this.move(-100),forward:()=>this.move(100),
   'view-road':()=>this.setView('road'),'view-side':()=>this.setView('side'),
   scan:()=>{void this.scanAllClocks();},
   link:()=>{void this.copyPosition();},
   drive:()=>{if(this.callbacks.ready()){this.close();this.callbacks.drive();}},
   close:()=>this.close(),
  }))this.button(action).addEventListener('click',fn);
  this.panel.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.close();}
   else if(e.key==='ArrowLeft'){e.preventDefault();this.step(-1);}
   else if(e.key==='ArrowRight'){e.preventDefault();this.step(1);}
  });
  this.setCategory('clock',false);
 }
 private button(name:string){return this.panel.querySelector<HTMLButtonElement>(`[data-si="${name}"]`)!;}
 private byKind(kind:InspectorKind){return this.stops.filter(s=>s.kind===kind&&
  (kind!=='road-feature'||this.featureFilter==='all'||s.roadFeature?.kind===this.featureFilter));}
 private selected(){return this.byKind(this.kind)[this.currentIndex];}
 get isOpen(){return !this.panel.hidden;}
 open(){this.callbacks.pause();this.panel.hidden=false;this.toggle.setAttribute('aria-expanded','true');this.setView('road');this.refresh(true);this.categoryButtons.get(this.kind)?.focus();}
 close(){this.scanToken++;this.scanning=false;this.setView('road');this.panel.hidden=true;this.toggle.setAttribute('aria-expanded','false');this.toggle.focus();}
 private setView(mode:'road'|'side'){
  this.viewMode=mode;
  this.button('view-road').setAttribute('aria-pressed',String(mode==='road'));
  this.button('view-side').setAttribute('aria-pressed',String(mode==='side'));
  this.callbacks.view(mode);
 }
 private setFeatureFilter(filter:'all'|RoadFeatureKind){
  this.featureFilter=filter;this.currentIndex=0;
  for(const [kind,button] of this.featureButtons)button.setAttribute('aria-pressed',String(kind===filter));
  const first=this.selected();
  if(first)this.jumpTo(first.distance);else this.refresh(true);
 }
 private setCategory(kind:InspectorKind,jump=true){
  this.scanToken++;this.scanning=false;this.scanSummary='';this.kind=kind;this.currentIndex=0;
  for(const [k,button] of this.categoryButtons)button.setAttribute('aria-pressed',String(k===kind));
  this.panel.querySelector<HTMLElement>('#si-feature-filters')!.hidden=kind!=='road-feature';
  const site=this.selected();if(site&&jump)this.jumpTo(site.distance);
  else this.refresh(true);
 }
 private step(delta:number){
  const entries=this.byKind(this.kind);
  if(!entries.length)return;
  this.currentIndex=(this.currentIndex+delta+entries.length)%entries.length;
  this.jumpTo(entries[this.currentIndex].distance);
 }
 private move(delta:number){
  const target=Math.round(this.callbacks.current()+delta);
  if(delta<0&&!canStepBack(target,this.callbacks.roadExists,this.length)){
   this.status.textContent='已回收或尚未載入的道路：禁止倒退。';return;
  }
  if(target<0||target>=this.length-10){this.status.textContent='已到旅程邊界。';return;}
  this.jumpTo(target);
 }
 /** May move forward into unloaded chunks. The UI waits for full streamed readiness. */
 jumpTo(distance:number){
  if(!Number.isFinite(distance)||distance<0||distance>=this.length)return;
  this.callbacks.pause();this.callbacks.jump(Math.round(distance));
  this.callbacks.view(this.viewMode);
  this.previousReady=false;this.refresh(true);
 }
 refresh(force=false){
  if(!this.isOpen&&!force)return;
  const ready=this.callbacks.ready(),site=this.selected(),entries=this.byKind(this.kind);
  const distance=Math.round(this.callbacks.current());
  const key=`${ready}:${site?.id??'none'}:${distance}:${this.featureFilter}:${this.scanSummary}`;
  if(!force&&key===this.lastRenderKey)return;
  this.lastRenderKey=key;
  if(force||ready!==this.previousReady){
   this.status.textContent=ready?'✓ 道路與風景已載入，可以試駕。':'正在載入目標道路與風景…';
   this.previousReady=ready;
  }
  this.driveButton.disabled=!ready;
  this.info.textContent=site?`${site.label} · ${this.currentIndex+1}/${entries.length} · 目前 ${distance}m`:`目前 ${distance}m · 無此類場景`;
  if(this.scanSummary){this.audit.textContent=this.scanSummary;return;}
  if(site?.kind==='clock'){
   const atClock=Math.abs(distance-(site.landmarkDistance??site.distance))<300;
   const report=ready&&atClock?this.callbacks.clockAudit(site):null;
   const completed=this.byKind('clock').length;
   this.audit.textContent=report?
    `鐘塔配套：${report.faces} 座鐘面、${report.companions}/${report.expected} 棟建築 · ${clockAuditPass(report)?'✓ 通過':'⚠ 需檢查'}。全路線 ${completed} 座可用上一處／下一處逐一巡檢。`:
    `鐘塔巡檢：全路線 ${completed} 座；每座必須有 3 棟建築。選擇鐘塔位置並載入後檢查實際模型。`;
  }else if(site?.kind==='road-feature'&&site.roadFeature){
    const f=site.roadFeature,scene={city:'城市',coast:'海岸',canyon:'山區'}[f.biome];
    const bearing=f.direction?({'left':'左','right':'右'} as const)[f.direction]:'';
    const detail=f.kind==='merge'||f.kind==='exit'?` · ${f.lanesBefore}→${f.lanesAfter} 車道`:
     f.kind==='s-bends'?` · ${f.turns} 個轉向（${f.pattern}）`:
     f.turnDegrees?` · ${bearing}轉約 ${f.turnDegrees}°`:'';
    this.audit.textContent=`R0 已辨識：${ROAD_FEATURE_LABELS[f.kind]} · ${scene} · ${Math.round(f.start)}–${Math.round(f.end)}m${detail}。僅分類，不修改風景。`;
   }else this.audit.textContent='';
 }
 private async copyPosition(){
  const url=new URL(location.href);
  url.searchParams.set('qa','1');url.searchParams.set('seed',String(this.seed));
  url.searchParams.set('at',String(Math.round(this.callbacks.current())));
  try{await navigator.clipboard.writeText(url.toString());
   this.status.textContent='已複製可重現的場景網址。';
  }catch{this.status.textContent='目前無法複製網址：'+url.toString();}
 }
 /** Automatically visits every generated clock; checks instances actually attached
  * by the streaming worker rather than trusting the landmark plan alone. */
 async scanAllClocks(){
  if(this.scanning)return;
  const clocks=this.byKind('clock'),token=++this.scanToken,failures:string[]=[];
  this.scanning=true;this.kind='clock';this.scanSummary='';this.currentIndex=0;
  for(let i=0;i<clocks.length;i++){
   if(token!==this.scanToken||!this.isOpen)break;
   this.currentIndex=i;
   this.jumpTo(clocks[i].distance);
   this.scanSummary=`正在檢查鐘塔 ${i+1}/${clocks.length}…`;
   this.refresh(true);
   let frames=0;
   while(token===this.scanToken&&!this.callbacks.ready()&&frames<500){
    await new Promise<void>(resolve=>setTimeout(resolve,60));frames++;
   }
   if(token!==this.scanToken||!this.isOpen)break;
   const result=this.callbacks.ready()?this.callbacks.clockAudit(clocks[i]):null;
   if(!result||!clockAuditPass(result))failures.push(`${clocks[i].landmarkDistance??clocks[i].distance}m`);
  }
  if(token!==this.scanToken)return;
  this.scanning=false;
  this.scanSummary=failures.length?
   `⚠ ${clocks.length} 座鐘塔有 ${failures.length} 處未通過：${failures.join('、')}。可用上一處／下一處查看。`:
   `✓ ${clocks.length} 座鐘塔已逐一載入，鐘面與每座 3 棟配套建築均通過。`;
  this.refresh(true);
 }
 /** Routed from the existing standard PS4 controller mapping. */
 control(action:'confirm'|'back'|'pause'|'up'|'down'|'left'|'right'){
  if(!this.isOpen)return false;
  if(action==='back'||action==='pause'){this.close();return true;}
  if(action==='left'){this.step(-1);return true;}
  if(action==='right'){this.step(1);return true;}
  const items=Array.from(this.panel.querySelectorAll<HTMLButtonElement>('button')).filter(b=>!b.disabled&&b.offsetParent!==null);
  if(action==='confirm'){
   const active=document.activeElement as HTMLButtonElement;
   if(items.includes(active))active.click();else items[0]?.focus();
   return true;
  }
  const index=items.indexOf(document.activeElement as HTMLButtonElement);
  const delta=action==='up'?-1:1;
  items[(index<0?0:(index+delta+items.length)%items.length)]?.focus();return true;
 }
 get sites(){return this.stops.slice();}
}
