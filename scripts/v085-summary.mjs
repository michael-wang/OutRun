import {readFile,writeFile} from 'node:fs/promises';
const root='docs/evidence/v0.8.5',baseline=JSON.parse(await readFile(`${root}/baseline.json`,'utf8')),rows=[];
const stats=values=>{const a=values.slice().sort((x,y)=>x-y);return {count:a.length,p50:a[Math.floor(a.length*.5)]??null,p95:a[Math.floor(a.length*.95)]??null,p99:a[Math.floor(a.length*.99)]??null,max:a.at(-1)??null};};
for(const seed of [1,2,3]){
 const d=JSON.parse(await readFile(`${root}/stream-seed-${seed}-budgeted-report.json`,'utf8')),old=baseline.find(x=>x.seed===seed),frames=d.frames.filter(x=>x.t>=d.driveStartedAt),history=d.stream.history;
 const byKind={};for(const kind of ['road-cpu','scenery-cpu','main-commit','gpu-upload-submit'])byKind[kind]=stats(history.filter(x=>x.kind===kind).map(x=>x.ms));
 const uploads={};for(const e of history.filter(x=>x.kind==='gpu-upload-submit'))uploads[e.index]=(uploads[e.index]??0)+e.ms;
 const missing=d.resources.filter(r=>{const first=Math.floor(r.s/1000),last=Math.min(Math.ceil(d.state.trackLength/1000)-1,first+2);return Array.from({length:last-first+1},(_,i)=>first+i).some(i=>!r.chunks.some(c=>c.index===i&&c.road==='ready'));});
 rows.push({seed,stageCode:d.stage.stageCode,baselineReadyMs:old.ready,readyMs:d.readyMs,baselineFrame:stats(old.frames),drivingFrame:stats(frames.map(x=>x.ms)),drivingFramesAtLeast50ms:frames.filter(x=>x.ms>=50),wallSeconds:d.wallSeconds,simulatedSeconds:d.state.elapsed,gpuTimerAvailable:d.gpuTimerAvailable,workerAndSubmissionCosts:byKind,uploadSubmissionMsByChunk:uploads,rendererGeometry:stats(d.resources.map(x=>x.memory.geometries)),rendererTextures:stats(d.resources.map(x=>x.memory.textures)),maxActiveChunks:Math.max(...d.resources.map(x=>x.chunks.length)),nearRoadNotReadySamples:missing.length,errors:d.errors});
}
await writeFile(`${root}/performance-summary.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows,null,2));
