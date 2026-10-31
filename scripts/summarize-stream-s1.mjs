import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const root='docs/evidence/streaming-s1';
const load=p=>JSON.parse(existsSync(p)?readFileSync(p,'utf8'):gunzipSync(readFileSync(p+'.gz')).toString());
const range=a=>({min:Math.min(...a),mean:a.reduce((n,v)=>n+v,0)/a.length,max:Math.max(...a)});
const summary=[];
for(const seed of [1,2,7]){
 const j=load(`${root}/journey-${seed}.json`),rows=j.rows,last=rows.at(-1),d=last.diagnostic,l=d.lifecycle;
 const moving=rows.filter(r=>r.state.speed>1&&r.state.distance<r.state.length-1000);
 const missing=rows.filter(r=>r.diagnostic.lifecycle.nearby.some(c=>c.scenery!=='ready'));
 const currentMissing=rows.filter(r=>r.diagnostic.lifecycle.chunks.some(c=>c.index===Math.floor(r.state.distance/1000)&&c.scenery!=='ready'));
 const mismatch=rows.flatMap(r=>r.diagnostic.lifecycle.chunks.filter(c=>c.scenery==='ready'&&c.attachedInstances!==c.generatedInstances).map(c=>({distance:r.state.distance,...c})));
 const queueKeys=Object.keys(l.queues),queuePeaks=Object.fromEntries(queueKeys.map(k=>[k,Math.max(...rows.map(r=>r.diagnostic.lifecycle.queues[k]))]));
 summary.push({seed,finished:j.finished,wallSeconds:j.wallSeconds,elapsed:last.state.elapsed,peakKmh:last.audit.maxSpeed,frames:last.audit.frames,missingRoad:last.audit.missing,unsafeAdvance:last.audit.unsafeAdvance,frozenMutation:last.audit.frozenMutation,stalls:d.stalls,waitMs:d.waitMs,errors:j.errors,workerErrors:d.stream.errors,distributions:l.distributions,roadHeadroomAllSamples:range(rows.map(r=>r.diagnostic.lifecycle.roadHeadroomSeconds).filter(x=>x!==null)),roadHeadroomBeforeFinalWindow:range(moving.filter(r=>r.state.distance<r.state.length-5000).map(r=>r.diagnostic.lifecycle.roadHeadroomSeconds)),roadHeadroomSeconds:range(moving.map(r=>r.diagnostic.lifecycle.roadHeadroomSeconds)),roadAheadM:range(moving.map(r=>r.diagnostic.lifecycle.roadAheadM)),fps:range(rows.slice(5).map(r=>r.diagnostic.fps)),queuePeaks,nearbyNotReadySamples:missing.length,currentNotReadySamples:currentMissing.length,firstNearbyNotReady:missing[0]?{distance:missing[0].state.distance,elapsed:missing[0].state.elapsed,nearby:missing[0].diagnostic.lifecycle.nearby}:null,readyCountMismatches:mismatch,draws:range(rows.map(r=>r.diagnostic.draws)),geometries:range(rows.map(r=>r.diagnostic.memory.geometries)),heapMiB:range(rows.map(r=>r.diagnostic.memory.heap/1048576)),lastHeapMiB:d.memory.heap/1048576,discardedResponses:l.discardedResponses,discardedTasks:l.discardedTasks,near162:rows.reduce((best,r)=>Math.abs(r.state.elapsed-162)<Math.abs(best.state.elapsed-162)?r:best).state});
}
writeFileSync(`${root}/journey-summary.json`,JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
