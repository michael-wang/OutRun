// Approved low-rise frontages supply the podiums. Only parcels wide and deep
// enough for an independent lift/stair core can take a metropolitan upper tier.
export const towerEligible=p=>!p.style&&p.offset===undefined&&p.width>=14&&p.depth>=13;
const nodes=[
 {from:22,to:312,type:'office',density:.62},
 {from:640,to:1050,type:'office',density:.86},
 {from:3360,to:3620,type:'works',density:.56},
 {from:3940,to:4140,type:'works',density:.55},
 {from:6510,to:7010,type:'homes',density:.87}
];
export const mallPedestals=[[5820,-1],[6152,1],[6380,-1]];
export function towerFor(p){
 if(!towerEligible(p))return null;
 const node=nodes.find(n=>p.at>=n.from&&p.at<=n.to);
 if(!node)return null;
 const id=Math.round(p.at*11)+Number(p.side>0)*37;
 const coin=((id*1664525+1013904223)>>>0)/4294967296;
 if(coin>=node.density)return null;
 return {type:node.type,seed:id};
}

function buildCrown({site,M},p){
 const {at,offset,base,width,depth,type,seed}=p;
 const form=seed%3,tall=type==='office'?12:type==='works'?9:11;
 const floors=tall+seed%7,dy=type==='homes'?3.12:3.65;
 const accent=type==='homes'?[0xd4bca2,0xc6b8a6,0xa99588][form]:[0xcbd3c4,0xbdb6a5,0xa8b5b9][form];
 const skin=type==='works'?0xb1c2b7:type==='homes'?[0xe3d5c1,0xe1d0c8,0xd0d4c7][form]:[0xc0d4da,0xe4e3db,0xc1c8d8][form];
 site(at,offset,'upper-floors',({panel,box,brace})=>{
  // Chamfered office corners, deep residential loggias and masonry service
  // spines use different floor plates. Both tiers fit within the podium roof.
  const profile=(w,l,clip,dx,dz)=>[[-w/2+clip,-l/2],[w/2-clip,-l/2],[w/2,-l/2+clip],[w/2,l/2-clip],[w/2-clip,l/2],[-w/2+clip,l/2],[-w/2,l/2-clip],[-w/2,-l/2+clip]].map(([x,z])=>[x+dx,z+dz]);
  const low=profile(depth,width,type==='office'?Math.min(3,depth*.22):.70,0,0);
  const split=Math.round(floors*(.54+form*.08));
  const high=profile(depth*(type==='homes'?.72:.82),width*(type==='works'?.68:.82),type==='office'?1.8:.65,-p.side*.42,form===1?width*.055:-width*.06);
  const wall=(q,y0,y1,tile,tint)=>{for(let i=0;i<q.length;i++){const a=q[i],b=q[(i+1)%q.length];panel([b[0],y0,b[1]],[a[0],y0,a[1]],[a[0],y1,a[1]],[b[0],y1,b[1]],tile,tint);}};
  const roof=(q,y)=>{for(let i=0;i<q.length;i++){const a=q[i],b=q[(i+1)%q.length];panel([0,y,0],[a[0],y,a[1]],[b[0],y,b[1]],[0,y,0],M.zinc);}};
  const terrace=(level,q)=>{const scaled=q.map(([x,z])=>[x*1.045,z*1.045]);wall(scaled,level,level+.37,M.stone,accent);roof(scaled,level+.37);};
  for(let f=0;f<floors;f++){
   const y=base+f*dy,q=f<split?low:high;
   wall(q,y,y+dy,type==='office'?7:type==='works'?8:9,skin);
   const solidBand=type==='homes'?.63:type==='works'?.96:.22;
   wall(q.map(([x,z])=>[x*1.003,z*1.003]),y+.03,y+solidBand,M.stone,accent);
   if(type==='homes'&&f%2===0){
    const wd=f<split?depth:depth*.72,ln=f<split?width:width*.82,dx=f<split?0:-p.side*.42,z=f<split?0:high[0][1]+ln/2;
    const x=dx-p.side*(wd/2+.44),bal=ln*(form===1?.48:.68),az=z+((f>>1)%3-1)*ln*.09;
    box(x,y+.05,az,1.08,.27,bal,M.stone,accent);
    box(x-p.side*.47,y+.32,az,.14,.86,bal,M.glazing,0xc4cbb9);
   }
   if(f===split-1)terrace(y+dy,low);
  }
  const top=base+floors*dy;terrace(top,high);
  if(type==='office'){
   // Continuous blades help the transit offices read vertically at driving speed.
   for(const k of [-1,1])box(p.side*depth*.38,base,width*k*.31,depth*.14,dy*split,width*.083,M.stone,accent);
   for(const k of [-1,1]){const x=k*depth*.45;
    box(x,base,-width*.36,.37,dy*split+.6,.64,M.enamel,accent);}
   const roofH=3.4+form*1.6;
   box(-p.side*.42,top+.38,width*.04,depth*.51,roofH,width*.56,M.zinc,accent);
   if(form!==2){const r=depth*.29;brace([-r,top+roofH,-width*.18],[r,top+roofH+4.4,width*.18],.44,M.enamel);}
  }else if(type==='works'){
   box(p.side*depth*.34,base,width*.26,depth*.22,dy*floors+2.3,width*.24,M.stone,0xb89a80);
   for(const k of [-1,0,1])box(k*depth*.19,top+.44,0,depth*.11,2.38,width*.43,M.zinc);
  }else{
   // A full-height stair core and a cut-in garden break the repetition of balcony decks.
   box(p.side*depth*.27,base,width*.12,depth*.19,dy*floors+.68,width*.18,M.stone,form===0?0xb7aca0:0xc7b8a6);
   box(0,base+dy*split+.43,width*.43,depth*.38,.72,width*.085,M.timber,0x688366);
   box(-p.side*.42,top+.38,0,depth*.43,2.8,width*.48,M.stone,accent);
   for(const k of [-1,1])box(k*depth*.22,top+.38,width*.25,.25,2.9,.25,M.enamel);
   box(0,top+3.23,width*.20,depth*.64,.32,width*.33,M.timber);
  }
 });
}

export function addMetropolitanBuildings({site,M,edge,frontages}){
 for(const p of frontages){
  if(!p.crown)continue;
  // The tower is supported by a continuous 3-storey podium, well back from the arcade.
  buildCrown({site,M},{...p.crown,at:p.at,side:p.side,offset:p.side*(edge(p.at,p.side)+p.setback+.64+p.depth*.54),base:p.levels*p.storey+.65,width:p.width*.80,depth:p.depth*.74});
 }
 for(const [i,[at,side]] of mallPedestals.entries()){
  // These three mall sites are landmarks excluded from the general block generator.
  buildCrown({site,M},{at:at+8,offset:side*(edge(at,side)+32),side,base:21.82,width:29+i*1.5,depth:15.5,seed:14+i*7,type:i===0?'office':'homes'});
 }
}
