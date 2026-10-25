import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const root='docs/evidence/v0.5';const read=p=>JSON.parse(readFileSync(`${root}/${p}.json`,'utf8'));
const cases=['medium-full-gas-sweep','high-full-gas-sweep','low-matching','medium-matching','high-matching','extreme-fast','extreme-braked','s-left-s-curve','launch-road-loop'];
const rows=cases.map(name=>{const c=read(`final/${name}`);assert.equal(c.errors.length,0);const {rows,...summary}=c;return {name,...summary,maxYawDegrees:Math.max(...rows.map(s=>Math.abs(s.heading)*180/Math.PI)),initialPreContactSample:rows[0].inputs,allGasAfterFirstContact:rows.slice(1).every(s=>s.inputs.gas),anyBrake:rows.some(s=>s.inputs.brake)};});
for(const r of rows.filter(r=>r.name.includes('full-gas-sweep'))){assert.equal(r.offRoad,0);assert(r.minKmh>=220);assert(r.allGasAfterFirstContact);assert(!r.anyBrake);}
assert(rows.find(r=>r.name==='extreme-fast').offRoad>0);assert(rows.find(r=>r.name==='extreme-fast').maxYawDegrees>50);assert.equal(rows.find(r=>r.name==='extreme-braked').offRoad,0);
const loop=rows.find(r=>r.name==='launch-road-loop');assert(loop.elapsed>=120);assert.equal(loop.offRoad,0);
const physical=read('road-120s');const equivalence=physical.runs.map(r=>({hz:r.hz,elapsed:r.rows.at(-1).state.elapsed,distance:r.rows.at(-1).state.distance,offRoad:r.rows.filter(x=>x.state.offRoad).length}));
writeFileSync(`${root}/final-audit.json`,JSON.stringify({recordings:rows,equivalence,frameProbe:((p)=>({medianMs:p.medianMs,p95Ms:p.p95Ms,frames:p.frames}))(read('frame-probe')),car:read('car-geometry')},null,2));console.log(JSON.stringify({recordings:rows,equivalence},null,2));
