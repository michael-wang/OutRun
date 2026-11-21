/** R0 offline port screen. Inputs are already placed in the SAME world frame.
 * A reviewer supplies evidence about a particular path; this does not fit one. */
const reviews = {
  alignment:['geometry','Inspect the interior road samples, position/tangent joins and swept vehicle envelope.'],
  collision:['geometry','Check road surface contact, shoulders and lane bounds on both sides.'],
  terrain:['terrain','Compare both cross-sections, water mask and rendered land/water seam.'],
  outlook:['art','Verify the fixed-sun reveal and protected subject in normal chase at speed.'],
  drive:['driving','Drive both approaches including the crest or sag at the target speed.']
};
const angleDifference = (a,b) => Math.atan2(Math.sin(a-b),Math.cos(a-b));
const radians = deg => deg*Math.PI/180;
const validPort = p => p && Number.isInteger(p.lanes) && p.lanes>0 &&
  ['x','y','z','headingDeg','curvaturePerM','grade','bankDeg','widthM'].every(k=>Number.isFinite(p.world?.[k])) &&
  p.world.widthM>0 && (p.seaWorldY==null || Number.isFinite(p.seaWorldY));

export function assessConnector({from,to,availableM,speedKmh,reviews:evidence={},clearApproachM},calibration) {
  const diagnostics=[];
  const metrics={};
  const add=(severity,area,reason,action)=>diagnostics.push({severity,area,reason,action});
  function result() {
    const status=diagnostics.some(d=>d.severity==='hard')?'INCOMPATIBLE':diagnostics.length?'WARNING':'PASS';
    return {status,metrics,diagnostics};
  }
  if (!validPort(from)||!validPort(to)||!Number.isFinite(availableM)||availableM<=0 ||
      ![100,200,250].includes(speedKmh) || (clearApproachM!=null && !(Number.isFinite(clearApproachM)&&clearApproachM>=0))) {
    add('hard','input','Invalid port, length or speed case.','Supply two finite placed ports, positive horizontal path budget and a calibrated speed.');
    return result();
  }
  const a=from.world,b=to.world;
  const chord=Math.hypot(b.x-a.x,b.z-a.z);
  const turn=Math.abs(angleDifference(radians(a.headingDeg),radians(b.headingDeg)));
  const curvature=Math.max(turn/availableM,Math.abs(a.curvaturePerM),Math.abs(b.curvaturePerM));
  const meanGrade=Math.abs(b.y-a.y)/availableM;
  Object.assign(metrics,{chordM:chord,headingChangeDeg:turn*180/Math.PI,minPeakCurvaturePerM:curvature,
    minPeakAbsGrade:Math.max(meanGrade,Math.abs(a.grade),Math.abs(b.grade)),
    curvatureRateFloor:Math.abs(b.curvaturePerM-a.curvaturePerM)/availableM,
    gradeRateFloor:Math.abs(b.grade-a.grade)/availableM,bankRateFloor:Math.abs(b.bankDeg-a.bankDeg)/availableM,
    timeAtBudgetS:availableM/(speedKmh/3.6),neutralSteerDemand:curvature*calibration.steerAtUnitCurvature[speedKmh]});
  if(chord>availableM+1e-6) add('hard','geometry','Horizontal chord exceeds available path length.','Extend the connector or move a port.');
  if(Math.abs(chord-availableM)<=1e-6){
    const direct=Math.atan2(a.x-b.x,b.z-a.z);
    if([a,b].some(p=>Math.abs(angleDifference(radians(p.headingDeg),direct))>1e-6 || Math.abs(p.curvaturePerM)>1e-8))
      add('hard','geometry','Only a straight chord fits and its end frames cannot match.','Allow turning length or align the ports.');
  }
  if(from.seaWorldY!=null && to.seaWorldY!=null && Math.abs(from.seaWorldY-to.seaWorldY)>1e-6)
    add('hard','terrain','Inconsistent levels for a single connected sea.','Re-fit coastal boundaries to the same water datum.');
  // Signed positive bearing is towards the driver's right. World sun is immutable.
  if (to.sunBearingWindowDeg) {
    const {worldSun, min, max}=to.sunBearingWindowDeg;
    if (!Array.isArray(worldSun)||worldSun.length!==3||!worldSun.every(Number.isFinite)||
        Math.hypot(worldSun[0],worldSun[2])===0||!Number.isFinite(min)||!Number.isFinite(max)||min>max) {
      add('hard','input','Invalid horizontal sun window.','Supply a fixed world direction and a non-wrapping signed interval.');
    } else {
      const bearing=angleDifference(Math.atan2(-worldSun[0],worldSun[2]),radians(b.headingDeg))*180/Math.PI;
      metrics.entrySunBearingDeg=bearing;
      if(bearing<min||bearing>max) add('warning','art','Fixed sun falls outside the proposed placement window.','Change the approach or receiving segment yaw and review the actual chase view.');
    }
  }
  if(from.lanes!==to.lanes || Math.abs(a.widthM-b.widthM)>1e-6)
    add('warning','geometry','Lane or pavement profile changes.','Specify a visible taper and test usable lanes and collision widths.');
  for(const [value,key,area,action] of [
    [curvature,'absK','driving','Lengthen the turn or lower the proposed entry speed.'],
    [metrics.minPeakAbsGrade,'absGrade','driving','Spread the rise or move the port in elevation.'],
    [Math.max(Math.abs(a.bankDeg),Math.abs(b.bankDeg)),'absBankDeg','driving','Check crossfall and tyre contact.'],
    [metrics.curvatureRateFloor,'deltaKPerM','driving','Ease the steering transition over more distance.'],
    [metrics.gradeRateFloor,'deltaGradePerM','driving','Extend the crest/sag and examine sight distance.'],
    [metrics.bankRateFloor,'deltaBankDegPerM','driving','Allow a longer bank transition.']
  ]) {
    if(value>calibration[key].p95) add('warning',area,key+' requires '+value.toPrecision(4)+'; accepted-route p95 '+calibration[key].p95,action);
  }
  if(metrics.neutralSteerDemand>1) add('warning','driving','Unbanked steady-line demand exceeds full steering at the proposed speed.','Check banking, planned braking and drift in play.');
  if(speedKmh===250 && clearApproachM!=null && clearApproachM<53.576)
    add('warning','driving','Approach shorter than the measured 250→99 km/h level braking run.','If this speed drop is needed, provide braking and sight distance before the turn.');
  for(const [key,[area,action]] of Object.entries(reviews)){
    const item=evidence[key];
    if(item?.state==='verified' && item.source?.trim()) continue;
    if(item?.state==='failed' && item.source?.trim())
      add(['geometry','terrain'].includes(area)?'hard':'warning',area,key+' failed: '+item.source,action);
    else add('warning',area,key+' UNKNOWN',action);
  }
  return result();
}
