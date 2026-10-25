import {writeFileSync} from 'node:fs';
const acts=[
 [['launch',0,0],['low',.25,5],['relief-low',0,1],['high',.75,4.5+2/3],['relief-medium',0,1],['medium',-.5,6],['coast-rest',0,1],['coast-crest',.5,5.516666666666667]],
 [['canyon-entry',0,0],['brake-zone',0,2],['extreme',1.2,4.5],['relief-extreme',0,1],['s-left',-.5,3,.6],['s-center',0,.4],['s-right',.5,3,.6],['canyon-soft',-.25,2.266666666666667],['canyon-left',-1.2,3.2],['canyon-release',0,1],['canyon-exit',.75,4.52]],
 [['city-entry',0,0],['boulevard',.5,7],['city-left',-.5,4],['city-skyline',.75,4.177777777777778],['city-left-low',-.25,5],['city-right-low',.25,5],['exit',0,2]]
];
const v=230/3.6*1.75,k=Math.PI/(v*5.825);
let x=0,z=0,h=0,t=0;const positions=[];
for(const act of acts){for(const [id,u,seconds,r=1] of act){const n=Math.ceil(seconds*100);for(let i=0;i<n;i++){const dt=seconds/n,at=(i+.5)*dt,w=u?Math.max(0,Math.min(1,at/r,(seconds-at)/r)):0,turn=k*u*(.5-.5*Math.cos(Math.PI*w))*v*dt;x-=Math.sin(h+turn/2)*v*dt;z+=Math.cos(h+turn/2)*v*dt;h+=turn;t+=dt;}positions.push({id,x,z,h:h*180/Math.PI,t});}}

const budget=acts.map(a=>40-a.reduce((n,c)=>n+c[2],0));
const slots=positions.map((p,i)=>{const stage=i<acts[0].length?0:i<acts[0].length+acts[1].length?1:2;const h=p.h*Math.PI/180;return {id:p.id,stage,a:[-Math.sin(h),Math.cos(h),...[0,1,2].map(n=>n===stage?1:0)]};});
const target=[-x/v,-z/v,...budget];let values=slots.map(s=>budget[s.stage]/acts[s.stage].length);
for(let iter=0;iter<100000;iter++){const residual=target.map((t,j)=>slots.reduce((n,s,i)=>n+s.a[j]*values[i],0)-t);values=values.map((n,i)=>Math.max(i===0?4:0,Math.min(['s-left','s-center'].includes(slots[i].id)?0:8,n-.035*slots[i].a.reduce((s,a,j)=>s+a*residual[j],0))));}
console.log({target,residual:target.map((t,j)=>slots.reduce((n,s,i)=>n+s.a[j]*values[i],0)-t)});console.log(slots.map((s,i)=>({after:s.id,seconds:values[i],stage:s.stage})));writeFileSync('docs/evidence/v0.6/route-layout.json',JSON.stringify({acts,slots:slots.map((s,i)=>({after:s.id,seconds:values[i],stage:s.stage})),target},null,2));
