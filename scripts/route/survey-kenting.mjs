// Offline R1 comparison. Supply a separate, unmodified checkout of the accepted R0 tree.
// Usage: node scripts/route/survey-kenting.mjs <reference-root> <output-folder> [original|relocated]
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createServer} from 'vite';
import {assessConnector} from './check-connector.mjs';
import {masterMap} from './master-map.mjs';
import {relocationPlan} from './relocation-plan.mjs';

const [referenceRoot,outDir,mode='original']=process.argv.slice(2);
if(!referenceRoot||!outDir||!['original','relocated'].includes(mode))
  throw Error('Specify accepted reference checkout, output folder and original or relocated.');
const base=resolve(referenceRoot),candidate=process.cwd();
assert.notEqual(base.toLowerCase(),candidate.toLowerCase(),'The reference must be an independent checkout.');
const degrees=x=>x*180/Math.PI;
const angle=(a,b)=>degrees(Math.atan2(Math.sin((a-b)*Math.PI/180),Math.cos((a-b)*Math.PI/180)));
const round=n=>Number(n.toFixed(8));
const git=(root,...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const capture='67913f853693ae8a5a83a930d3f07c355ce7f3a8';
assert.equal(git(base,'rev-parse','HEAD'),capture,'Reference checkout must be the accepted R0 checkpoint.');
assert.equal(git(base,'status','--porcelain','--','src','content','package-lock.json'),'','Reference source has local edits.');
const curves=['headingDeg','curvaturePerM','grade','bankDeg','widthM'];
const shoreOffsets=[-150,-100,-80,-55,-35,-22,-14,-11,-8.75,0,8.75,11,14,25,55,100,150,250];
const services=[];

async function runtime(root,variant) {
  const server=await createServer({root,configFile:false,server:{middlewareMode:true,watch:null,hmr:false,ws:false},
    define:{'import.meta.env.VITE_KENTING_INSTALLATION':JSON.stringify(variant)},
    appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});
  services.push(server);
  const load=name=>server.ssrLoadModule('/src/'+name+'.ts');
  (await load('beach-macro')).configureKentingCoast();
  const {track,halfAt}=(await load('content/coast-worker-road')).coastWorkerRoad();
  const {COAST_STAGE:stage}=await load('content/coast-stage');
  const {BEACH2:beach,BEACH2_INCIDENT_SIGHTLINE:accident}=await load('beach2-profile');
  const {coastBeachX,coastDriveBounds,coastVisibleBarrierStyle}=await load('coast-layout');
  const {coastBeachHeight,COAST_SEA_LEVEL,COAST_SHORE_OFFSET}=await load('scenery-cross-section');
  const {COAST_SUN}=await load('coast-sun-direction');
  const {coastHillHeight}=await load('coast-terrain');
  const handling=await load('handling');
  const sun=COAST_SUN.toArray(),sunHeading=degrees(Math.atan2(-sun[0],sun[2]));
  function sample(d){
    const {position,tangent,right,roadHeading,curvature}=track.sample(d);
    const headingDeg=degrees(roadHeading),half=halfAt(d),bounds=coastDriveBounds(d,half);
    const shoreM=coastBeachX(COAST_SHORE_OFFSET,d);
    const ground=x=>coastBeachHeight(x,position.y,right.y,d);
    return {trackM:d,hudM:d-stage.road.startDistance,x:position.x,y:position.y,z:position.z,
      headingDeg,curvaturePerM:curvature,grade:tangent.y/Math.hypot(tangent.x,tangent.z),bankDeg:-degrees(Math.atan(right.y)),
      widthM:2*half,shoreM,shoreY:ground(shoreM),seaY:COAST_SEA_LEVEL,ground,driveLeftM:bounds.left,driveRightM:bounds.right,
      barrier:[coastVisibleBarrierStyle(d,-1),coastVisibleBarrierStyle(d,1)],sunBearingDeg:angle(sunHeading,headingDeg)};
  }
  return {sample,stage,beach,accident,sun,seaY:COAST_SEA_LEVEL,hill:coastHillHeight,handling,load};
}
function update(max,key,amount,track,offset){
  if(!Number.isFinite(amount))throw Error('Nonfinite '+key+' at '+track);
  if(!max[key]||amount>max[key].value)max[key]={value:amount,trackM:track,...(offset===undefined?{}:{offsetM:offset})};
}
const horizontal=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const fields=['trackM','hudM','x','y','z',...curves,'shoreM','shoreY','driveLeftM','driveRightM','sunBearingDeg'];
const csv=rows=>[fields.join(','),...rows.map(row=>fields.map(f=>round(row[f])).join(','))].join('\n')+'\n';
const range=(a,b,step)=>Array.from({length:1+Math.floor((b-a)/step+1e-9)},(_,i)=>a+i*step);
function compare(a,b,distances,shift=0,translation=[0,0,0]) {
  const max={},mismatchedBarrier=[];
  for(const d of distances) {
    const p=a.sample(d),q=b.sample(d+shift);
    update(max,'positionM',Math.hypot(q.x-p.x-translation[0],q.y-p.y-translation[1],q.z-p.z-translation[2]),d);
    for(const key of [...curves,'shoreM','shoreY','driveLeftM','driveRightM','sunBearingDeg'])
      update(max,key,Math.abs(key==='headingDeg'||key==='sunBearingDeg'?angle(p[key],q[key]):p[key]-q[key]),d);
    for(const x of [...shoreOffsets,p.shoreM-1,p.shoreM+1])
      update(max,'groundY',Math.abs(q.ground(x)-p.ground(x)),d,x);
    if(p.barrier.join('/')!==q.barrier.join('/'))mismatchedBarrier.push(d);
  }
  return {samples:distances.length,absoluteMax:max,barrierMismatchStations:mismatchedBarrier};
}
function seam(model,d) {
  const epsilon=.001,p=model.sample(d-epsilon),q=model.sample(d+epsilon);
  const groundAcross=shoreOffsets.map(x=>({offsetM:x,deltaM:Math.abs(q.ground(x)-p.ground(x))}));
  return {trackM:d,hudM:p.hudM+epsilon,epsilonM:epsilon,
    acrossPositionM:Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z),
    acrossHeadingDeg:Math.abs(angle(q.headingDeg,p.headingDeg)),acrossK:Math.abs(q.curvaturePerM-p.curvaturePerM),
    acrossGrade:Math.abs(q.grade-p.grade),acrossBankDeg:Math.abs(q.bankDeg-p.bankDeg),acrossWidthM:Math.abs(q.widthM-p.widthM),
    acrossShoreM:Math.abs(q.shoreM-p.shoreM),maxGroundAcross:groundAcross.sort((a,b)=>b.deltaM-a.deltaM)[0]};
}
function stats(values) {
  const s=values.toSorted((a,b)=>a-b);
  return {p95:s[Math.ceil(.95*s.length)-1],max:s.at(-1)};
}
// Road-centred, terrain-only sight-distance diagnostic. Intersect each sight ray with
// the sampled road's transverse planes. Parked traffic, vegetation, near weather
// and camera smoothing still need the independent normal-chase test.
function terrainSight(model,station) {
  const eyeAt=model.sample(station),h=eyeAt.headingDeg*Math.PI/180;
  const fx=-Math.sin(h),fz=Math.cos(h),grade=eyeAt.grade,len=Math.hypot(1,grade);
  const eye={x:eyeAt.x+fx*(-8-2.6*grade)/len,y:eyeAt.y+(-8*grade+2.6)/len,z:eyeAt.z+fz*(-8-2.6*grade)/len};
  let clearTo=0,firstObstruction=null;
  const cross=range(station-8,station+260,2).map(model.sample);
  for(let ahead=10;ahead<=250;ahead+=10){
    const target=model.sample(station+ahead),rx=target.x-eye.x,rz=target.z-eye.z,ry=target.y+.8-eye.y;
    for(const p of cross){
      if(p.trackM>target.trackM)break;
      const a=p.headingDeg*Math.PI/180,tx=-Math.sin(a),tz=Math.cos(a),den=rx*tx+rz*tz;
      if(Math.abs(den)<1e-6)continue;
      const t=((p.x-eye.x)*tx+(p.z-eye.z)*tz)/den;
      if(t<=0||t>=1)continue;
      const lateral=(eye.x+rx*t-p.x)*(-tz)+(eye.z+rz*t-p.z)*tx;
      const terrainY=Math.abs(lateral)<=p.widthM/2?p.y-Math.tan(p.bankDeg*Math.PI/180)*lateral:p.ground(lateral);
      if(eye.y+ry*t<terrainY){firstObstruction={targetAheadM:ahead,occluderTrackM:p.trackM,lateralM:lateral};break;}
    }
    if(firstObstruction)break;
    clearTo=ahead;
  }
  return {station,clearTrackM:clearTo,firstObstruction,ceilingM:250};
}
// Standard controlled input, isolated from traffic. Record the worst station distance
// to stop at 50 m intervals using the same drivetrain and sampled grade as a real run.
function controlledStop(model,start,speedKmh){
  const state=model.handling.createState(),dt=1/120;
  state.speed=speedKmh/3.6;state.distance=start;
  let p=model.sample(start),elapsed=0,planM=0,maxLateralM=0;
  while(state.speed>0&&elapsed<15){
    const bank=p.bankDeg*Math.PI/180;
    model.handling.step(state,{gas:false,brake:true,steer:0},dt,p.curvaturePerM,1,p.widthM/2,p.grade,bank);
    const q=model.sample(state.distance);
    planM+=horizontal(p,q);p=q;elapsed+=dt;maxLateralM=Math.max(maxLateralM,Math.abs(state.lateral));
  }
  return {start,stopped:state.speed===0,stationM:state.distance-start,planM,simSeconds:elapsed,maxLateralM};
}
function examine(model,a,b,calibration) {
  const rows=range(a,b,.5).map(model.sample);
  const first=rows[0],last=rows.at(-1);
  let arc=0;const kRate=[],gradeRate=[],bankRate=[];
  for(let i=1;i<rows.length;i++){
    const p=rows[i-1],q=rows[i],ds=horizontal(p,q);
    if(ds<1e-6)throw Error('Collapsed road sample at '+q.trackM);
    arc+=ds;kRate.push(Math.abs(q.curvaturePerM-p.curvaturePerM)/ds);
    gradeRate.push(Math.abs(q.grade-p.grade)/ds);bankRate.push(Math.abs(q.bankDeg-p.bankDeg)/ds);
  }
  const abs=key=>stats(rows.map(r=>Math.abs(r[key])));
  const calcPort=p=>({world:p,lanes:model.stage.road.lanes,seaWorldY:model.seaY});
  const absK=abs('curvaturePerM'),checkpoints=range(a,b,50);
  // Use the original 5-station-metre sample spacing for like-for-like R0 warnings.
  const grid=rows.filter((_,i)=>i%10===0),coarse={absK:[],absGrade:[],absBankDeg:[],deltaKPerM:[],deltaGradePerM:[],deltaBankDegPerM:[]},scale=[];
  grid.forEach((q,i)=>{
    coarse.absK.push(Math.abs(q.curvaturePerM));coarse.absGrade.push(Math.abs(q.grade));coarse.absBankDeg.push(Math.abs(q.bankDeg));
    if(i===0)return;
    const p=grid[i-1],ds=horizontal(p,q);scale.push(ds/(q.trackM-p.trackM));
    for(const [key,field] of [['deltaKPerM','curvaturePerM'],['deltaGradePerM','grade'],['deltaBankDegPerM','bankDeg']])
      coarse[key].push(Math.abs(p[field]-q[field])/ds);
  });
  const ordinaryUpperWarnings=Object.entries(coarse).map(([key,values])=>({key,max:Math.max(...values),
    referenceP95:calibration[key].p95,referenceMax:calibration[key].max})).filter(v=>v.max>v.referenceP95);
  const planPerStationRange=[Math.min(...scale),Math.max(...scale)];
  const sight=checkpoints.map(d=>terrainSight(model,d));
  return {track:[a,b],stationLengthM:b-a,planArcM:arc,chordM:horizontal(first,last),heightDeltaM:last.y-first.y,
    peakLocation:rows.reduce((best,r)=>Math.abs(best.curvaturePerM)>=Math.abs(r.curvaturePerM)?best:r).trackM,
    absK,absGrade:abs('grade'),absBank:abs('bankDeg'),kRate:stats(kRate),gradeRate:stats(gradeRate),bankRate:stats(bankRate),
    terrainOnlySight:sight,ordinaryUpperWarnings,planPerStationRange,
    signedSunBearingRange:[Math.min(...rows.map(r=>r.sunBearingDeg)),Math.max(...rows.map(r=>r.sunBearingDeg))],
    cases:[100,200,250].map(speedKmh=>{
      const clearApproachM=Math.min(...sight.map(p=>p.clearTrackM));
      const r=assessConnector({from:calcPort(first),to:calcPort(last),availableM:arc,speedKmh,clearApproachM},calibration);
      const longestStop=checkpoints.map(d=>controlledStop(model,d,speedKmh)).reduce((best,p)=>p.stationM>best.stationM?p:best);
      return {speedKmh,longestControlledStop:longestStop,minTerrainVisibilityS:clearApproachM/(speedKmh/3.6),timeAtConstantGaugeS:(b-a)/(speedKmh/3.6),horizontalArcOverNominalMpsS:arc/(speedKmh/3.6),
        maxUnbankedSteer:absK.max*calibration.steerAtUnitCurvature[speedKmh],screen:r};
    })};
}
const digest=text=>createHash('sha256').update(text).digest('hex');
try {
  await mkdir(outDir,{recursive:true});
  const old=await runtime(base,'original'),now=await runtime(candidate,mode);
  const {KENTING_INSTALLATION:site}=await now.load('kenting-installation');
  assert.equal(site.relocated,mode==='relocated','CLI must select the same installation as the runtime sampler.');
  const start=now.stage.road.startDistance,end=start+now.stage.road.length,full=range(start,end,5);
  const originalCore=old.beach.core,delta=site.coreStart-originalCore;
  const p0=old.sample(originalCore),p1=now.sample(site.coreStart),translation=[p1.x-p0.x,p1.y-p0.y,p1.z-p0.z];
  const localPorts={entry:site.coreStart,exit:site.coreStart+site.coreLength};
  const rows=full.map(now.sample),profile=csv(rows);
  const profileName='coast-'+mode+'.csv';
  await writeFile(join(outDir,profileName),profile);
  const reference=JSON.parse(await readFile(join(base,'docs/route/kenting-ports.json'),'utf8'));
  const calibration=reference.calibration;
  const core=compare(old,now,range(originalCore,originalCore+site.coreLength,1),delta,translation);
  const intro=compare(old,now,range(start,4350,2));
  const originalFootprint=compare(old,now,range(3950,8450,2));
  const sourceRevision=git(candidate,'log','-1','--format=%H','--','src','content','package-lock.json');
  const dirtyInputs=Boolean(git(candidate,'status','--porcelain','--','src','content','package-lock.json'));
  const report={referenceCommit:git(base,'rev-parse','HEAD'),sourceRevision,dirtyInputs,mode,site,localPorts,
    profileSHA256:digest(profile),fixedSun:{before:old.sun,after:now.sun},seaLevel:{before:old.seaY,after:now.seaY},
    accident:{before:old.accident,after:now.accident},mapping:{oldCore:originalCore,newCore:site.coreStart,translation,
      oldFrame:[p0.x,p0.y,p0.z,p0.headingDeg],newFrame:[p1.x,p1.y,p1.z,p1.headingDeg]},
    identity:compare(old,now,full),tutorial:intro,originalFootprint,core,
    connectors:{},joins:[]};
  if(mode==='relocated'){
    const endJoin=site.connectedAt;
    assert.ok(endJoin>localPorts.exit);
    const {onboarding,road}=now.stage;
    const {COAST_INSTALLED_HEROES:activeHeroes}=await now.load('content/coast-direction');
    const anchors=[
      ...activeHeroes.map(h=>({id:h.id,roadDistance:h.distance})),
      {id:'Lighthouse cape',roadDistance:site.coreStart+now.beach.tower}
    ].sort((a,b)=>a.roadDistance-b.roadDistance);
    report.activeHeroes=anchors;
    // Terrain sample values in the longitudinal / lateral frame of each installation.
    report.landmarks=[-700,-500,0,180,350,700,750,800,1072,1170,1400,1700].map(local=>{
      const capture=(model,d)=>{
        const q=model.sample(d),y=x=>round(q.ground(x));
        return {station:d,shoreM:round(q.shoreM),seaY:model.seaY,wetToeY:y(q.shoreM+2),shoreY:y(q.shoreM),
          swimBedY:y(q.shoreM-6),swimDepthM:round(model.seaY-q.ground(q.shoreM-6)),bermY:y(q.shoreM+12),
          shelfAtMinus35Y:y(-35),inland:[35,75,125].map(x=>({x,groundY:y(x),hillReliefM:round(model.hill(x,d))}))};
      };
      return {localStation:local,before:capture(old,originalCore+local),after:capture(now,site.coreStart+local)};
    });
    const svg=masterMap({rows,lessons:[...onboarding.lessons,onboarding.accident,...onboarding.driftLessons],anchors,
      b:{start:site.roadEntry,end:site.roadExit,core:site.coreStart,length:site.coreLength},turns:road.turns,
      installation:{...site,connectorStart:4350},
      provenance:{revision:sourceRevision.slice(0,12)+(dirtyInputs?' + working inputs':'')+' / profile '+report.profileSHA256.slice(0,12),dataDate:git(candidate,'show','-s','--format=%cs',sourceRevision)}});
    await writeFile(join(outDir,'coast-relocated.svg'),svg);
    await writeFile(join(outDir,'relocation-plan.svg'),relocationPlan(full.map(old.sample),rows,site,translation,now.sun,now.beach.tower));
    report.connectors.entry=examine(now,4350,site.roadEntry,calibration);
    report.connectors.exit=examine(now,site.roadExit,endJoin,calibration);
    report.outsideAfter=compare(old,now,range(endJoin,end,5));
    report.joins=[...new Set([4350,site.roadEntry,localPorts.entry,localPorts.exit,site.roadExit,endJoin])].sort((a,b)=>a-b).map(d=>seam(now,d));
  }
  const writeJson=(file,value)=>writeFile(join(outDir,file),JSON.stringify(value,(key,value)=>typeof value==='number'?round(value):value,2)+'\n');
  await writeJson('survey-'+mode+'.json',report);
  console.log(JSON.stringify({mode,profileName,site,core:core.absoluteMax,identity:report.identity.absoluteMax,joins:report.joins}));
  if(mode==='original'){
    assert(!report.identity.barrierMismatchStations.length && !originalFootprint.barrierMismatchStations.length);
    for(const r of [report.identity,originalFootprint,core])for(const item of Object.values(r.absoluteMax))
      assert.ok(item.value<1e-7,'Original reconstruction mismatch: '+JSON.stringify(item));
  }
}finally{await Promise.all(services.map(s=>s.close()));}
