import './l2-lab.css';
import {COAST_STAGE,COAST_RUNTIME_IDENTITY} from './content/coast-stage';
import {COAST_FEEDBACK_STORAGE,COAST_PRAISE,coastReviewKey,coastNote,readCoastReview,exportCoastReview,type CoastReview,type CoastVote} from './content/coast-feedback-data';
import type {FeedbackAnchor,FeedbackEvent,PraiseTag} from './feedback-types';
import type {RecentDrivingHistory} from './recent-history';
import type {PadAction} from './gamepad';

type Origin='keyboard'|'gamepad'|'touch'|'mouse';
type Actions={
 play:()=>void;replay:()=>void;settings:()=>void;sound:()=>void;fullscreen:()=>void;
 capture:()=>FeedbackAnchor;history:RecentDrivingHistory;freeze:()=>void;resume:()=>void;
 onFeedback?:(event:FeedbackEvent)=>void;
};
/** A small coast-only review UI. Its familiar DOM IDs retain existing input,
 * FPS diagnostic and resume hooks; it does not load L2/Pilot/Trip catalogs. */
export function mountCoastReview(actions:Actions){
 let stored='{}';
 try{stored=localStorage.getItem(COAST_FEEDBACK_STORAGE)??'{}';}catch{}
 let review:CoastReview=readCoastReview(stored);
 let open=false,expanded=false,completed:FeedbackAnchor|undefined;
 let pending:FeedbackAnchor|undefined,target:FeedbackAnchor|undefined;
 let kind:'praise'|'issue'='praise',origin:Origin='touch',quick=false;
 let selected:PraiseTag|undefined,offsetIndex=1;
 const offsets=[0,2,4,6,8,12],root=document.querySelector('#app')!;
 const tagButtons=(name:string)=>Object.entries(COAST_PRAISE)
  .map(([id,text])=>'<button type="button" data-'+name+'="'+id+'">'+text+'</button>').join('');
 const panel=document.createElement('section');panel.id='l2-lab';panel.className='l2-lab';
 panel.innerHTML='<div class="l2-heading"><h1>海濱公路 · 試玩回饋</h1></div>'+
  '<div class="l2-columns"><div><h2>'+COAST_STAGE.manifest.name+'</h2>'+
  '<p>'+COAST_RUNTIME_IDENTITY.stageCode+'</p><p id="l2-result"></p>'+
  '<div class="l2-actions"><button id="l2-play" class="primary">Play</button>'+
  '<button id="l2-replay">Replay</button><button id="l2-next" hidden>Next</button></div>'+
  '<div class="l2-actions"><button id="l2-settings">Controls</button>'+
  '<button id="l2-sound">Sound</button><button id="l2-fullscreen">Fullscreen</button></div></div>'+
  '<div><h2>Overall review</h2><div class="l2-actions">'+
  ['KEEP','REWORK','REJECT'].map(v=>'<button type="button" data-l2-vote="'+v+'" aria-pressed="false">'+v+'</button>').join('')+
  '</div><label>難度<select id="l2-difficulty"><option value="">未評分</option>'+
  ['Easy','Moderate','Hard','Very Hard','Godlike'].map((v,i)=>'<option value="'+(i+1)+'">'+(i+1)+' · '+v+'</option>').join('')+
  '</select></label><label>整體意見<input id="l2-note" maxlength="360"></label>'+
  '<div id="l2-end-tags" class="l2-tags" hidden>'+tagButtons('end-tag')+'</div>'+
  '<p id="l2-events"></p><button id="l2-export">Export Feedback JSON</button>'+
  '<p id="l2-save">本機保存，可隨時匯出。</p></div></div>';
 const bar=document.createElement('div');bar.id='l2-feedback-bar';
 bar.innerHTML='<button id="l2-praise">✨ 讚</button><button id="l2-issue">⚑ 問題</button>';
 const hud=document.createElement('div');hud.id='l2-hud';
 const dialog=document.createElement('section');dialog.id='l2-feedback-dialog';
 dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
 dialog.setAttribute('aria-labelledby','l2-feedback-title');dialog.hidden=true;
 dialog.innerHTML='<h2 id="l2-feedback-title"></h2><p id="l2-anchor"></p>'+
  '<div class="l2-history"><button id="l2-older">◀ Earlier [</button><button id="l2-newer">Later ] ▶</button></div>'+
  '<p id="l2-quick-legend">↑ 超好玩 · → 超刺激 · ↓ 有挑戰 · ← 風景優美 · Enter 儲存 · Esc 取消</p>'+
  '<div id="l2-quick-tags" class="l2-tags">'+tagButtons('praise-tag')+'</div>'+
  '<label for="l2-event-note">備註</label><textarea id="l2-event-note" maxlength="360" rows="2"></textarea>'+
  '<p id="l2-event-status" role="status"></p><div class="l2-actions">'+
  '<button id="l2-confirm" hidden>Save praise + Resume</button>'+
  '<button id="l2-save-issue">Save issue + Resume</button>'+
  '<button id="l2-feedback-resume">Resume</button><button id="l2-feedback-cancel">Cancel</button></div>';
 root.append(panel,bar,hud,dialog);
 const el=(id:string)=>document.getElementById(id)!;
 const button=(id:string)=>el(id) as HTMLButtonElement;
 const refresh=()=>{
  panel.querySelectorAll<HTMLButtonElement>('[data-l2-vote]')
   .forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.l2Vote===review.humanVote)));
  (el('l2-difficulty') as HTMLSelectElement).value=review.difficulty?.toString()??'';
  (el('l2-note') as HTMLInputElement).value=review.overallNote;
  el('l2-events').textContent=review.events.filter(e=>e.kind==='praise').length+
   ' praise · '+review.events.filter(e=>e.kind==='issue').length+' issues';
 };
 const save=()=>{
  try{
   let prior:Record<string,unknown>={};
   try{
    const parsed=JSON.parse(localStorage.getItem(COAST_FEEDBACK_STORAGE)??'{}');
    if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))prior=parsed;
   }catch{}
   localStorage.setItem(COAST_FEEDBACK_STORAGE,JSON.stringify({...prior,[coastReviewKey()]:review}));
  }catch{el('l2-save').textContent='儲存失敗，請先匯出回饋資料。';}
  refresh();
 };
 const record=(tag?:PraiseTag)=>{
  if(!pending||!target)return;
  const event:FeedbackEvent={kind,tag,note:coastNote((el('l2-event-note') as HTMLTextAreaElement).value),
   anchor:structuredClone(target),eventAt:structuredClone(target),reactionAt:structuredClone(pending),
   offsetSeconds:Math.max(0,pending.elapsedSeconds-target.elapsedSeconds),inputOrigin:origin};
  review.events.push(event);save();actions.onFeedback?.(event);
 };
 const close=()=>{
  open=false;dialog.hidden=true;pending=target=undefined;
  (document.activeElement as HTMLElement|null)?.blur();
  if(completed)actions.freeze();else actions.resume();
 };
 const showTarget=()=>{
  if(!pending)return;
  target=actions.history.select(pending,offsets[offsetIndex]);
  const seconds=Math.max(0,pending.elapsedSeconds-target.elapsedSeconds);
  el('l2-anchor').textContent='📍 '+seconds.toFixed(1)+' 秒前 · s='+
   target.s.toFixed(1)+' m · '+target.elapsedSeconds.toFixed(2)+' s';
  const rows=actions.history.snapshot(),hasPast=rows.some(r=>r.elapsedSeconds<pending!.elapsedSeconds-.05);
  (dialog.querySelector('.l2-history') as HTMLElement).hidden=!hasPast;
  button('l2-older').disabled=!rows.length||target.elapsedSeconds<=rows[0].elapsedSeconds+.001;
  button('l2-newer').disabled=offsetIndex===0||seconds<.001;
 };
 const shift=(n:number)=>{offsetIndex=Math.max(0,Math.min(offsets.length-1,offsetIndex+n));showTarget();};
 const selectTag=(tag:PraiseTag)=>{
  selected=tag;
  dialog.querySelectorAll<HTMLButtonElement>('[data-praise-tag]')
   .forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.praiseTag===tag)));
 };
 const confirm=()=>{
  if(!selected){el('l2-event-status').textContent='請先選擇評價。';return;}
  record(selected);close();
 };
 const begin=(next:'praise'|'issue',from:Origin='touch')=>{
  if(open)return;
  kind=next;origin=from;quick=from==='keyboard'||from==='gamepad';
  selected=undefined;offsetIndex=1;pending=structuredClone(completed??actions.capture());
  open=true;actions.freeze();showTarget();dialog.hidden=false;dialog.dataset.origin=from;
  panel.hidden=bar.hidden=hud.hidden=true;
  el('l2-feedback-title').textContent=kind==='praise'?'✨ 讚':'⚑ 問題';
  el('l2-quick-tags').hidden=kind!=='praise';
  button('l2-confirm').hidden=kind!=='praise'||!quick;
  button('l2-save-issue').hidden=kind!=='issue';
  button('l2-feedback-resume').hidden=kind==='issue'||quick;
  (el('l2-event-note') as HTMLTextAreaElement).value='';
  el('l2-event-status').textContent='';
  dialog.querySelectorAll<HTMLButtonElement>('[data-praise-tag]')
   .forEach(b=>b.setAttribute('aria-pressed','false'));
  if(kind==='issue'&&from!=='gamepad')el('l2-event-note').focus();
  else dialog.querySelector<HTMLButtonElement>('[data-praise-tag]')?.focus();
 };
 const control=(action:PadAction)=>{
  if(!open)return;
  const tags:Partial<Record<PadAction,PraiseTag>>={
   up:'super_fun',right:'thrilling',down:'hard_but_rewarding',left:'beautiful_scenery'};
  if(kind==='praise'&&tags[action])selectTag(tags[action]!);
  else if(action==='confirm'){if(kind==='praise')confirm();else{record();close();}}
  else if(action==='back')close();
 };
 const originFromClick=(e:MouseEvent):Origin=>
  e.detail===0?'keyboard':e instanceof PointerEvent&&e.pointerType==='touch'?'touch':'mouse';
 button('l2-praise').onclick=e=>begin('praise',originFromClick(e));
 button('l2-issue').onclick=e=>begin('issue',originFromClick(e));
 button('l2-confirm').onclick=confirm;
 button('l2-save-issue').onclick=()=>{record();close();};
 button('l2-feedback-resume').onclick=button('l2-feedback-cancel').onclick=close;
 button('l2-older').onclick=()=>shift(1);
 button('l2-newer').onclick=()=>shift(-1);
 dialog.querySelectorAll<HTMLButtonElement>('[data-praise-tag]').forEach(b=>b.onclick=e=>{
  const tag=b.dataset.praiseTag as PraiseTag;selectTag(tag);
  if(!quick){record(tag);el('l2-event-status').textContent='Saved. Resume when ready.';}
 });
 dialog.addEventListener('keydown',e=>{
  if(e.isComposing)return;
  if(quick&&!(e.target instanceof HTMLElement&&e.target.closest('textarea,input,[contenteditable]'))){
   const keys:Record<string,PadAction>={ArrowUp:'up',ArrowRight:'right',
    ArrowDown:'down',ArrowLeft:'left',Digit1:'up',Digit2:'right',Digit3:'down',Digit4:'left'};
   if(keys[e.code]){e.preventDefault();control(keys[e.code]);return;}
   if(e.code==='BracketLeft'||e.code==='BracketRight'){
    e.preventDefault();shift(e.code==='BracketLeft'?1:-1);return;
   }
   if(e.code==='Enter'||e.code==='Space'){e.preventDefault();if(!e.repeat)control('confirm');return;}
  }
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}
 });
 panel.querySelectorAll<HTMLButtonElement>('[data-l2-vote]').forEach(b=>b.onclick=()=>{
  review.humanVote=b.dataset.l2Vote as CoastVote;save();
 });
 (el('l2-difficulty') as HTMLSelectElement).onchange=e=>{
  const x=(e.target as HTMLSelectElement).value;review.difficulty=x?Number(x):null;save();
 };
 (el('l2-note') as HTMLInputElement).oninput=e=>{
  review.overallNote=coastNote((e.target as HTMLInputElement).value);save();
 };
 panel.querySelectorAll<HTMLButtonElement>('[data-end-tag]').forEach(b=>b.onclick=e=>{
  if(!completed)return;
  pending=completed;target=actions.history.select(completed,2);
  kind='praise';origin=originFromClick(e);record(b.dataset.endTag as PraiseTag);
  pending=target=undefined;
 });
 const exportCurrent=()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(exportCoastReview(review),null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='outrun-trip-feedback.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 button('l2-export').onclick=exportCurrent;
 for(const [id,fn] of [['l2-play',actions.play],['l2-replay',actions.replay],
  ['l2-settings',actions.settings],['l2-sound',actions.sound],
  ['l2-fullscreen',actions.fullscreen]] as const)button(id).onclick=fn;
 // The old route generator's Next action must not change an authored stage.
 button('l2-next').hidden=true;
 refresh();
 return {
  get feedbackOpen(){return open;},get reviewExpanded(){return expanded;},
  setReviewExpanded(value:boolean){expanded=value;panel.classList.toggle('trip-review-drawer',expanded);},
  openQuick:begin,control,exportCurrent,
  complete(anchor:FeedbackAnchor){completed=structuredClone({...anchor,source:'completion'});},
  reset(){completed=undefined;open=false;expanded=false;panel.classList.remove('trip-review-drawer');
   dialog.hidden=true;pending=target=undefined;},
  update(mode:string,settings:boolean,done:boolean,progress:number,elapsed=0){
   if(mode==='playing'||mode==='countdown')expanded=false;
   const drawer=mode==='paused'&&!done&&expanded;
   panel.classList.toggle('trip-review-drawer',drawer);
   panel.hidden=mode==='playing'||settings||open||(mode==='paused'&&!done&&!drawer);
   bar.hidden=mode!=='playing'||settings||open;
   hud.hidden=bar.hidden;
   const total=COAST_STAGE.road.length;
   hud.textContent=COAST_RUNTIME_IDENTITY.stageCode+' · '+Math.floor(progress*total)+
    ' / '+total+' · '+Math.floor(elapsed/60)+':'+String(Math.floor(elapsed%60)).padStart(2,'0');
   button('l2-play').textContent=done?'Play again':mode==='paused'?'Play / resume':'Play';
   el('l2-result').textContent=done?'Finish · Your impressions?':mode==='paused'?'Paused':'Drive the coast';
   el('l2-end-tags').hidden=!completed;
  },
 };
}
