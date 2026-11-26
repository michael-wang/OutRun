import {zones, edge, grade, laneWidth, smooth} from './route.mjs';

// Positive capacity zones have separate approach/exit courts. Negative zones
// turn behind a local block. The later inlet comes from a different street.
const places=[
  {inlet:'轉運中心',outlet:'公園東門',lead:56,tail:54,rise:.32},
  {inlet:'市場卸貨街',outlet:'東市街',exit:[96,36,0],entry:[103,30,0]},
  {inlet:'港務道路',outlet:'碼頭聯絡道',lead:59,tail:131,rise:.36},
  {inlet:'百貨高架道',outlet:'站前支路',exit:[79,29,5.8],entry:[98,27,0]}
];
export const connections=[],decisions=[];
zones.forEach(([a,b,side,delta],i)=>{
  const site=places[i],wide=laneWidth*(delta>0?3:2);
  const pair=delta<0;
  for(const [start,end,gain,title] of [[a,a+115,delta,site.inlet],[b-100,b,-delta,site.outlet]]){
    decisions.push({start,end,side,gain,title,from:start===a?4:4+delta});
  }
  if(pair){
    for(const [outgoing,spec,mouth,title] of [[true,site.exit,a,site.inlet],[false,site.entry,b,site.outlet]]){
      const [length,reach,rise]=spec,from=outgoing?mouth:mouth-length,to=outgoing?mouth+length:mouth;
      connections.push({from,to,side,wide,pair,outgoing,length,reach,rise,mouth,title});
    }
  }
  else{
    connections.push({from:a-site.lead,to:a+115,a,b:a+115,side,wide,terminal:a-site.lead,dir:-1,rise:site.rise,title:site.inlet});
    connections.push({from:b-100,to:b+site.tail,a:b-100,b,side,wide,terminal:b+site.tail,dir:1,rise:site.rise,title:site.outlet});
  }
});

export function section(c,d){
  const race=edge(d,c.side);
  if(c.pair){
    const u=Math.min(1,Math.max(0,Math.abs(d-c.mouth)/c.length));
    const dx=c.reach*(2*u)/c.length;
    const half=laneWidth*.5*Math.hypot(1,dx);
    const middle=c.wide-laneWidth*.5+c.reach*u*u;
    const lift=c.rise*smooth(u,.22,1.25) + .10*smooth(u,.35,.65);
    return {race,inner:Math.max(race,middle-half),outer:middle+half,middle,lift};
  }
  const separate=Math.min(1,Math.max(0,(c.wide-race)/laneWidth));
  const approach=1-smooth((d-c.terminal)*-c.dir,0,Math.abs(c.terminal-(c.dir<0?c.a:c.b)));
  const offset=separate*separate*4.3+approach*4.0;
  const outer=c.wide+offset,inner=Math.max(race,outer-laneWidth);
  const lifted=.42*smooth(inner-race,0,1.7);
  const lift=lifted;
  return {race,inner,outer,lift,middle:outer-laneWidth/2};
}
// A continuous cross street behind each at-grade fork. The first section is
// cut on the same station plane as the main strip. Its outer lanes and kerbs
// turn together into the street; no fascia or overhead lintel crosses it.
function turnEnd(c,t){
  const dir=c.outgoing?1:-1, at=c.outgoing?c.to:c.from, tail=section(c,at);
  const seam=(tail.outer-tail.inner)/2, start=Math.atan(2*c.reach/c.length);
  const u=Math.min(t,1),angle=start+u*(Math.PI/2-start),radius=c.rise?30:c.outgoing?23:16;
  const d=at+dir*radius*(Math.sin(angle)-Math.sin(start));
  const x=tail.middle+radius*(Math.cos(start)-Math.cos(angle))+Math.max(0,t-1)*35;
  return {d,x,h:grade(at)+tail.lift+(c.rise?2.48*u+.20*Math.sin(Math.PI*u):0),wd:-dir*2.85*Math.sin(angle)*u,
    wx:seam*(1-u)+2.85*Math.cos(angle)*u};
}
// The flyover approaches from beyond the junction, bends across the view and
// carries on across the district. Build the ramp elbow and the receiving deck
// in the same coordinates; each pair of joining vertices is shared exactly.
const deckBegin=-96,deckEnd=112;
function collector(c,t){
  const e=turnEnd(c,1),r=29, angle=Math.min(Math.PI/2,Math.max(0,-t/r));
  const spare=Math.max(0,-t-r*Math.PI/2);
  const dd=t>0?.003*t*t:0, dx=Math.max(0,t);
  const d=e.d+7.35+r*(1-Math.cos(angle))+spare+dd;
  const x=e.x-r*Math.sin(angle)+dx;
  const slope=t>0?.006*t:0;
  const normalD=t>0?1/Math.hypot(1,slope):Math.cos(angle);
  const normalX=t>0?-slope*normalD:Math.sin(angle);
  const h=e.h+.024*t;
  const lift=smooth(t,deckBegin,-45)*(1-smooth(t,65,deckEnd));
  return {d,x,nd:normalD,nx:normalX,h:grade(d)+(h-grade(d))*lift,
    near:-4.5-(t<0?0:5.7*(1-smooth(t,2,48))),far:4.5};
}
// Once the ramp leaves the mainline, keep its local street frame straight.
// A changing race-road heading would shear the viaduct at this large offset.
function offRoad(c,d,x,y,physicalPos){
  if(!c.rise)return physicalPos(d,c.side*x,y);
  const base=physicalPos(c.to,0,y),right=physicalPos(c.to,1,y);
  const rx=right[0]-base[0],rz=right[2]-base[2],step=d-c.to;
  return [base[0]+rx*c.side*x-rz*step,y,base[2]+rz*c.side*x+rx*step];
}
function deckPoint(c,row,w,height,physicalPos){
  return offRoad(c,row.d+row.nd*w,row.x+row.nx*w,row.h+height,physicalPos);
}
function court(c,d){
  const t=(d-c.terminal)*c.dir;
  if(t<0||t>25)return null;
  // A pear-shaped turning court. The throat stays the same width as the road.
  const center=section(c,c.terminal).middle+3.5*smooth(t,0,12);
  const radius=t<12 ? 2.4+4.8*smooth(t,0,12) : 7.2*Math.sqrt(Math.max(0,1-((t-12)/13)**2));
  return {inner:center-radius,outer:center+radius,lift:.42};
}
function bounds(c,d){
  if(d>=c.from && d<=c.to)return section(c,d);
  return c.pair?null:court(c,d);
}
export function openMouth(d,side){
  return decisions.some(j=>j.side===side && d>j.start && d<j.end &&
    Math.abs(edge(d,side)-edge(j.gain>0?j.end:j.start,side))>.12 &&
    Math.abs(edge(d,side)-edge(j.gain>0?j.end:j.start,side))<laneWidth*.60);
}
export function streetEdge(d,side){
  let x=edge(d,side);
  for(const c of connections)if(c.side===side){const s=bounds(c,d);if(s){
    const yard=!c.pair && Math.abs(d-(c.terminal+c.dir*13))<6.8;
    x=Math.max(x,s.outer+(yard?15:0));
  }}
  return x;
}

// Reserve the transverse side street for the full width of a generated plot;
// mainline sidewalks and signal poles continue to follow their own curb.
export function frontageEdge(d,side){
  let clear=streetEdge(d,side);
  for(const c of connections){
    if(!c.pair||c.side!==side)continue;
    if(c.rise){
      if(d>=c.to-5&&d<=c.to+100){
        for(let t=deckBegin;t<=deckEnd;t+=4){
          const row=collector(c,t);
          if(Math.abs(row.d-d)<13)clear=Math.max(clear,row.x+11);
        }
      }
    }else{
      const at=c.outgoing?c.to:c.from;
      if(Math.abs(d-at)<22)clear=Math.max(clear,turnEnd(c,2).x+5);
      // Leave an open sight triangle on the outside of the market bend.
      if(c.outgoing&&d>c.mouth+30&&d<at+8)clear+=6;
    }
  }
  return clear;
}
// Follow the curb on the mainline side once a full sidewalk fits in the fork.
export function roadsideEdge(d,side){
  for(const c of connections)if(c.pair&&c.side===side&&d>=c.from&&d<=c.to){
    const s=section(c,d);
    if(s.inner-s.race>5.6)return s.race;
  }
  return streetEdge(d,side);
}
export function drawConnections({quad,tri,roadUV,physicalPos}){
  const asphalt=0x565857,concrete=0x959991,edgePaint=0xd8d2b5;
  for(const c of connections){
    const begin=c.from-(c.dir===-1?25:0),end=c.to+(c.dir===1?25:0);
    const p=(d,x,h)=>physicalPos(d,c.side*x,grade(d)+h);
    function band(d,e,a,b,A,B,y,Y,color){
      if(color===asphalt){
        quad('road',color,p(d,a,y),p(e,A,Y),p(d,b,y),p(e,B,Y));
        for(const [at,x] of [[d,a],[d,b],[e,A],[e,A],[d,b],[e,B]])roadUV.push(c.side*x,at,1,0);
      }else quad('junctions',color,p(d,a,y),p(e,A,Y),p(d,b,y),p(e,B,Y));
    }
    const cuts=[begin,c.from,c.to,end,...Array.from({length:Math.ceil((end-begin)/3)},(_,i)=>begin+i*3)].sort((a,b)=>a-b);
    for(let i=1;i<cuts.length;i++){
      const d=cuts[i-1],e=cuts[i];if(e<=d)continue;
      const s=bounds(c,d),n=bounds(c,e);if(!s||!n)continue;
      const y=s.lift+.004,Y=n.lift+.004;
      band(d,e,s.inner,s.outer,n.inner,n.outer,y,Y,asphalt);
      // Deck fascia follows the grade and the turn; a raised service ramp
      // has a visible outside edge rather than a floating strip of paint.
      for(const k of ['inner','outer']){
        quad('junctions',concrete,p(d,s[k],y-.56),p(e,n[k],Y-.56),p(d,s[k],y),p(e,n[k],Y));
      }
      if(d<c.from||e>c.to)continue;
      if(c.pair&&!c.rise&&Math.min(s.inner-s.race,n.inner-n.race)>1.0){
        for(const [key,dir] of [['outer',1],['inner',-1]]){
          band(d,e,s[key],s[key]+dir*.82,n[key],n[key]+dir*.82,y+.14,Y+.14,concrete);
          quad('junctions',concrete,p(d,s[key],y),p(e,n[key],Y),p(d,s[key],y+.14),p(e,n[key],Y+.14));
        }
      }
      const w=s.outer-s.inner,W=n.outer-n.inner;
      if(Math.min(w,W)>.33)band(d,e,s.outer-.22,s.outer-.105,n.outer-.22,n.outer-.105,y+.015,Y+.015,edgePaint);
      if(Math.min(s.inner-s.race,n.inner-n.race)>.60)
        band(d,e,s.inner+.13,s.inner+.23,n.inner+.13,n.inner+.23,y+.018,Y+.018,edgePaint);
      if(Math.min(s.inner-s.race,n.inner-n.race)>.18){
        // Closed wedge between the race edge and the physically separated route.
        const limit=c.pair?4.2:100;
        if(s.inner-s.race>limit||n.inner-n.race>limit)continue;
        band(d,e,s.race+.05,s.inner,n.race+.05,n.inner,.045,.045,0x868985);
        if(i%3===0)band(d,e,s.race+.11,s.race+.35,n.inner-.39,n.inner-.15,.068,.068,edgePaint);
      }
    }
    if(c.pair){
      let last=turnEnd(c,0);
      for(const t of [.125,.25,.375,.5,.625,.75,.875,1,1.25,1.5,1.75,2]){
        if(c.rise&&t>1)break;
        const next=turnEnd(c,t);
        const corner=(v,k,lift)=>offRoad(c,v.d+k*v.wd,v.x+k*v.wx,v.h+.004+lift,physicalPos);
        const points=[corner(last,-1,0),corner(next,-1,0),corner(last,1,0),corner(next,1,0)];
        quad('road',asphalt,...points);
        for(const v of [points[0],points[2],points[1],points[1],points[2],points[3]])roadUV.push(v[0],v[2],1,0);
        for(const k of [-1,1]){
          if(c.rise){
            quad('junctions',0x80908d,corner(last,k,-.65),corner(next,k,-.65),corner(last,k,0),corner(next,k,0));
            // The far side opens onto the adjoining collector right at the join.
            const high=k>0||t<.88?.43:.09;
            quad('junctions',concrete,corner(last,k,0),corner(next,k,0),corner(last,k,high),corner(next,k,high));
            quad('junctions',0xd8d4be,corner(last,k,high),corner(next,k,high),corner(last,k*.93,high),corner(next,k*.93,high));
            continue;
          }
          quad('junctions',concrete,corner(last,k,-.38),corner(next,k,-.38),corner(last,k,.14),corner(next,k,.14));
          quad('junctions',concrete,corner(last,k,.14),corner(next,k,.14),corner(last,k*1.38,.14),corner(next,k*1.38,.14));
        }
        last=next;
      }
    }
    if(c.rise&&c.pair){
      const pt=(v,w,up)=>deckPoint(c,v,w,up+.004,physicalPos);
      // Keep the upstream half on its own edge at t=0. The downstream first
      // section contains both lanes plus the ramp, with an open joining seam.
      for(let t=deckBegin;t<deckEnd;t+=2){
        const a=collector(c,t),b=collector(c,t+2);
        if(t<0&&t+2===0)b.near=-4.5;
        const pts=[pt(a,a.near,0),pt(b,b.near,0),pt(a,a.far,0),pt(b,b.far,0)];
        quad('road',asphalt,...pts);
        for(const v of [pts[0],pts[2],pts[1],pts[1],pts[2],pts[3]])roadUV.push(v[0],v[2],1,0);
        for(const k of ['near','far']){
          const w=a[k],W=b[k],inward=k==='near'?1:-1;
          const high=k==='near'&&t<0&&t>=-8?.08:.60;
          quad('junctions',0x677b79,pt(a,w,-.78),pt(b,W,-.78),pt(a,w,high),pt(b,W,high));
          quad('junctions',0xe0dfcb,pt(a,w,high),pt(b,W,high),pt(a,w+.32*inward,high),pt(b,W+.32*inward,high));
          quad('junctions',edgePaint,pt(a,w+.42*inward,.028),pt(b,W+.42*inward,.028),pt(a,w+.56*inward,.028),pt(b,W+.56*inward,.028));
        }
        for(const w of [0,...(t>=0&&t<42?[-4.5]:[])]){
          if((t-deckBegin)%12<4)quad('junctions',edgePaint,pt(a,w-.09,.03),pt(b,w-.09,.03),pt(a,w+.09,.03),pt(b,w+.09,.03));
        }
      }
    }
    if(!c.pair){
      // A short transverse access street ties the turning loop to the depot or
      // guarded park/port entrance. The mouth follows the edge of the apron.
      const hub=c.terminal+c.dir*13;
      for(let d=hub-3.2;d<hub+3.19;d+=1.6){
        const e=d+1.6,s=court(c,d),n=court(c,e);
        band(d,e,s.outer,s.outer+15,n.outer,n.outer+15,.424,.424,asphalt);
        // Only side-street traffic meets the stop bar.
        band(d,e,s.outer+3.9,s.outer+4.19,n.outer+3.9,n.outer+4.19,.451,.451,edgePaint);
      }
    }
    // Forward arrows are printed on the separated branch only. Its outer edge
    // carries on tangentially into the wide lane while the through lanes keep their IDs.
    for(let d=c.from+18;d<c.to-7;d+=57){
      const sec=section(c,d);
      if(sec.middle-sec.race<1.35)continue;
      const vertices=[[-.18,-2.7],[.18,-2.7],[.18,.25],[.86,.25],[0,2.35],[-.86,.25],[-.18,.25]];
      const pts=vertices.map(([x,z])=>{const s=section(c,d+z);return p(d+z,s.middle+x,s.lift+.072);});
      for(const [i,j,k] of [[0,1,2],[0,2,6],[5,3,4]])tri('junctions',edgePaint,pts[i],pts[j],pts[k]);
    }
  }
}
export function junctionFurniture({box,link,label,physicalPos}){
  const post=0x657476,cream=0xd7d6bc;
  function lamp(d,side,style){
    const x=side*(streetEdge(d,side)+.81),y=grade(d)+.26;
    const h=style==='bridge'?10.1:style==='boulevard'?8.1:6.3;
    const reach=style==='local'?1.7:2.95;
    box(d,x,y,.19,h,.19,'post',post);
    link(physicalPos(d,x,y+h-.53),physicalPos(d,x-side*reach,y+h+.22),.14,.16,'post',d,post);
    box(d,x-side*(reach-.22),y+h+.12,1.05,.18,.48,'trim',cream);
  }
  for(const [a,b,s,step,style] of [[110,1060,-1,45,'local'],[1090,2150,1,45,'boulevard'],[2240,4150,1,51,'local'],[4300,5645,-1,55,'bridge'],[4300,5645,1,55,'bridge'],[5690,6510,-1,41,'boulevard']]){
    for(let d=a;d<b;d+=step)lamp(d,s,style);
  }
  // Green on the through route during the race; a separate three-aspect head
  // above the bypass controls local traffic. No stopping cue crosses the race.
  for(const j of decisions.filter(j=>[1120,2330,5950].includes(j.start))){
    const d=j.start+17,v=j.side,x=v*(streetEdge(d,v)+.84),y=grade(d)+.24,face=v*(edge(d,v)-.68);
    const tip=face-v*.90;
    box(d,x,y,.28,6.58,.28,'post',post);
    box(d,(x+tip)/2,y+6.36,Math.abs(x-tip)+.24,.23,.26,'metal',post);
    box(d-.08,face,y+5.86,2.06,.77,.45,'metal',0x353a38);
    for(let k=0;k<3;k++){
      const lampX=face+v*(k-1)*.61;
      box(d-.33,lampX,y+6.04,.38,.38,.11,'trim',k===2?0x73f0a0:0x4c5250);
      box(d-.40,lampX,y+6.46,.53,.075,.48,'metal',0x383f40);
    }
  }
  function cornerBuildings(c){
    if(c.rise){
      // Open the view under and across the elevated road. Only the distant
      // landing sits behind a street block. Supports carry the receiving
      // roadway, independently of the piers on the ramp.
      for(const t of [-76,-52,-28,-4,20,44,68,91]){
        const row=collector(c,t),y=grade(row.d);
        if(row.h-y<1.35)continue;
        const top=deckPoint(c,row,0,-.55,physicalPos),basePoint=[top[0],y-.22,top[2]];
        link(basePoint,top,1.55,1.75,'plinth',row.d,0x97a4a0,true);
        link(deckPoint(c,row,-4,-.78,physicalPos),deckPoint(c,row,4,-.78,physicalPos),1.4,.60,'metal',row.d,0x647774,true);
        if(t===-76||t===91)continue;
        // Road lamps on the far parapet cue the direction and scale of the flyover.
        const foot=deckPoint(c,row,row.far,.42,physicalPos);
        const head=[foot[0],foot[1]+4.75,foot[2]];
        link(foot,head,.14,.14,'post',row.d,post,true);
        link(head,deckPoint(c,row,row.far-1.75,5.28,physicalPos),.19,.17,'metal',row.d,post,true);
      }
      const e=turnEnd(c,1),far=e.d-21,x=c.side*(e.x+78),y=grade(far);
      box(far,x,y-.08,23,17,16,'loft',0x919b9c);
      box(far+2,x+c.side*3,y+17,16,5,11,'tower',0x869998);
      return;
    }
    // Set the building back on the inside of the *far* corner. The wider
    // radius, open sky and two kerbs show the diverging street before it
    // passes the block. Nothing spans the street or faces its first tangent.
    const dir=c.outgoing?1:-1, end=turnEnd(c,1);
    const at=end.d+dir*22,y=grade(at),x=c.side*(end.x-22);
    box(at,x,y-.12,17,6.7,12,'loft',0xa3a798);
    box(at,x,y+6.55,17.5,.36,12.4,'trim',0xc2c0ad);
    for(const dx of [-5,0,5])box(at-dir*6.05,x+dx,y+.22,3.55,3.1,.18,'metal',0x626e6a);
    const far=end.d-16,farX=c.side*(end.x+32),base=grade(far);
    box(far,farX,base-.10,19,5.6,7,'loft',0x80918b);
    box(far,farX,base+5.50,19.5,.22,7.45,'trim',0xb2b5a9);
  }
  for(const c of connections){
    if(c.pair)cornerBuildings(c);
    for(let d=c.from+4;d<c.to-1;d+=9){
      const s=section(c,d);
      if(s.outer-s.race<.35)continue;
      const y=grade(d),v=c.side;
      const h=s.inner-s.race>1.3?.57:.73;
      // Delineators are on the closed side of the race boundary.
      if(s.inner-s.race>.64){
        box(d,v*(s.race+.25),y+.045,.18,h,.20,'post',cream);
        box(d,v*(s.race+.25),y+h-.12,.19,.16,.22,'guide',0xc88a38);
      }
      if(s.lift>1.05||d>=5410&&d<=5670){
        const e=Math.min(d+9,c.to),n=section(c,e);
        for(const k of ['inner','outer']){
          if(k==='inner'&&s.inner-s.race<.85)continue;
          const a=physicalPos(d,v*s[k],y+s.lift+.49),b=physicalPos(e,v*n[k],grade(e)+n.lift+.49);
          link(a,b,.18,.18,'metal',d,post);
          box(d,v*s[k],y+s.lift,.19,.51,.21,'post',cream);
        }
        if((d-c.from-4)%27===0){
          const base=d>=5450&&d<5660?1.15:y-.15;
          box(d,v*s.middle,base,.9,Math.max(.17,y+s.lift-.49-base),1.32,'plinth',0x88938f);
        }
      }
    }
    if(!c.pair){
      const d=c.terminal+c.dir*13,v=c.side,s=court(c,d),x=v*((s.inner+s.outer)/2),y=grade(d)+s.lift+.06;
      box(d,x,y,3.4,.16,5.7,'curb',cream);
      box(d,x,y+.16,2.9,.35,4.7,'green',0x829377);
      // Transverse stop bar and a three-aspect head face local approaching traffic.
      // The public court has its own lane control; the racing lanes stay green.
      const sd=c.terminal-c.dir*8,ss=section(c,sd),sx=v*(ss.outer+.52),sy=grade(sd)+ss.lift+.04;
      box(sd,sx,sy,.19,4.35,.19,'post',post);
      box(sd,sx-v*1.20,sy+4.15,2.55,.19,.22,'metal',post);
      box(sd,sx-v*2.22,sy+3.67,1.64,.61,.48,'metal',0x343d40);
      for(let k=0;k<3;k++)box(sd-.26,sx-v*(1.73+k*.47),sy+3.81,.34,.33,.09,'trim',k===2?0x76c99c:0x495653);
      box(sd-2.1,v*ss.middle,grade(sd-2.1)+ss.lift+.07,3.35,.028,.34,'roadPaint',cream);
      label(d-.16,x,y+2.5,4.6,1.1,c.title,'#486761');
      box(d,x,y+.16,.18,2.8,.18,'post',post);
      const gate=v*(s.outer+12.6);
      for(const off of [-3.65,3.65]){
        box(d+off,gate,y-.05,.52,4.75,.56,'post',post);
      }
      box(d,gate,y+4.65,4.2,.48,8.5,'canopy',c.dir<0?0x718788:0x918673);
      box(d+4.55,gate,y-.04,3.15,2.65,1.9,'plinth',0x87938e);
      box(d+4.55,gate-v*1.64,y+1.05,.15,1.15,1.55,'metal',0x4c6265);
      // The second signal is aimed across the public side street.
      const stem=v*(s.outer+3.15);
      box(d+3.55,stem,y,.17,3.48,.17,'post',post);
      box(d+3.55,stem,y+2.75,.49,1.32,.54,'metal',0x353e40);
      for(let i=0;i<3;i++)box(d+3.55,stem+v*.26,y+2.83+i*.40,.08,.27,.30,'trim',i===2?0xd19a6c:0x505b59);

    }
  }
}
