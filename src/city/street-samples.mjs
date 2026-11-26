// Parcel runs are in driving order. Widths are relative shares of the block.
// The gaps belong to individual addresses (service lanes, courtyards, corner returns).
const blocks = [
  { from: 390, to: 605, side: 1, district: 'old', addresses: [
    ['counter',12,2], ['homes',10,4], ['arcade',16,2], ['workshop',19,1,4],
    ['cinema',26,3], ['homes',8,5,2], ['counter',10,2], ['loggia',15,3],
    ['arcade',13,2,3], ['workshop',16,2], ['homes',9,4], ['counter',13,1]
  ]},
  { from: 432, to: 578, side: -1, district: 'old', addresses: [
    ['workshop',20,1,3], ['arcade',12,2], ['homes',8,4], ['counter',16,1],
    ['loggia',19,3,2], ['homes',9,3], ['counter',11,2], ['arcade',13,2]
  ]},
  { from: 2320, to: 2555, side: 1, district: 'trade', addresses: [
    ['workshop',23,1], ['counter',12,2], ['homes',9,4,3], ['arcade',15,2],
    ['market',38,1,5], ['workshop',17,2], ['loggia',15,3,2], ['counter',11,1],
    ['homes',8,3], ['workshop',27,1], ['counter',13,2]
  ]},
  { from: 3280, to: 3425, side: -1, district: 'trade', addresses: [
    ['loggia',20,5,2], ['counter',10,2], ['workshop',24,1,4], ['homes',8,4],
    ['market',29,2,3], ['arcade',12,2], ['homes',10,3]
  ]},
  { from: 6535, to: 6776, side: -1, district: 'station', addresses: [
    ['loggia',27,7,5], ['counter',15,2], ['homes',13,4,4], ['court',36,8,6],
    ['arcade',13,2], ['workshop',15,2,2], ['loggia',23,5,4], ['homes',12,4],
    ['counter',13,2], ['court',31,6,3]
  ]},
  { from: 6600, to: 6755, side: 1, district: 'station', addresses: [
    ['homes',13,4], ['loggia',24,6,4], ['arcade',13,2], ['counter',9,1],
    ['court',32,7,5], ['homes',10,3], ['loggia',19,4,2]
  ]}
];

const finishes = {
  old: [0xb86c50,0xd9ccb0,0x96aaa1,0xc8956c,0xd2b990],
  trade: [0x94a49d,0xb1977a,0xcbbba3,0x9e7865,0xb2aba0],
  station: [0xc9c7b9,0x9daeb0,0xa6998b,0xd1bba3,0xc2b495]
};

export function sampleFrontages(lots) {
  const kept = lots.filter(p => p.offset !== undefined || !blocks.some(f =>
    p.side === f.side && p.at+p.width/2 > f.from && p.at-p.width/2 < f.to));
  for (const block of blocks) {
    const total = block.addresses.reduce((sum,[,width,,gap=.45]) => sum+width+gap,0);
    const scale = (block.to-block.from)/total;
    let cursor = block.from;
    for (const [i,[style,share,levels,gap=.45]] of block.addresses.entries()) {
      const width = share*scale, at = cursor+width/2;
      const seed = (Math.floor(block.from/10)+i*7+(block.side<0?2:0));
      const setback = style==='court'?10:style==='loggia'?7.6:5.5+(seed%3)*.45;
      kept.push({style,width,levels,at,side:block.side,seed,setback,
        wall:finishes[block.district][seed%5],depth:15+(seed%4)*2});
      cursor += width+gap*scale;
    }
  }
  return kept;
}
export const avenueTrees=[
 [110,600,1,37],[1150,1300,-1,28],[1330,2000,1,41],[3300,3900,1,34],[6060,6500,-1,32],[6650,6845,1,32]
].map(([from,to,side,spacing])=>({from,to,side,spacing,offset:6.25,height:from===6650?8:6.5,crown:from===6650?.78:1}));
export const crossings=[
 {at:900,clearance:6.35,offset:4.1,depth:4.8,bays:8},
 {at:3880,clearance:6.65,offset:4.8,depth:4.2,bays:7},
 {at:5835,clearance:6.55,offset:4.1,depth:5.2,bays:8},
 {at:6575,clearance:6.85,offset:6.8,depth:4.5,bays:6}
];
export const signals=[
 {at:410,side:1,offset:4.2,height:5.6,arm:2.2,style:'horizontal'},
 {at:549,side:-1,offset:5.5,height:5.1,arm:1.6,style:'vertical'},
 {at:6618,side:1,offset:3.4,height:5.8,arm:2.6,style:'horizontal'}
];
export const streetSigns=[
 {at:406,side:-1,offset:3.6,height:3.2,width:3.4,text:'南北市街',color:'#3b6459'},
 {at:6542,side:1,offset:4.7,height:3.8,width:4.8,text:'信庭大道',color:'#405865'}
];
// Local x is depth behind the frontage, z runs along the street.
export function streetFront(p,{box,link,physicalPos,grade,edge,label}) {
  const {at,side,width:w,depth:d,style,levels,seed,wall} = p;
  const y=grade(at), front=edge(at,side)+p.setback;
  const b=(z,x,bottom,depth,height,width,kind,tint)=>
    box(at+z,side*(front+x),y+bottom,depth,height,width,kind,tint);
  const glass=0x415b60, stone=0xe1d2b6, shade=0x645952;
  const accent=[0x45766e,0xc3944c,0xa25646,0x64818a][seed%4];
  const tall=style==='court'||style==='loggia', shed=style==='market'||style==='workshop';
  const ground=shed?4.7:3.8, h=ground+(levels-1)*(tall?3.35:3.05);
  const bays=Math.max(2,Math.round(w/(shed?6:4.8)));
  const bay=w/bays;
  // A recessed shop interior has real depth and its side returns are visible on approach.
  b(0,d/2+2.7,-.14,d,ground+.14,w-.16,'plinth',shade);
  for(let i=0;i<bays;i++){
    const z=-w/2+bay*(i+.5);
    const shutter=style==='workshop' && i%3!==1;
    if(shutter){
      b(z,2.55,.28,.22,ground-.55,bay-.55,'metal',0x84908a);
    }else{
      const pane=bay*(style==='counter'?.39:.66);
      b(z,2.55,.35,.25,ground-.76,pane,'metal',glass);
      b(z-pane*.13,2.37,.34,.22,ground-.72,.16,'trim',stone);
    }
    if(shed)b(z,2.37,ground*.52,.20,.16,bay-.65,'trim',stone);
    if(style==='counter'||style==='market'){
      b(z,.6,.20,1.15,1.03,bay-.65,'plinth',wall);
      if(i%2===0){
        b(z,.52,1.24,.92,.52,bay*.57,'trim',0xb78a58);
        b(z,.52,1.76,.72,.29,bay*.48,'green',seed%2?0x829450:0xcc934d);
      }
    }
  }
  for(const sign of [-1,1])b(sign*(w/2-.24),1.35,0,2.8,ground,.45,'post',wall);
  if(style==='arcade'||tall){
    for(let i=1;i<bays;i++)b(-w/2+i*bay,.08,0,.55,ground,.42,'post',stone);
  }
  if(levels>1){
    // Recess the top storeys in the taller addresses, exposing a genuine terrace.
    const cut=tall&&levels>=4?h-6.7:h;
    b(0,d*.5+.4,ground,d,cut-ground,w-.15,'loft',wall);
    if(cut<h)b(w*.07,d*.5+1.85,cut,d-2.9,h-cut,w*.79,'loft',wall);
    for(let j=1;j<levels;j++){
      const bottom=ground+(j-1)*(tall?3.35:3.05);
      const inset=bottom+.01>=cut;
      const x=inset?3.25:.4, span=inset?w*.79:w-.15, z=inset?w*.07:0;
      if(tall||style==='cinema'){
        b(z,x-.14,bottom+.55,.35,1.85,span*.83,'metal',glass);
        if(tall){
          b(z,x-.59,bottom+.12,1.9,.44,span+.16,'trim',stone);
          b(z-span*.24,x-1.1,bottom+.54,.48,.56,span*.25,'green',0x657965);
        }
      }else{
        const count=style==='homes'?2:bays;
        for(let k=0;k<count;k++){
          const center=z+((k+.5)/count-.5)*span;
          b(center,x-.14,bottom+.58,.36,1.84,span/count*(style==='homes'?.46:.63),'metal',glass);
        }
      }
      // Edge windows keep the first exposed party wall from reading as a blank box.
      if(tall||style==='homes')b(z-span/2-.09,x+d*.40,bottom+.72,d*.42,1.5,.24,'metal',glass);
    }
  }
  if(shed){
    const teeth=style==='market'?3:2, part=d/teeth;
    for(let i=0;i<teeth;i++){
      const x=1+i*part, rise=style==='market'?2.7:1.6;
      const point=(off,height)=>physicalPos(at,side*(front+off),y+height);
      link(point(x,h+.15),point(x+part-.25,h+rise),w-.25,.34,'canopy',at,0x707d77,true);
      b(0,x+part-.4,h,.36,rise,w-.65,'metal',glass);
    }
    b(0,-.42,ground-.35,3.25,.43,w*.98,'canopy',accent);
    if(style==='market'){
      const z=-w*.39;
      b(z,-.92,3.55,2.46,1.04,.28,'trim',0xd3bd92);
      label(at+z-.16,side*(front-.92),y+4.08,2.4,.92,'果物行','#5c7358');
      for(let i=0;i<bays;i+=2)b(-w/2+bay*(i+.5),-1.94,3.53,.16,.76,bay*.76,'canopy',0xe1bc77);
    }
  }else if(style==='cinema'){
    // One corner picture house: a broad floating marquee and a stepped ticket tower.
    b(0,-.68,ground-.34,3.6,.64,w*.95,'trim',0xf2cc81);
    b(-w*.34,1.9,ground,3.5,h-ground+4.2,w*.19,'loft',0xa45c43);
    b(-w*.34,-.92,4.45,2.65,1.18,.30,'canopy',0x97513a);
    label(at-w*.34-.17,side*(front-.92),y+5.04,2.61,1.12,'星河戲院','#8d4b37');
    for(const offset of [-.62,.62])b(-w*.34+offset,-.06,ground+.48,.42,h-ground+2.95,.32,'trim',stone);
  }else if(style==='arcade'){
    const half=bay*.40;
    for(let k=0;k<bays;k++){
      const mid=-w/2+(k+.5)*bay;
      const point=i=>physicalPos(at+mid+half*Math.cos(i*Math.PI/5),side*(front+.06),y+ground+1.32+Math.sin(i*Math.PI/5)*1.12);
      for(let i=0;i<5;i++)link(point(i),point(i+1),.26,.22,'trim',at,stone,true);
    }
    b(0,.47,h,.8,.48,w,'trim',stone);
    b(0,.47,h+.46,.78,.78,w*.49,'loft',wall);
  }else if(style==='homes'){
    b(w*.23,d*.42,h,d*.50,1.8,w*.42,'loft',wall);
    b(-w*.32,-.6,2.55,1.55,2.0,.42,'canopy',accent);
    if(seed%2===0){
      const z=w*.22;
      b(z,-.32,ground+.48,1.25,2.13,w*.38,'trim',stone);
      b(z,-1.03,ground+.75,.23,1.44,w*.30,'metal',glass);
    }
  }else if(tall){
    b(w*.13,d*.56,h,d*.40,1.35,w*.42,'loft',wall);
    if(style==='court')b(-w*.25,-.85,.12,2.6,1.14,w*.35,'green',0x70836b);
  }else{
    b(0,-.35,2.88,2.65,.34,w*.94,'canopy',accent);
    b(-w*.25,d*.49,h,d*.66,.54,w*.43,'trim',wall);
  }
}
