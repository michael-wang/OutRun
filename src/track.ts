import * as THREE from 'three';

/** Shared geometry for rendering and deterministic driving tests. */
export function createTrack() {
  const points = [[0,8,0],[30,14,240],[-80,42,450],[-100,92,700],[100,22,900],
    [350,9,1000],[450,24,1030],[550,40,1005],[650,68,1040],[760,45,1010],
    [800,20,850],[660,54,500],[550,20,200],[350,8,-40],[100,7,-130]];
  const curve = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0]*1.25,p[1],p[2]*1.25)),true,'centripetal');
  curve.arcLengthDivisions=6000; curve.updateArcLengths();
  const length=curve.getLength();
  function sample(distance:number) {
    const u=((distance%length)+length)%length/length;
    const position=curve.getPointAt(u), tangent=curve.getTangentAt(u).normalize();
    const right=new THREE.Vector3(-tangent.z,0,tangent.x).normalize();
    const next=curve.getTangentAt((u+1/length)%1),prev=curve.getTangentAt((u-1/length+1)%1);
    const curvature=-Math.atan2(prev.z*next.x-prev.x*next.z,prev.x*next.x+prev.z*next.z)/2;
    return {position,tangent,right,curvature,roadHeading:-Math.atan2(tangent.x,tangent.z)};
  }
  return {sample,length};
}
