/** Lightweight, opt-in visual telemetry. Updated at 1 Hz, never per frame. */
export interface StreamHealthSample {
  roadReady:number;
  roadDesired:number;
  sceneryReady:number;
  sceneryNearby:number;
  roadAheadM:number;
  roadHeadroomSeconds:number|null;
  atRouteEnd:boolean;
  roadP95Ms:number|null;
  roadSampleCount:number;
  workerPending:string|null;
  workerAgeMs:number|null;
  roadsUnrequested:number;
  sceneryUnrequested:number;
  commitQueue:number;
  retireQueue:number;
  heapUsedBytes:number|null;
  heapLimitBytes:number|null;
  geometries:number;
  textures:number;
  fps:number;
  stalls:number;
}

const clamp=(value:number)=>Math.max(0,Math.min(1,value));
const fmtTime=(seconds:number|null)=>seconds===null||!Number.isFinite(seconds)?'—':seconds>=100?Math.round(seconds)+'s':seconds.toFixed(1)+'s';
const fmtBytes=(bytes:number|null)=>bytes===null||!Number.isFinite(bytes)?'—':(bytes/1048576).toFixed(0)+' MiB';
const ratio=(number:number,total:number)=>total>0?clamp(number/total):0;
export function summarizeStreamHealth(sample:StreamHealthSample){
  const roadRatio=ratio(sample.roadReady,sample.roadDesired);
  const sceneryRatio=ratio(sample.sceneryReady,sample.sceneryNearby);
  // JS heap limit is a JavaScript engine quota, NOT the device RAM limit.
  const memoryRatio=sample.heapUsedBytes!==null&&sample.heapLimitBytes!==null&&sample.heapLimitBytes>0
    ?clamp(sample.heapUsedBytes/sample.heapLimitBytes):null;
  const roadLevel=sample.roadDesired>0&&roadRatio<1?'warn':
    sample.atRouteEnd?'ok':sample.roadHeadroomSeconds===null?'unknown':
    sample.roadHeadroomSeconds<5?'bad':sample.roadHeadroomSeconds<15?'warn':'ok';
  const sceneryLevel=sample.sceneryNearby===0?'unknown':
    sceneryRatio===1?'ok':sceneryRatio<.5?'bad':'warn';
  return {roadRatio,sceneryRatio,memoryRatio,roadLevel,sceneryLevel};
}

type Channel='road'|'scenery'|'memory';
export class StreamHealthHud {
  private root:HTMLElement;
  private cells:Record<Channel,{card:HTMLElement,fill:HTMLElement,value:HTMLElement}>;
  private details:HTMLElement;

  constructor(container:HTMLElement,exportJson:()=>void){
    const root=document.createElement('aside');
    root.id='stream-health-hud';
    root.setAttribute('aria-label','道路串流健康度（開發工具）');
    root.innerHTML=`<div class="sh-title">STREAM HEALTH <span>DEV</span></div>
    <div class="sh-channels">
      <div class="sh-card" data-channel="road" data-state="unknown"><b>R</b><div class="sh-meter"><i></i></div><small>—</small></div>
      <div class="sh-card" data-channel="scenery" data-state="unknown"><b>S</b><div class="sh-meter"><i></i></div><small>—</small></div>
      <div class="sh-card" data-channel="memory" data-state="unknown"><b>M</b><div class="sh-meter"><i></i></div><small>—</small></div>
    </div>
    <pre class="sh-details"></pre>
    <div class="sh-foot"><small>M = JS Heap（不含 Worker/GPU）</small><button type="button" class="sh-export">匯出 JSON</button></div>`;
    const cells={} as StreamHealthHud['cells'];
    for(const channel of ['road','scenery','memory'] as const){
      const card=root.querySelector<HTMLElement>(`[data-channel="${channel}"]`)!;
      cells[channel]={card,fill:card.querySelector<HTMLElement>('.sh-meter i')!,value:card.querySelector('small')!};
    }
    this.cells=cells;
    this.details=root.querySelector<HTMLElement>('.sh-details')!;
    root.querySelector<HTMLButtonElement>('.sh-export')!.onclick=exportJson;
    container.append(root);
    this.root=root;
  }

  update(sample:StreamHealthSample){
    const summarized=summarizeStreamHealth(sample);
    this.fill('road',summarized.roadRatio,summarized.roadLevel,`${sample.roadReady}/${sample.roadDesired}`);
    this.fill('scenery',summarized.sceneryRatio,summarized.sceneryLevel,`${sample.sceneryReady}/${sample.sceneryNearby}`);
    this.fill('memory',summarized.memoryRatio,'unknown',fmtBytes(sample.heapUsedBytes));
    const roadAhead=sample.atRouteEnd?'終點':`${Math.round(sample.roadAheadM)}m / ${fmtTime(sample.roadHeadroomSeconds)}`;
    const p95=sample.roadP95Ms===null?'—':`${Math.round(sample.roadP95Ms)}ms (n=${sample.roadSampleCount})`;
    const pending=sample.workerPending?sample.workerPending+' '+(sample.workerAgeMs===null?'—':(sample.workerAgeMs/1000).toFixed(1)+'s'):'—';
    const rows=[
      `Road ahead ${roadAhead}`,
      `Road Worker P95 ${p95}`,
      `待處理 R${sample.roadsUnrequested} / S${sample.sceneryUnrequested} · Commit ${sample.commitQueue} · 回收 ${sample.retireQueue}`,
      `Worker ${pending} · Stall ${sample.stalls} · FPS ${Math.round(sample.fps)}`,
      `Geometry ${sample.geometries} · Texture ${sample.textures}`
    ];
    const text=rows.join('\n');
    if(this.details.textContent!==text)this.details.textContent=text;
  }

  private fill(channel:Channel,percent:number|null,state:string,label:string){
    const c=this.cells[channel];
    c.card.dataset.state=state;
    c.fill.style.height=percent===null?'0%':`${Math.round(percent*100)}%`;
    c.value.textContent=label;
  }
  dispose(){this.root.remove();}
}
