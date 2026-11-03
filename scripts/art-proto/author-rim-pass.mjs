// R4: stronger, smoothly eased banking on the accepted R3 centerline and grades.
import fs from 'node:fs';
import * as THREE from 'three';
const root='art-prototype/output/cliff-pass-r4';
const controls=[[-410,2600],[-440,2350],[-420,2100],[-490,1850],[-550,1600],[-535,1350],[-490,1150],[-490,1020],[-340,900],[-285,820],[-285,730],[-300,680],[-400,600],[-450,480],[-420,250],[-390,60],[-400,-180],[-420,-400]];
const cp=[controls[0],controls[0],...controls,controls.at(-1),controls.at(-1)],raw=[];
for(let i=0;i<cp.length-3;i++)for(let j=0;j<500;j++){
 const t=j/500,w=[(1-t)**3/6,(3*t**3-6*t*t+4)/6,(-3*t**3+3*t*t+3*t+1)/6,t**3/6];
 const p=new THREE.Vector2();for(let k=0;k<4;k++)p.addScaledVector(new THREE.Vector2(...cp[i+k]),w[k]);
 if(!raw.length||p.distanceTo(raw.at(-1))>.00001)raw.push(p);
}
const ds=[0];for(let i=1;i<raw.length;i++)ds.push(ds.at(-1)+raw[i].distanceTo(raw[i-1]));
const routeLength=Math.floor(ds.at(-1)/2.5)*2.5;
function at(d){d=Math.max(0,Math.min(ds.at(-1),d));let lo=0,hi=ds.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(ds[m]<=d)lo=m;else hi=m;}return raw[lo].clone().lerp(raw[hi],(d-ds[lo])/(ds[hi]-ds[lo]));}
const frames=[];let heading,old;
for(let d=0;d<=routeLength;d+=2.5){const p=at(d),v=at(d+4).sub(at(d-4)),h=Math.atan2(-v.x,v.y);heading=heading===undefined?h:heading+Math.atan2(Math.sin(h-old),Math.cos(h-old));old=h;frames.push([350+d,p.x,300,p.y,heading,0]);}
const scenicZones=[
 {start:1810,end:2090,ramp:65,leftMeters:1.8,yawDegrees:7,downDegrees:1},
 {start:2430,end:2730,ramp:65,leftMeters:1.8,yawDegrees:7,downDegrees:1},
];
if(process.argv.includes('--final')){
 const heights=JSON.parse(fs.readFileSync('art-prototype/output/rim-pass-r1/surface-profile.json'));
 if(heights.length!==frames.length)throw Error('Refresh the terrain surface profile for this road layout');
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};
 // Authored LONG vertical curves, independent of rock-scale surface samples.
 // Zero first/second derivatives at each join remove the repeated short crests
 // seen in the owner's video; no runtime camera/vehicle smoothing is involved.
 const elevation=[[350,294],[1050,300],[1950,274],[2450,264],[350+routeLength,263]];
 const y=frames.map(p=>{
  const j=Math.max(1,elevation.findIndex(q=>q[0]>=p[0]));
  const a=elevation[j-1],b=elevation[j];return a[1]+(b[1]-a[1])*smooth((p[0]-a[0])/(b[0]-a[0]));
 });
 // Fixed bank landmarks, independent of short curvature changes in the S bend.
 // These are baked road geometry, not runtime smoothing or camera roll.
 const banking=[[350,0],[900,-5],[1400,3],[1600,4],[1880,22],[2000,22],
  [2260,-22],[2540,22],[2620,22],[2900,0],[3150,-4],[350+routeLength,0]];
 for(let i=0;i<frames.length;i++){
  const p=frames[i],j=Math.max(1,banking.findIndex(q=>q[0]>=p[0])),a=banking[j-1],b=banking[j];
  p[2]=y[i]+.2;p[5]=(a[1]+(b[1]-a[1])*smooth((p[0]-a[0])/(b[0]-a[0])))*Math.PI/180;
 }
 const start=frames[0],end=frames.at(-1),padded=[];
 for(let d=0;d<350;d+=2.5){const t=d-350;padded.push([d,start[1]-Math.sin(start[4])*t,start[2],start[3]+Math.cos(start[4])*t,start[4],start[5]]);}
 padded.push(...frames);
 for(let t=2.5;t<=600;t+=2.5)padded.push([end[0]+t,end[1]-Math.sin(end[4])*t,end[2],end[3]+Math.cos(end[4])*t,end[4],end[5]]);
 const cameras=scenicZones.flatMap((z,i)=>[[`H${i+1}_Approach`,z.start],[`H${i+1}_Reveal`,(z.start+z.end)/2],[`H${i+1}_Exit`,z.end]]);
 const file='src/terrain-first-road.json',temporary=file+'.tmp';
 fs.writeFileSync(temporary,JSON.stringify({routeLength,bridge:[],scenicZones,elevation,cameras,controls,frames:padded.map(r=>r.map(v=>+v.toFixed(6)))}));
 fs.renameSync(temporary,file);
 console.log(JSON.stringify({routeLength,scenicZones,heightFitMax:Math.max(...y.map((v,i)=>Math.abs(v-heights[i]))),maxGrade:Math.max(...frames.slice(1).map((p,i)=>Math.abs((p[2]-frames[i][2])/2.5)))}));
}else{fs.writeFileSync(root+'/road-layout.json',JSON.stringify({routeLength,controls,scenicZones,frames}));console.log({routeLength,scenicZones});}
