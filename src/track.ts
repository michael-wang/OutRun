import * as THREE from 'three';

/** Distance-authored rhythm, timed at 65 m/s × 1.75. Two cycles close the coast loop. */
export const ROAD_BEATS = [
  {name:'A',length:740,turn:0}, {name:'B',length:455,turn:1.2},
  {name:'C',length:740,turn:0}, {name:'D',length:455,turn:.65},
  {name:'E',length:285,turn:Math.PI-1.85}, {name:'F',length:455,turn:0},
];
export const RHYTHM_LENGTH=ROAD_BEATS.reduce((sum,b)=>sum+b.length,0);
export function roadBeat(distance:number) {
  let d=((distance%RHYTHM_LENGTH)+RHYTHM_LENGTH)%RHYTHM_LENGTH;
  for(const beat of ROAD_BEATS){if(d<beat.length)return {...beat,offset:d};d-=beat.length;}
  return {...ROAD_BEATS[0],offset:0};
}
export function roadCurvature(distance:number) {
  const b=roadBeat(distance);
  if(b.name==='D'){
    const half=b.length/2,second=b.offset>=half,u=(b.offset%half)/half;
    return (second?1.1:-.45)/half*(1-Math.cos(2*Math.PI*u));
  }
  return b.turn/b.length*(1-Math.cos(2*Math.PI*b.offset/b.length));
}
export function createTrack() {
  const length=RHYTHM_LENGTH*2,count=Math.ceil(length/2.5),spacing=length/count;
  const positions:THREE.Vector3[]=[],headings:number[]=[];
  let x=0,z=0,heading=0;
  for(let i=0;i<=count;i++){
    const d=i*spacing;
    positions.push(new THREE.Vector3(x,52-44*Math.cos(2*Math.PI*d/length),z));headings.push(heading);
    const turn=roadCurvature(d+spacing/2)*spacing;
    x-=Math.sin(heading+turn/2)*spacing;z+=Math.cos(heading+turn/2)*spacing;heading+=turn;
  }
  const residual=positions[count].clone();residual.y=0;
  positions.forEach((p,i)=>p.addScaledVector(residual,-i/count));
  function sample(distance:number) {
    const d=((distance%length)+length)%length,index=d/spacing,i=Math.floor(index),t=index-i;
    const position=positions[i].clone().lerp(positions[i+1],t),roadHeading=THREE.MathUtils.lerp(headings[i],headings[i+1],t);
    const grade=44*2*Math.PI/length*Math.sin(2*Math.PI*d/length);
    const tangent=new THREE.Vector3(-Math.sin(roadHeading),grade,Math.cos(roadHeading)).normalize();
    const right=new THREE.Vector3(-Math.cos(roadHeading),0,-Math.sin(roadHeading));
    return {position,tangent,right,curvature:roadCurvature(d),roadHeading};
  }
  return {sample,length};
}
