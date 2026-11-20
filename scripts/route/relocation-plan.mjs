// Render the two authoritative samplers in one metric world frame.
export function relocationPlan(oldRows,newRows,site,translation,sun,towerOffset){
  const a=site.tutorialExit,b=site.roadEntry,c=site.roadExit,d=site.connectedAt;
  const R=rows=>rows.filter(p=>p.trackM>=a-160&&p.trackM<=d+180);
  const before=R(oldRows),after=R(newRows),both=[...before,...after];
  const limits=key=>[Math.min(...both.map(p=>p[key])),Math.max(...both.map(p=>p[key]))];
  const [lx,hx]=limits('x'),[lz,hz]=limits('z');
  const scale=Math.min(720/(hx-lx),610/(hz-lz)),cx=(lx+hx)/2,cz=(lz+hz)/2;
  const xy=p=>[455+(p.x-cx)*scale,413-(p.z-cz)*scale];
  const t=(x,y,s,n=18,colour='#243e43')=>'<text x="'+x+'" y="'+y+'" font-size="'+n+'" fill="'+colour+'">'+s+'</text>';
  const p=(rows,col,width,dash='')=>'<path d="'+rows.map((r,i)=>(i?'L':'M')+xy(r).map(v=>v.toFixed(2)).join(' ')).join(' ')+'" fill="none" stroke="'+col+'" stroke-width="'+width+'" stroke-dasharray="'+dash+'" stroke-linecap="round"/>';
  const marker=(rows,station,n,col)=>{
    const pt=rows.find(r=>r.trackM===station),[x,y]=xy(pt);
    return '<circle cx="'+x+'" cy="'+y+'" r="11" fill="'+col+'" stroke="white"/>'+t(x-3.7,y+4,n,12,'white');
  };
  const colours={old:'#687184',road:'#158577',link:'#c57540',new:'#17474a'};
  const inside=(x,from,to)=>x.filter(r=>r.trackM>=from&&r.trackM<=to);
  const sunAngle=Math.atan2(sun[0],sun[2]),u=70*Math.sin(sunAngle),v=-70*Math.cos(sunAngle);
  const out=['<svg xmlns="http://www.w3.org/2000/svg" width="1220" height="785" viewBox="0 0 1220 785" role="img" aria-label="Kenting installation plan comparison">',
    '<rect width="1220" height="785" fill="#faf9f2"/><g font-family="Segoe UI,Arial,sans-serif">',
    t(38,48,'Kenting relocation in the game world',33),t(40,78,'Identical horizontal scale on both axes · world +X right / +Z up',17),
    p(before,colours.old,5,'8 7'),p(inside(after,a,b),colours.link,5),p(inside(after,b,c),colours.road,6),p(inside(after,c,d),colours.link,5),
    marker(before,site.coreStart-site.delta,'S',colours.old),marker(after,site.coreStart,'S',colours.road),
    marker(before,site.coreStart-site.delta+towerOffset,'T',colours.old),marker(after,site.coreStart+towerOffset,'T',colours.road),
    marker(after,a,'1',colours.new),marker(after,b,'2',colours.new),marker(after,c,'3',colours.new),marker(after,d,'4',colours.new)];
  const items=[
    ['Accepted coast · dashed',colours.old],['Installed approach and cape',colours.road],['Entry and exit connectors',colours.link],
    ['S   Core entry · '+(site.coreStart-site.delta)+' → '+site.coreStart,'#274347'],
    ['T   Tower · '+(site.coreStart-site.delta+towerOffset)+' → '+(site.coreStart+towerOffset),'#274347'],
    ['1    A6 ends · '+a,'#274347'],['2    Placed road begins · '+b,'#274347'],
    ['3    Exit connector begins · '+c,'#274347'],['4    Original route resumes · '+d,'#274347']
  ];
  items.forEach(([s,col],i)=>out.push(t(818,152+i*38,s,19,col)));
  out.push(t(818,551,'Rigid world translation',21),t(818,582,'X '+translation[0].toFixed(1)+' m  ·  Z '+translation[2].toFixed(1)+' m',18),
    t(818,610,'Y unchanged  ·  yaw unchanged',18),
    '<defs><marker id="tip" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5z" fill="#a6602b"/></marker></defs>',
    '<path d="M106 202 l'+u+' '+v+'" fill="none" stroke="#a6602b" stroke-width="3" marker-end="url(#tip)"/>',t(48,232,'Fixed sun (XZ)',15),
    '<path d="M42 714 h'+(500*scale)+'" fill="none" stroke="#274347" stroke-width="3"/>',t(42,736,'500 m',15),
    t(818,717,'Stations in metres; HUD = station − 350.',16),
    '</g></svg>');
  return out.join('\n')+'\n';
}
