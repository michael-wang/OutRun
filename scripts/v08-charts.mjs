import {readFileSync,writeFileSync} from 'node:fs';
const root='docs/evidence/v0.8';
for(const seed of [1,2,3]){
 const {stage,trace}=JSON.parse(readFileSync(`${root}/seed-${seed}-drive.json`,'utf8'));
 const timeline=JSON.parse(readFileSync(`${root}/five-seed-timelines.json`,'utf8')).find(x=>x.code===stage.stageCode);
 const rows=[['Curve demand',timeline.samples,r=>r.demand,-1.4,1.4,false],['Steering',trace,r=>r.steer,-1,1,true],['Speed km/h',trace,r=>r.speed,0,300,true],['Grade',trace,r=>r.grade,-.6,.6,true],['Lanes',trace,r=>r.lanes,2,8,true]];
 let svg='<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="850" viewBox="0 0 1100 850"><rect width="1100" height="850" fill="#f7f4ed"/><text x="40" y="32" font-family="sans-serif" font-size="22">'+stage.stageCode+' · route and real-time drive</text>';
 for(const [i,[name,data,field,min,max,absolute]] of rows.entries()){
  const top=65+i*150,height=120;svg+=`<text x="40" y="${top+15}" font-family="sans-serif" font-size="15">${name} (${min} to ${max})</text><line x1="200" x2="1060" y1="${top+height}" y2="${top+height}" stroke="#999"/>`;
  const points=data.map(r=>`${(200+860*(r.s-(absolute?350:0))/stage.length).toFixed(1)},${(top+height-(field(r)-min)/(max-min)*height).toFixed(1)}`).join(' ');
  svg+=`<polyline fill="none" stroke="#147d84" stroke-width="2" points="${points}"/>`;
 }
 svg+='<text x="200" y="830" font-family="sans-serif" font-size="15">Start</text><text x="1010" y="830" font-family="sans-serif" font-size="15">Finish</text></svg>';
 writeFileSync(`${root}/seed-${seed}-chart.svg`,svg);
}
