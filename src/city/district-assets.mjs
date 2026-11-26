// Original, editable architectural modules. Dimensions are metres in each site's
// tangent frame. Atlas slots 16–31 are baked by art/source/city/bake-street-atlas.mjs.
const shopNames=[16,17,18,19,20,21,22,23];
const tile={display:24,brick:28,patina:29,louvre:30,paper:31};
function vessel({panel},x,z,rings,skin,cap,n=12){
 for(let i=0;i<n;i++){
  const ring=(j,k)=>[x+Math.cos(k*2*Math.PI/n)*rings[j][1],rings[j][0],z+Math.sin(k*2*Math.PI/n)*rings[j][1]];
  for(let j=1;j<rings.length;j++)panel(ring(j-1,i),ring(j-1,i+1),ring(j,i+1),ring(j,i),skin);
  const last=rings.length-1,center=[x,rings[last][0],z];panel(center,ring(last,i),ring(last,i+1),center,cap);
 }
}

export function finishCityDistricts({site,M,edge,frontages}){
 // Alternate addresses and upper-storey finishes according to parcel use.
 // Signs project into the arcade; the back of each display sits against its own shop.
 for(const p of frontages){
  if(p.offset!==undefined||p.at>7095||p.width<5)continue;
  const {at,side,width:w}=p,id=p.index??p.seed??0,trade=Math.abs(id*5+(side>0?2:0)+Math.floor(at/430))%8;
  const ground=p.style?(p.style==='market'||p.style==='workshop'?4.7:3.8):p.storey+.65;
  const arc=p.style?2.7:p.arcade,street=edge(at,side)+p.setback;
  if(!Number.isFinite(arc+ground+street))continue;
  site(at,side*street,'address',({box,panel,brace})=>{
   const bays=Math.max(1,p.bays??Math.floor(w/5)),bay=w/bays;
   for(let i=0;i<bays;i++){
    const z=(i+.5)*bay-w*.5;
    const x=side*(arc-.63);
    // Limit span on curved parcels; construction joints separate adjoining bays.
    const dz=Math.min(bay*.39,2.55);
    panel([x,.46,z-side*dz],[x,.46,z+side*dz],[x,ground-.87,z+side*dz],[x,ground-.87,z-side*dz],tile.display+(i+trade)%4);
    if((i+trade)%3===0)box(x-side*.13,.29,z,.45,.25,dz*2.12,M.stone);
   }
   // Model a shallow reveal, lintel and either a brick pier or a louvred bay.
   // Restrict the treatment to the actual first occupied upper floor.
   if(p.levels>1&&id%4!==3){
    const top=ground+(p.style?2.90:p.storey-.15),rise=top-ground;
    for(let i=0;i<bays;i++){
     const z=(i+.5)*bay-w*.5,glass=Math.min(bay*.59,3.9),xf=side*.05;
     const face=(dz,y)=>[xf,y,z+side*dz];
     panel(face(-glass*.5,ground+.58),face(glass*.5,ground+.58),face(glass*.5,top-.43),face(-glass*.5,top-.43),M.glazing);
     box(xf-side*.22,top-.46,z,.74,.20,glass+.45,M.stone);
     if(i===0||trade%3===1)box(xf,ground+.05,z-bay*.44,.48,rise-.08,bay*.13,tile.brick);
     if(trade%3===2&&i%2===0)box(xf-side*.27,ground+.65,z+glass*.3,.24,rise-.97,glass*.35,tile.louvre);
    }
   }
   if(id%3===1&&p.levels>1){
    // Sun screens stand off the masonry, allowing the underlying window to read.
    const z=w*.28,h=Math.min(2.55,ground-.8);
    for(let i=0;i<5;i++)box(-side*.30,ground+.28,z+(i-2)*.41,.67,h,.10,M.timber);
   }
   if(id%4!==0){
    const z=-w*.29,span=Math.max(1.18,Math.min(2.16,street-edge(at,side)-.68));
    const h=ground+.12,height=trade%3===0?3.70:2.65;
    const x=-side*(span*.53);
    box(x,h,z,span,height,.26,M.enamel,0xb7ab8f,shopNames[trade]);
    brace([0,h+height+.35,z],[-side*(span-.15),h+height+.06,z],.095,M.steel);
   }
  });
 }

 // The park pavilions become inhabited winter gardens. A ribbed lantern roof
 // grows out of each existing oval drum rather than occupying the playing field.
 for(const d of [1435,1840])site(d,41,'winter-garden',t=>{
  const {panel,brace}=t,sections=16;
  const pt=(i,r,y)=>[Math.cos(i*2*Math.PI/sections)*r,y,Math.sin(i*2*Math.PI/sections)*r*1.35];
  for(let i=0;i<sections;i++){
   panel(pt(i,10.7,7.66),pt(i+1,10.7,7.66),pt(i+1,4.5,12.7),pt(i,4.5,12.7),i%4===0?tile.patina:M.glazing);
   brace(pt(i,10.76,7.72),pt(i,4.50,12.77),.26,M.enamel);
   panel(pt(i,4.55,12.72),pt(i+1,4.55,12.72),pt(i+1,3.48,14.22),pt(i,3.48,14.22),tile.patina);
  }
  vessel(t,0,0,[[13.9,4.95],[15.0,.36]],tile.patina,M.enamel);
 });
 // A cycling garden occupies the widening between the civic walk and its
 // secondary path. Paired ribbon loops stand together on a continuous plinth.
 site(1585,-37,'cycle-garden',t=>{
  t.box(0,.26,0,8.4,.28,32,M.stone);
  for(let k=0;k<3;k++){
   const z=(k-1)*8.1,r=3.0+.47*k;
   const rim=(i,f,y)=>{const a=i*Math.PI/12;return [Math.sin(a)*r*f+.36*Math.sin(2*a)+y,r+.6+r*Math.cos(a)*f,z+Math.sin(a)*1.55+y*.33];};
   for(let i=0;i<24;i++){
    t.panel(rim(i,1,0),rim(i+1,1,0),rim(i+1,.81,0),rim(i,.81,0),k===1?tile.patina:M.enamel);
    t.panel(rim(i,1,0),rim(i+1,1,0),rim(i+1,1,.23),rim(i,1,.23),M.timber);
   }
  }
 });
 // Lidded market hampers and handcarts bracket the covered street's approach.
 for(const [at,x] of [[2588,22],[2675,21],[2835,25]])site(at,x,'market-porters',t=>{
  for(const dz of [-2,1,3.9]){
   t.box(0,.34,dz,1.8,.50,2.35,M.timber);
   t.box(0,.86,dz,1.65,.24,2.21,(dz<0?M.oranges:M.pears));
  }
  t.brace([-.96,.36,-3.35],[-1.05,1.36,-4.07],.12,M.steel);
 });
 // The turn leaving the park briefly frames a waterside plant nursery.
 // Keep the walkway in front and the neighbouring school field unobstructed.
 site(2100,-53,'propagation-house',t=>{
  for(let i=0;i<4;i++){const z=i*4.4;
   t.panel([-3.7,2.85,z],[0,5.44,z],[0,5.44,z+4.33],[-3.7,2.85,z+4.33],M.glazing);
   t.panel([0,5.44,z],[3.7,2.85,z],[3.7,2.85,z+4.33],[0,5.44,z+4.33],M.glazing);
   for(const x of [-3.7,3.7]){t.brace([x,.29,z],[x,2.86,z],.16,M.enamel);t.brace([x,2.86,z],[0,5.44,z],.19,M.enamel);}
   t.box(0,.48,z+2.2,5.85,.81,3.75,M.timber);t.box(0,1.29,z+2.2,5.65,.42,3.5,M.pears,0x739660);
  }
 });
 // Folded pennants track the actual front of the produce counters. No cable over a race lane.
 for(const [at,off,bays] of [[2730,24,4],[2779,27,3]])site(at,off,'market-lanterns',t=>{
  for(let j=0;j<bays;j++){
   const z=j*8.2;
   t.brace([-5.95,3.7,z-3.0],[-5.95,7.45,z-3.0],.14,M.steel);
   t.brace([-5.95,7.40,z-3.0],[-5.95,6.84,z+.95],.085,M.steel);
   t.brace([-5.95,6.84,z+.95],[-5.95,7.40,z+5.2],.085,M.steel);
   t.brace([-5.95,6.84,z+.95],[-5.95,6.35,z+.95],.07,M.steel);
   vessel(t,-5.95,z+.95,[[4.47,.30],[4.81,.71],[5.44,.86],[6.04,.68],[6.33,.32]],j%2?M.rustCanvas:tile.paper,M.timber,10);
   t.box(-5.95,4.22,z+.95,.11,.31,.13,M.timber);
  }
 });
 // Visible above the loading halls: bins with hopper bottoms, legs, landings and feed gallery.
 for(const [at,side,off,count] of [[3728,1,40,3],[3824,1,42,2]]){
  site(at,side*(edge(at,side)+off),'grain-exchange',t=>{
   for(let j=0;j<count;j++){const z=j*11.2,r=4.35,h=17.8+(j%2)*2.25;
    for(const x of [-2.8,2.8])for(const dz of [-2.8,2.8])t.brace([x,.22,z+dz],[x,7.6,z+dz],.44,M.steel);
    vessel(t,0,z,[[3.2,1.1],[7,r],[h,r],[h+1.6,1.0]],M.zinc,tile.patina,16);
    t.box(0,19.8,z,2.67,1.52,11.25,tile.patina);
    t.box(-4.34,9.4,z,1.05,3.70,2.9,M.enamel,0xffffff,21);
   }
  });
 }
 for(const [at,x,n] of [[3597,30,4],[3788,33,3]])site(at,x,'distribution-gantry',t=>{
  for(let j=0;j<n;j++){
   const z=j*10;
   for(const dx of [-5.2,5.2])t.brace([dx,.30,z],[dx,8.2,z],.47,M.steel);
   t.brace([-5.4,7.7,z],[5.4,7.7,z],.45,tile.patina);
   t.panel([-5.7,8,z-.3],[-5.7,8,z+9.7],[.4,10,z+9.7],[.4,10,z-.3],M.zinc);
   t.panel([.4,10,z-.3],[.4,10,z+9.7],[5.8,8.4,z+9.7],[5.8,8.4,z-.3],tile.patina);
   if(j===0)t.box(0,5.84,z-.35,6.5,1.8,.31,M.steel,0xffffff,21);
  }
 });
 // Bridge bents: tapered transverse crown and perforated knee braces. The lower
 // edge is 27 m above the deck. The existing cable anchorages stay in sight.
 for(const at of [4790,5200]){
  const x=(edge(at,1)-edge(at,-1))/2,w=(edge(at,1)+edge(at,-1))/2+4;
  site(at,x,'harbour-crown',t=>{
   for(const z of [-1.97,1.97]){
    for(const s of [-1,1]){
     t.brace([s*w,26.8,z],[s*(w*.53),33.8,z],.83,tile.patina);
     t.brace([s*w,37.8,z],[s*(w*.55),33.8,z],.47,M.enamel);
     t.panel([s*w,27,z],[s*w,32.9,z],[s*(w-.91),32.9,z],[s*(w-.91),28.15,z],tile.patina);
    }
    t.box(0,33.4,z,2*w+2,.83,.29,tile.patina);
   }
   for(const s of [-1,1]){
    t.box(s*w,24.3,0,3.58,.50,5.0,tile.patina);
    for(const z of [-2.3,2.3])t.brace([s*w,24.3,z],[s*w,26,z],.15,M.steel);
    t.brace([s*w,26,-2.3],[s*w,26,2.3],.15,M.steel);
   }
  });
 }
 // Mall corners: folded bronze fins curve around the real glazed atrium. Keep
 // the space between the department store and the elevated connector open.
 for(const [at,side] of [[5820,-1],[6152,1],[6380,-1]]){
  const center=side*(edge(at,side)+29);
  site(at,center,'department-hall',t=>{
   const fx=-side*13.95;
   for(let i=0;i<8;i++){
    const z=-35+i*9.25,pt=(dx,y,dz)=>[fx+side*dx,y,z+dz];
    t.panel(pt(0,.7,-4.5),pt(0,.7,4.5),pt(0,11.9,4.5),pt(0,11.9,-4.5),i%4===1?tile.display+2:M.glazing);
    t.brace(pt(-.54,2.1,-3.8),pt(-.54,12.2,2.4),.31,M.enamel);
    t.panel(pt(-.2,11.9,-4.62),pt(-.2,11.9,4.62),pt(-1.05,13.4,4.62),pt(-1.05,13.4,-4.62),tile.patina);
   }
   // A two-storey precast screen wraps the approach-facing end wall.
   for(let j=0;j<7;j++){
    const x=-side*(11.2-j*3.25);
    t.box(x,1.1,-41.17,2.96,10.7,.3,M.steel,0xffffff,j%3===0?22:M.glazing);
    t.brace([x-1.45,1,-41.5],[x-.62,12.9,-42.4],.27,M.enamel);
   }
  });
  site(at-30,side*(edge(at,side)+24),'gallery-atrium',t=>{
   for(let i=0;i<=12;i++){const a=-1.64+i*.23;
    const point=(angle,r,y)=>[-side*Math.cos(angle)*r,y,Math.sin(angle)*r*1.29];
    const p=point(a,8.58,3.2),q=point(a+.18,9.32,17.8);
    t.panel(p,point(a+.095,8.95,3.2),point(a+.275,9.74,17.8),q,tile.patina);
    t.brace(p,q,.16,M.enamel);
   }
  });
 }
 // Finish arcade: repeated shallow northlights turn the existing frames into
 // a station canopy; an enamel fascia and clock housing carry the final sightline.
 for(let d=6540;d<6650;d+=22)site(d,-8.7,'station-northlight',t=>{
  t.panel([-3.45,9.04,-10.9],[3.45,9.04,-10.9],[3.45,11.3,-3],[-3.45,11.3,-3],M.glazing);
  t.panel([-3.45,11.3,-3],[3.45,11.3,-3],[3.45,9.04,10.9],[-3.45,9.04,10.9],tile.patina);
  for(const z of [-10.7,-6.9,-3.0])t.brace([-3.5,9.15+(z+10.7)*.29,z],[3.5,9.15+(z+10.7)*.29,z],.18,M.enamel);
 });
 // A station forecourt has a direction of travel: passengers approach the
 // ticket windows under a folded canopy, then turn towards the boarding bays.
 for(const [at,x,n] of [[6830,-34,3],[6895,-31,3]]){
  site(at,x,'ticket-loggia',t=>{
   // Two shallow ticket-hall wings enclose the far edge of the paved forecourt.
   // The ridge and glazing sit behind the ticket counters at ground level.
   const span=n*5.7+8,cz=(n-1)*2.85;
   t.box(-9.5,.18,cz,10.4,6.9,span,tile.brick);
   for(let j=0;j<n+1;j++){
    const z=cz-span*.5+3.1+j*5.6;
    t.box(-4.23,1.4,z,.28,4.75,3.64,M.glazing);
    t.box(-4.03,5.85,z,.70,.29,4.18,M.stone);
   }
   for(const [a,b,y,Y] of [[-15,-9.4,7.02,10.1],[-9.4,-4.06,10.1,7.02]]){
    t.panel([a,y,cz-span*.53],[b,Y,cz-span*.53],[b,Y,cz+span*.53],[a,y,cz+span*.53],tile.patina);
   }
   for(let i=0;i<n;i++){const z=i*5.7;
    t.box(0,.19,z,8.4,.34,5.72,M.stone);
    t.box(-2.78,.52,z,.86,3.58,5.4,M.glazing);
    t.box(-1.80,1.32,z,1.65,.25,4.62,M.timber);
    t.brace([3.02,.53,z-2.53],[2.54,4.8,z-2.53],.23,tile.patina);
    t.panel([-3.42,4.10,z-2.84],[3.74,5.10,z-2.84],[3.74,5.10,z+2.84],[-3.42,4.10,z+2.84],tile.patina);
    if(!i)t.box(.6,3.29,z-2.85,3.85,1.26,.21,M.steel,0xffffff,M.rail);
   }
  });
 }
 // The arched headhouse beyond the timing line is the driver's final vanishing point.
 // Fan ribs stand proud of its existing glazing, with a copper sunrise keystone.
 site(7207,0,'terminus-sunburst',t=>{
  const arc=(a,r,z)=>[24*r*Math.cos(a),9.45+13*r*Math.sin(a),z];
  for(let i=0;i<20;i++){
   const a=i*Math.PI/20,b=(i+1)*Math.PI/20;
   t.panel(arc(a,1.012,-1.0),arc(b,1.012,-1.0),arc(b,1.14,-1.28),arc(a,1.14,-1.28),i%4?tile.brick:M.stone);
   if(i>0&&i%2===0)t.brace(arc(a,.27,-1.16),arc(a,.99,-1.16),.31,M.enamel);
  }
  for(const x of [-25,25]){
   t.box(x,1.9,-.55,3.05,10.1,2.30,tile.brick);
   t.box(x,12,-.55,3.8,.64,3.1,M.stone);
  }
  t.box(0,22.0,-.7,4.4,2.39,2.55,M.stone);t.box(0,24.37,-.72,2.36,1.35,1.95,tile.patina);
 });
 site(7036,-24,'clock-lantern',t=>{
  for(const x of [-4.67,4.67]){
   t.box(x,9,0,.85,35,11.45,tile.patina);
   t.brace([x,44,-5],[x*.70,51.9,-3.9],.53,M.enamel);
  }
  for(let i=0;i<5;i++)t.box(0,35+i*1.9,-5.67,8.6,.42,.55,M.enamel);
  vessel(t,0,0,[[51.65,4.72],[53.8,3.15],[56.4,.38]],tile.patina,M.enamel);
 });
}
