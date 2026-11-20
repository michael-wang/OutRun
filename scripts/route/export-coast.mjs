// Offline only. Run from the repository root with the project's installed dependencies.
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {masterMap} from './master-map.mjs';

const dir = 'docs/route';
const check = process.argv.includes('--check');
const git = (...args) => execFileSync('git', args, {encoding:'utf8'}).trim();
// Scope provenance to runtime/content. A docs-only publication must reproduce its own products.
const trackedInputs = ['src','content','package-lock.json'];
if (git('status','--porcelain','--',...trackedInputs)) {
  throw Error('Commit or isolate changed route inputs before assigning a source revision.');
}
const revision = git('log','-1','--format=%H','--',...trackedInputs);
const dataDate = git('show','-s','--format=%cs',revision);
const provenance = {revision, dataDate};
const round = n => Number(n.toFixed(8));
const degrees = r => r * 180 / Math.PI;
async function output(name, data) {
  const file = dir + '/' + name;
  if (!check) return writeFile(file, data);
  if ((await readFile(file,'utf8')).replaceAll('\r\n','\n') !== data) throw Error('Stale artifact: ' + file);
}
const server = await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',
  logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});
try {
  const load = path => server.ssrLoadModule('/src/' + path + '.ts');
  const {configureKentingCoast} = await load('beach-macro');
  configureKentingCoast(); // Same ordering as main.ts, road-worker.ts and the current shore bake.
  const {coastWorkerRoad} = await load('content/coast-worker-road');
  const {COAST_STAGE:{road,onboarding,direction}} = await load('content/coast-stage');
  const {BEACH2:b} = await load('beach2-profile');
  const {coastBeachX} = await load('coast-layout');
  const {coastBeachHeight,COAST_SEA_LEVEL,COAST_SHORE_OFFSET} = await load('scenery-cross-section');
  const {COAST_SUN} = await load('coast-sun-direction');
  const {requiredSteering} = await load('challenges');
  const {track,halfAt} = coastWorkerRoad();
  const anchors = JSON.parse(await readFile('content/stages/coast/scenic-layout.json','utf8')).heroAnchors;
  for (const anchor of anchors) {
    if (!direction.heroSlots.some(s=>s.id===anchor.id && s.distance===anchor.roadDistance)) throw Error('Hero projection mismatch: '+anchor.id);
  }
  const start = road.startDistance, end = start + road.length;
  const sample = d => {
    const p = track.sample(d);
    return {trackM:d,hudM:d-start,x:p.position.x,y:p.position.y,z:p.position.z,
      headingDeg:degrees(p.roadHeading),curvaturePerM:p.curvature,
      grade:p.tangent.y / Math.hypot(p.tangent.x,p.tangent.z),
      bankDeg:-degrees(Math.atan(p.right.y)),widthM:2*halfAt(d)};
  };
  const rows = [];
  for (let d=start; d<=end; d+=5) rows.push(sample(d));
  if (rows.at(-1).trackM!==end) rows.push(sample(end));
  const csv = [Object.keys(rows[0]).join(','), ...rows.map(r=>Object.values(r).map(round).join(','))].join('\n')+'\n';
  await output('coast-profile.csv',csv);
  const lessons = [...onboarding.lessons,onboarding.accident,...onboarding.driftLessons];
  await output('coast-master-route.svg',masterMap({rows,lessons,anchors,b,turns:road.turns,provenance}));

  // Empirical ordinary-upper envelope, not hard limits. Use physical plan distance in derivative denominators.
  const measures = {absK:[],absGrade:[],absBankDeg:[],deltaKPerM:[],deltaGradePerM:[],deltaBankDegPerM:[]};
  rows.forEach((p,i)=>{
    measures.absK.push(Math.abs(p.curvaturePerM));
    measures.absGrade.push(Math.abs(p.grade));
    measures.absBankDeg.push(Math.abs(p.bankDeg));
    if (i===0) return;
    const last=rows[i-1], ds=Math.hypot(p.x-last.x,p.z-last.z);
    for (const [key,field] of [['deltaKPerM','curvaturePerM'],['deltaGradePerM','grade'],['deltaBankDegPerM','bankDeg']])
      measures[key].push(Math.abs(p[field]-last[field])/ds);
  });
  const calibration = {};
  for (const [key,series] of Object.entries(measures)) {
    series.sort((a,b)=>a-b);
    calibration[key]={p95:round(series[Math.ceil(series.length*.95)-1]),max:round(series.at(-1))};
  }
  calibration.steerAtUnitCurvature = Object.fromEntries([100,200,250].map(kmh=>[kmh,round(requiredSteering(1,kmh/3.6))]));
  const entry = sample(b.core), angle=entry.headingDeg*Math.PI/180;
  function port(d) {
    const s=sample(d), dx=s.x-entry.x, dz=s.z-entry.z, rightY=track.sample(d).right.y;
    const offsets = [-100,coastBeachX(COAST_SHORE_OFFSET,d),-11,11,55,150];
    return {referenceTrackM:d,localStationM:d-b.core,world:Object.fromEntries(Object.entries(s).map(([k,v])=>[k,round(v)])),
      local:{rightM:round(-dx*Math.cos(angle)-dz*Math.sin(angle)),upM:round(s.y-entry.y),
        forwardM:round(-dx*Math.sin(angle)+dz*Math.cos(angle)),headingDeg:round(s.headingDeg-entry.headingDeg)},
      lanes:road.lanes,laneWidthM:round(s.widthM/road.lanes),shoreLateralM:round(offsets[1]),seaWorldY:COAST_SEA_LEVEL,
      terrainSamples:offsets.map(x=>({lateralM:round(x),worldY:round(coastBeachHeight(x,s.y,rightY,d))}))};
  }
  const draft = {provenance,status:'Proposed core ports; surrounding approach and exit are shared dependencies',
    id:'kenting-beach',displayName:'Kenting swimming beach',localLengthM:b.length,coreLocalM:[0,b.length],
    environment:'left sea / right inland ridge',assetPackages:['kenting-beach'],
    requiredSceneLayers:['beach2-macro and production batches','water-following swimmers','cape path and gull flights'],
    placement:{fixedWorldSun:COAST_SUN.toArray().map(round),seaWorldY:COAST_SEA_LEVEL,
      protectedViews:['right mountain reveal','sunlit left swimming bay','distant tower approaching the connected cape'],
      relocatedVisibility:'UNKNOWN'},entry:port(b.core),exit:port(b.core+b.length),calibration};
  await output('kenting-ports.json',JSON.stringify(draft,null,2)+'\n');
  console.log(check?'Artifacts match':'Artifacts written',rows.length,revision,JSON.stringify(calibration));
} finally { await server.close(); }
