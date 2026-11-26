import {zones, edge, grade, laneWidth, smooth} from './route.mjs';

// Positive capacity zones have separate approach/exit courts. Negative zones
// carry the missing lane through as a single service road and return it downstream.
const places=[
  {inlet:'轉運中心',outlet:'公園東門',lead:56,tail:54,rise:.32},
  {inlet:'市場貨運道',outlet:'市場貨運道',rise:1.65},
  {inlet:'港務道路',outlet:'碼頭聯絡道',lead:59,tail:131,rise:.36},
  {inlet:'百貨停車層',outlet:'百貨停車層',rise:4.35}
];
export const connections=[],decisions=[];
zones.forEach(([a,b,side,delta],i)=>{
  const site=places[i],wide=laneWidth*(delta>0?3:2);
  const pair=delta<0;
  for(const [start,end,gain,title] of [[a,a+115,delta,site.inlet],[b-100,b,-delta,site.outlet]]){
    decisions.push({start,end,side,gain,title,from:start===a?4:4+delta});
  }
  if(pair)connections.push({from:a,to:b,a,b,side,wide,pair,rise:site.rise,title:site.inlet});
  else{
    connections.push({from:a-site.lead,to:a+115,a,b:a+115,side,wide,terminal:a-site.lead,dir:-1,rise:site.rise,title:site.inlet});
    connections.push({from:b-100,to:b+site.tail,a:b-100,b,side,wide,terminal:b+site.tail,dir:1,rise:site.rise,title:site.outlet});
  }
});

export function section(c,d){
  const race=edge(d,c.side);
  const separate=Math.min(1,Math.max(0,(c.wide-race)/laneWidth));
  const approach=c.pair?0:1-smooth((d-c.terminal)*-c.dir,0,Math.abs(c.terminal-(c.dir<0?c.a:c.b)));
  const offset=separate*separate*(c.pair?4.8:4.3)+approach*4.0;
  const outer=c.wide+offset,inner=Math.max(race,outer-laneWidth);
  const lifted=.42*smooth(inner-race,0,1.7);
  const lift=lifted+(c.pair?c.rise*smooth(d,c.a+88,c.a+200)*(1-smooth(d,c.b-195,c.b-81)):0);
  return {race,inner,outer,lift,middle:outer-laneWidth/2};
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
      const w=s.outer-s.inner,W=n.outer-n.inner;
      if(Math.min(w,W)>.33)band(d,e,s.outer-.22,s.outer-.105,n.outer-.22,n.outer-.105,y+.015,Y+.015,edgePaint);
      if(Math.min(s.inner-s.race,n.inner-n.race)>.60)
        band(d,e,s.inner+.13,s.inner+.23,n.inner+.13,n.inner+.23,y+.018,Y+.018,edgePaint);
      if(Math.min(s.inner-s.race,n.inner-n.race)>.18){
        // Closed wedge between the race edge and the physically separated route.
        band(d,e,s.race+.05,s.inner,n.race+.05,n.inner,.045,.045,0x868985);
        if(i%3===0)band(d,e,s.race+.11,s.race+.35,n.inner-.39,n.inner-.15,.068,.068,edgePaint);
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
  for(const c of connections){
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
