// Fixed route chosen AFTER terrain-first Gate A. No old road data is imported.
import * as THREE from 'three';
import fs from 'node:fs';
const controls=[
 [300,330,-150],[310,320,80],
 [185,275,190],[80,185,300],[50,175,430],[95,230,535],[100,280,650],
 [65,300,735],[5,300,795],[-95,300,840],[-180,310,880],
 [-270,330,1010],[-420,370,1120],[-550,390,1050],
 [-400,370,950],[-240,315,840],[-260,315,640],
 [-420,300,450],[-420,300,250],[-390,300,60],
];
// Cubic B-spline: continuous curvature, no tiny interpolating corner spikes.
const cp=[controls[0],controls[0],...controls,controls.at(-1),controls.at(-1)];
const raw=[];
for(let i=0;i<cp.length-3;i++)for(let j=0;j<500;j++){
 const t=j/500,w=[(1-t)**3/6,(3*t**3-6*t*t+4)/6,(-3*t**3+3*t*t+3*t+1)/6,t**3/6];
 const p=new THREE.Vector3();for(let k=0;k<4;k++)p.addScaledVector(new THREE.Vector3(...cp[i+k]),w[k]);
 if(!raw.length||p.distanceTo(raw.at(-1))>.00001)raw.push(p);
}
const dist=[0];for(let i=1;i<raw.length;i++)dist.push(dist.at(-1)+Math.hypot(raw[i].x-raw[i-1].x,raw[i].z-raw[i-1].z));
const routeLength=Math.floor(dist.at(-1)/2.5)*2.5;
function at(d){d=Math.max(0,Math.min(dist.at(-1),d));let lo=0,hi=dist.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(dist[m]<=d)lo=m;else hi=m;}return raw[lo].clone().lerp(raw[hi],(d-dist[lo])/(dist[hi]-dist[lo]));}
const rows=[];let heading=0,previous;
for(let d=0;d<=routeLength;d+=2.5){const p=at(d),delta=at(d+4).sub(at(d-4));let h=Math.atan2(-delta.x,delta.z);if(previous!==undefined)h=heading+Math.atan2(Math.sin(h-previous),Math.cos(h-previous));previous=Math.atan2(-delta.x,delta.z);heading=h;rows.push([350+d,p.x,p.y,p.z,h,0]);}
for(let i=0;i<rows.length;i++){const a=rows[Math.max(0,i-12)],b=rows[Math.min(rows.length-1,i+12)],k=(b[4]-a[4])/(b[0]-a[0]);rows[i][5]=Math.max(-.21,Math.min(.21,k*24));}
const start=rows[0],end=rows.at(-1),frames=[];
for(let d=0;d<350;d+=2.5){const t=d-350;frames.push([d,start[1]-Math.sin(start[4])*t,start[2],start[3]+Math.cos(start[4])*t,start[4],0]);}
frames.push(...rows);
for(let t=2.5;t<=600;t+=2.5)frames.push([end[0]+t,end[1]-Math.sin(end[4])*t,end[2],end[3]+Math.cos(end[4])*t,end[4],0]);
const nearest=(x,z)=>rows.reduce((a,p)=>Math.hypot(p[1]-x,p[3]-z)<Math.hypot(a[1]-x,a[3]-z)?p:a,rows[0])[0];
const cameras=[['H1_Approach',nearest(300,80)],['H1_Reveal',nearest(185,190)],['H1_Exit',nearest(65,365)],['H2_Approach',nearest(65,735)],['H2_Reveal',nearest(-310,890)],['H2_Exit',nearest(-350,540)]];
const data={routeLength,bridge:[nearest(65,735),nearest(-180,880)],cameras,controls,frames:frames.map(r=>r.map(v=>+v.toFixed(6)))};
fs.writeFileSync('src/terrain-first-road.json',JSON.stringify(data));
console.log(JSON.stringify({routeLength,bridge:data.bridge,cameras,maxCurvature:Math.max(...rows.slice(1).map((p,i)=>Math.abs((p[4]-rows[i][4])/2.5)))}));
