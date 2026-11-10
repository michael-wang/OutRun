/**
 * Opt-in first-load measurements. Enable with ?startupdiag=1.
 * Records timings and readiness gates; deliberately does not change startup scheduling.
 */
export type StartupSnapshot = {
  workerInitialized: boolean;
  farmAssetsLoaded: boolean;
  farmChunksReady: number;
  farmChunksTotal: number;
  farmGpuWarmed: boolean;
  farmWarm: {
    running: boolean;
    done: number;
    total: number;
    elapsedMs: number;
    compileWallMs: number;
    uploadSubmitMs: number;
    maxObjectSubmitMs: number;
    batches: number;
  };
  nearbyCompleted: number;
  nearbyTotal: number;
  natureTexturesPending: number;
  workerPending: {kind: string; index: number; ageMs: number} | null;
  queuedMainTasks: number;
  blockers: string[];
  backgroundTasks?: string[];
  fatal: string;
};

type EventRecord = {ms: number; name: string; data?: unknown};

class FirstLoadDiagnostics {
  readonly enabled = typeof location !== 'undefined' && new URLSearchParams(location.search).get('startupdiag') === '1';
  private readonly startedAt = performance.now();
  private events: EventRecord[] = [];
  private progressValue = 0;
  private progressTitle = '';
  private latest?: StartupSnapshot;
  private lastGateKey = '';
  private lastFrame = 0;
  private gaps = {samples: 0, above50: 0, above100: 0, worstMs: 0};
  private entered98?: number;
  private exited98?: number;
  private completed = false;
  private status?: HTMLElement;
  private panel?: HTMLElement;
  private driving={startedAt:0,lastFrame:0,samples:0,totalMs:0,above33:0,above50:0,above100:0,worstMs:0,maxDrawCalls:0,atRiceSamples:0,atRiceAbove50:0,secondBuckets:[] as {elapsedS:number;distanceM:number;fps:number;maxGapMs:number;drawCalls:number}[]};
  private currentDriveBucket={since:0,frames:0,maxGap:0};

  constructor() {
    if (!this.enabled) return;
    performance.setResourceTimingBufferSize?.(1000);
    this.mark('diagnostics-enabled');
    this.createPanel();
  }

  dispose(){ this.panel?.remove(); }

  private elapsed() { return Math.round((performance.now() - this.startedAt) * 10) / 10; }

  mark(name: string, data?: unknown) {
    if (!this.enabled || this.completed) return;
    this.events.push({ms: this.elapsed(), name, ...(data === undefined ? {} : {data})});
    if (this.events.length > 1200) this.events.shift();
  }

  progress(value: number, title: string) {
    if (!this.enabled || this.completed) return;
    const next = Math.max(this.progressValue, Math.min(100, Math.round(value)));
    if (next !== this.progressValue || title !== this.progressTitle) {
      this.progressValue = next;
      this.progressTitle = title;
      this.mark('progress', {percent: next, title});
      if (next >= 98 && this.entered98 === undefined) {
        this.entered98 = performance.now();
        this.mark('98-percent-enter');
      }
      this.updatePanel();
    }
  }

  frame(now: number) {
    if (!this.enabled || this.completed) return;
    if (this.lastFrame) {
      const gap = now - this.lastFrame;
      this.gaps.samples++;
      this.gaps.worstMs = Math.max(this.gaps.worstMs, gap);
      if (gap > 50) this.gaps.above50++;
      if (gap > 100) this.gaps.above100++;
    }
    this.lastFrame = now;
  }

  sample(snapshot: StartupSnapshot) {
    if (!this.enabled || this.completed) return;
    this.latest = snapshot;
    // Keep timeline readable: record meaningful gate changes and 2-second progress snapshots.
    const key = JSON.stringify({
      blockers: snapshot.blockers,
      chunks: snapshot.nearbyCompleted,
      farmChunks: snapshot.farmChunksReady,
      farmDone: snapshot.farmWarm.done,
      worker: snapshot.workerPending?.kind,
    });
    if (key !== this.lastGateKey) {
      this.lastGateKey = key;
      this.mark('readiness', snapshot);
    }
    this.updatePanel();
  }

  finish() {
    if (!this.enabled || this.completed) return;
    this.exited98 = performance.now();
    this.mark('startup-ready');
    this.completed = true;
    this.updatePanel();
    if (this.panel && this.status) {
      this.status.hidden = true;
      document.body.append(this.panel);
      this.panel.style.cssText = 'position:fixed;right:12px;top:60px;z-index:8000;background:#132e38ed;padding:5px 9px;border-radius:7px;pointer-events:auto';
    }
    console.info('[startupdiag] Ready; use the download button or window.__startupDiagnostics.report()', this.report());
  }

  fail(message: string) {
    if (!this.enabled || this.completed) return;
    this.mark('startup-failed', {message});
    this.updatePanel();
  }

  /** Optional lightweight moving-playtest trace for the first two minutes.
   * Does not run in regular gameplay and never calls the renderer itself.
   */
  drivingFrame(now:number,playing:boolean,distance:number,drawCalls:number){
    if(!this.enabled||!this.completed||!playing)return;
    const d=this.driving;
    if(!d.startedAt){d.startedAt=now;d.lastFrame=now;this.currentDriveBucket={since:now,frames:0,maxGap:0};return;}
    if(now-d.startedAt>120000)return;
    const dt=now-d.lastFrame;d.lastFrame=now;
    if(dt<=0||dt>1000){this.currentDriveBucket.since=now;this.currentDriveBucket.frames=0;return;}
    d.samples++;d.totalMs+=dt;d.worstMs=Math.max(d.worstMs,dt);d.maxDrawCalls=Math.max(d.maxDrawCalls,drawCalls);
    if(dt>33.3)d.above33++;if(dt>50)d.above50++;if(dt>100)d.above100++;
    if(distance>=2300&&distance<=3670){d.atRiceSamples++;if(dt>50)d.atRiceAbove50++;}
    this.currentDriveBucket.frames++;this.currentDriveBucket.maxGap=Math.max(this.currentDriveBucket.maxGap,dt);
    if(now-this.currentDriveBucket.since>=1000){
      d.secondBuckets.push({elapsedS:Math.round((now-d.startedAt)/1000),distanceM:Math.round(distance),fps:Math.round(this.currentDriveBucket.frames*1000/(now-this.currentDriveBucket.since)),maxGapMs:Math.round(this.currentDriveBucket.maxGap*10)/10,drawCalls});
      this.currentDriveBucket={since:now,frames:0,maxGap:0};
    }
  }

  report() {
    const nav = navigator as Navigator & {deviceMemory?: number; connection?: {effectiveType?: string; downlink?: number}};
    const resources = (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
      .filter(e => e.name.includes('/assets/') || e.name.includes('/generated/') || e.name.includes('.js') || e.name.includes('.css') || e.name.includes('.glb') || e.name.includes('worker'))
      .map(e => ({
        path: new URL(e.name).pathname,
        startMs: Math.round(e.startTime),
        durationMs: Math.round(e.duration),
        encodedBytes: e.encodedBodySize,
        transferredBytes: e.transferSize,
      }))
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 150);
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return {
      kind: 'outrun-startup-diagnostic-v3',
      generatedAt: new Date().toISOString(),
      urlPath: location.pathname,
      userAgent: navigator.userAgent,
      deviceMemoryGiB: nav.deviceMemory ?? null,
      hardwareConcurrency: navigator.hardwareConcurrency ?? null,
      connection: nav.connection ? {effectiveType: nav.connection.effectiveType, downlink: nav.connection.downlink} : null,
      viewport: {width: innerWidth, height: innerHeight, dpr: devicePixelRatio},
      timeSinceFirstScriptMs: this.elapsed(),
      navigationResponseMs: navigation ? Math.round(navigation.responseEnd - navigation.requestStart) : null,
      domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
      progress: this.progressValue,
      completed: this.completed,
      timeAt98Ms: this.entered98 === undefined ? null : Math.round(this.entered98 - this.startedAt),
      waitAfter98Ms: this.entered98 === undefined ? null : Math.round((this.exited98 ?? performance.now()) - this.entered98),
      frameGaps: this.gaps,
      drive: {...this.driving,meanFps:this.driving.totalMs>0?Math.round(this.driving.samples*1000/this.driving.totalMs*10)/10:null},
      finalReadiness: this.latest ?? null,
      events: this.events,
      slowestResources: resources,
      limitations: 'Shader compile and tiny upload timings are CPU wall times, not GPU completion time. Browser resource timings and desktop emulation do not equal Pixel 8 GPU profiling.',
    };
  }

  private createPanel() {
    const target = document.querySelector('.loading-copy') ?? document.getElementById('game-loading');
    if (!target) return;
    const panel = document.createElement('div');
    panel.id = 'startup-diagnostic-panel';
    panel.style.cssText = 'margin-top:12px;padding:9px 10px;background:#0d2836db;border:1px solid #ffd19c55;border-radius:8px;max-width:480px;pointer-events:auto';
    const status = document.createElement('div');
    status.style.cssText = 'white-space:pre-line;font:12px/1.35 system-ui;color:#fff1d8;margin-bottom:6px';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '匯出啟動紀錄 JSON';
    button.style.cssText = 'font:12px system-ui;background:#ffd19c;color:#16343c;border:0;border-radius:5px;padding:5px 9px;cursor:pointer';
    button.addEventListener('click', () => this.download());
    panel.append(status, button);
    target.append(panel);
    this.status = status;
    this.panel = panel;
    this.updatePanel();
  }

  private updatePanel() {
    if (!this.status) return;
    const s = this.latest;
    const lines = ['啟動診斷 ' + this.progressValue + '% ｜ ' + (this.elapsed() / 1000).toFixed(1) + ' 秒'];
    if (s) {
      lines.push('道路/景物 ' + s.nearbyCompleted + '/' + s.nearbyTotal + ' ｜ 農田區塊 ' + s.farmChunksReady + '/' + s.farmChunksTotal);
      lines.push('農田GPU預熱 ' + s.farmWarm.done + '/' + s.farmWarm.total + ' ｜ ' + Math.round(s.farmWarm.elapsedMs) + 'ms');
      lines.push('等待：' + (s.blockers.join('、') || '準備完成'));
      if(s.backgroundTasks?.length)lines.push('背景：' + s.backgroundTasks.join('、'));
    } else lines.push('正在建立遊戲場景');
    this.status.textContent = lines.join('\n');
  }

  private download() {
    const data = JSON.stringify(this.report(), null, 2);
    const url = URL.createObjectURL(new Blob([data], {type: 'application/json'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'outrun-startup-' + new Date().toISOString().replaceAll(':', '-') + '.json';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

let current: FirstLoadDiagnostics | undefined;
export function getStartupDiagnostics() {
  if (!current) {
    current = new FirstLoadDiagnostics();
    if (current.enabled) {
      (window as typeof window & {__startupDiagnostics?: FirstLoadDiagnostics}).__startupDiagnostics = current;
    }
  }
  return current;
}
export function endStageDiagnostics() {
  current?.dispose();
  current = undefined;
  delete (window as typeof window & {__startupDiagnostics?: FirstLoadDiagnostics}).__startupDiagnostics;
}
