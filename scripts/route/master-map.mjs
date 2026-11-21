// Static vector map. Equal scales on world X and Z preserve the plan geometry.
export function masterMap({rows,lessons,anchors,b,turns,provenance,installation}) {
  const parts=[];
  const add=s=>parts.push(s);
  const n=x=>x.toFixed(2);
  const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
  const label=(x,y,s,size=16,color='#213f44',extra='')=>
    add('<text x="'+n(x)+'" y="'+n(y)+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(s)+'</text>');
  const line=(x,y,X,Y,color,width=1,extra='')=>add('<line x1="'+n(x)+'" y1="'+n(y)+'" x2="'+n(X)+'" y2="'+n(Y)+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>');
  const path=(points,color,width)=>add('<path d="'+points.map(([x,y],i)=>(i?'L':'M')+n(x)+' '+n(y)).join(' ')+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round" stroke-linejoin="round"/>');
  const badge=(x,y,t,fill)=>{add('<circle cx="'+n(x)+'" cy="'+n(y)+'" r="10" fill="'+fill+'"/>');label(x,y+4,t,12,'white','text-anchor="middle" font-weight="bold"');};
  const first=rows[0].trackM,last=rows.at(-1).trackM;
  const xs=rows.map(p=>p.x),zs=rows.map(p=>p.z);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
  const scale=Math.min(470/(maxX-minX),530/(maxZ-minZ));
  const xy=p=>[325+(p.x-(minX+maxX)/2)*scale,411-(p.z-(minZ+maxZ)/2)*scale];
  const at=d=>rows[Math.max(0,Math.min(rows.length-1,Math.round((d-first)/5)))];
  const stationX=d=>82+(d-first)/(last-first)*1192;
  add('<svg xmlns="http://www.w3.org/2000/svg" width="1360" height="1130" viewBox="0 0 1360 1130" role="img" aria-labelledby="title desc">');
  add('<title id="title">Coast master route — '+(installation?'R1 candidate':'accepted runtime')+'</title><desc id="desc">Plan in world X/Z, tutorial and scenic anchor key, overlapping beach systems, signed curvature and elevation by distance.</desc>');
  add('<rect width="1360" height="1130" fill="#f7f6ed"/><g font-family="Segoe UI,Arial,sans-serif">');
  label(42,49,installation?'Coast master route  /  Kenting R1':'Coast master route',36,'#122f37','font-weight="bold"');
  label(42,78,'First stage  /  '+((last-first)/1000).toFixed(1)+' km  /  Pace C 1.0×  /  Runtime geometry sampled every 5 m',17);
  line(42,97,1318,97,'#a9b9b2');
  label(42,129,'Plan  ·  +X right, +Z up',19);
  const route=(a,z,c,w)=>path(rows.filter(p=>p.trackM>=a&&p.trackM<=z).map(xy),c,w);
  route(first,last,'#586d77',4);
  route(first,4350,'#635988',5);
  if(installation){
    route(installation.connectorStart,installation.roadEntry,'#bd774a',7);
    route(installation.roadExit,installation.connectedAt,'#bd774a',7);
  }
  route(b.start,b.end,'#4f9d94',8);
  route(b.core,b.core+b.length,'#11695e',8);
  for(const d of [1650,3850,6960,9370,11950,13750]){
    const [x,y]=xy(at(d)),[X,Y]=xy(at(d+20));
    const a=Math.atan2(Y-y,X-x);
    path([[x-10*Math.cos(a-.55),y-10*Math.sin(a-.55)],[x,y],[x-10*Math.cos(a+.55),y-10*Math.sin(a+.55)]],'#112f35',2);
  }
  // Place keys in the margins. Spread crowded stations without moving their anchor dots.
  const keys=[{id:'S',d:first,side:-1,color:'#635988'},...lessons.map(l=>({id:l.id,d:l.distance??l.start,side:-1,color:'#635988'})),
    ...anchors.map((h,i)=>({id:String(i+1),d:h.roadDistance,side:1,color:'#11695e'})),{id:'F',d:last,side:1,color:'#213f44'}];
  for(const side of [-1,1]){
    const group=keys.filter(k=>k.side===side).map(k=>({...k,p:xy(at(k.d))})).sort((a,b)=>a.p[1]-b.p[1]);
    group.forEach((k,i)=>{k.y=Math.max(k.p[1],i?group[i-1].y+24:155);});
    for(let i=group.length-1;i>=0;i--) group[i].y=Math.min(group[i].y,i===group.length-1?683:group[i+1].y-24);
    for(const k of group){
      const [x,y]=k.p, gx=side<0?67:590;
      line(x,y,gx,k.y,'#9baaa6',.9);
      add('<circle cx="'+n(x)+'" cy="'+n(y)+'" r="3" fill="'+k.color+'"/>');
      badge(gx,k.y,k.id,k.color);
    }
  }
  line(47,705,47+1000*scale,705,'#203f44',3);label(47,726,'1 km',13);
  label(650,131,'Tutorial  ·  track metres',20);
  lessons.forEach((l,i)=>label(650,162+i*24,l.id+'   '+l.start+'–'+l.end+'   '+(['Launch','Fast sweep','First pass','Linked S','Right-lane incident','Drift I','Drift II'][i]),16));
  label(991,131,'Scenic anchors  ·  track metres',20);
  anchors.forEach((h,i)=>label(991,162+i*24,(i+1)+'   '+h.roadDistance+'   '+h.id,16));
  label(650,411,'Kenting boundary layers',23,'#11695e','font-weight="bold"');
  const notes=installation ? [
    installation.connectorStart+'–'+installation.roadEntry+'    Entry connector after A6.',
    installation.roadEntry+'–'+installation.roadExit+'    Installed approach, bay and outer cape.',
    b.core+'–'+(b.core+b.length)+'    Core profile. Local 0–'+b.length+' m.',
    installation.roadExit+'–'+installation.connectedAt+'    Exit connector back into the race.',
    'Ochre = connectors. Teal = protected road. Dark teal = core.',
    'Old anchors: harbour 4,600 / woods 5,420. Future sites await R2.'
  ] : [
    '3,950–8,450    Outer mountain, rise and base alignment influence.',
    '4,350–8,450    Underlying Macro road transform.',
    '4,800–6,800    Beach2 road override, including its two joins.',
    '4,850–6,250    Core profile. Proposed local 0–1,400 m.',
    '4,600 / 5,420   Harbour and woods anchors overlap this landscape.',
    'Other anchors and uncoloured reaches await segment definition.'
  ];
  notes.forEach((s,i)=>label(650,446+i*30,s,17));
  label(650,654,'Race starts at track '+first+' m and finishes at '+last+' m.',17);
  label(650,683,'HUD = track − '+first+' m.  World axes have no compass registration.',16);
  line(42,749,1318,749,'#a9b9b2');
  // Identical station axis in both profiles. Shade the two authored teaching drift windows.
  function profile(field,title,color,top,height,format) {
    const values=rows.map(p=>p[field]),lo=Math.min(0,...values),hi=Math.max(...values);
    const y=v=>top+height-(v-lo)/(hi-lo||1)*height;
    label(43,top-11,title+'   ·   '+format(lo)+' to '+format(hi),17);
    for(const l of lessons.filter(l=>l.id==='A5'||l.id==='A6')){
      add('<rect x="'+n(stationX(l.start))+'" y="'+top+'" width="'+n(stationX(l.end)-stationX(l.start))+'" height="'+height+'" fill="#ded7e9"/>');
    }
    line(82,y(0),1274,y(0),'#aab7b5');
    path(rows.map(p=>[stationX(p.trackM),y(p[field])]),color,1.7);
  }
  profile('y','Centreline elevation (m)','#27695f',797,71,v=>v.toFixed(1));
  profile('curvaturePerM','Signed runtime curvature (1/m)   ·   shaded A5/A6','#615180',910,76,v=>v.toFixed(4));
  // Separate authored turn windows from the measured runtime curve.
  turns.forEach(t=>line(stationX(t.start),1006,stationX(t.end),1006,t.steer<0?'#695b90':'#bb7747',5));
  for(const d of [0,2000,4000,6000,8000,10000,12000,last-first]){
    const x=stationX(first+d);
    line(x,1015,x,1021,'#496068');label(x,1040,Number((d/1000).toFixed(1))+'',15,'#213f44','text-anchor="middle"');
  }
  label(44,1068,'HUD km   /   Short bars show authored left (violet) and right (ochre) turn windows. The curve above includes all runtime transforms.',15);
  label(44,1103,'Runtime source '+provenance.revision+'   ·   '+provenance.dataDate+('   ·   Rebuild with node scripts/route/'+(installation?'survey-kenting.mjs':'export-coast.mjs')),14);
  add('</g></svg>');
  return parts.join('\n')+'\n';
}
