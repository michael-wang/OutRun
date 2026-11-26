// Distances and dimensions are metres. These short studies replace only the
// primary frontage on designated lots; the rest of the seeded city stays put.
export const frontages=[
 {style:'dihua',from:390,to:605,side:1,width:[7.2,8.8,9.3,7.6],depth:22,gap:.27,setback:5.4},
 {style:'dihua',from:432,to:578,side:-1,width:[8.3,7.6,9.1],depth:19,gap:.32,setback:5.6},
 {style:'xinyi',from:6535,to:6776,side:-1,width:[26,32,28],depth:25,gap:13,setback:9.4},
 {style:'xinyi',from:6600,to:6755,side:1,width:[24,29],depth:22,gap:10,setback:10}
];
export function sampleFrontages(lots){
 const kept=lots.filter(p=>!frontages.some(f=>p.side===f.side&&p.at+p.width/2>f.from&&p.at-p.width/2<f.to));
 for(const f of frontages)for(let d=f.from,i=0;d<f.to;i++){
  const w=f.width[i%f.width.length];if(d+w>f.to)break;
  kept.push({...f,width:w,at:d+w/2,index:i});d+=w+f.gap;
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
export function streetFront(p,{box,link,physicalPos,grade,edge}){
 const {at,side,width:w,depth:d,index}=p,y=grade(at),front=edge(at,side)+p.setback;
 const b=(z,x,floor,ww,h,len,kind,color)=>box(at+z,side*(front+x),y+floor,ww,h,len,kind,color);
 if(p.style==='dihua'){
  const brick=[0x9b5843,0xb27858,0x955442,0xc49a78][index%4],stone=0xd8c5a6,h=8.0+(index%3)*.35;
  b(0,d/2+2.7,0,d,4.0,w,'plinth',0x715a4b);b(0,d/2,4.0,d,h-4,w,'loft',brick);
  b(0,1.35,3.75,3.25,.34,w+.1,'trim',stone);
  const awning=[0x5b736a,0x956547,0xaba179][index%3];
  b(0,1.8,2.75,1.6,.26,w*.81,'canopy',awning);b(0,2.62,.62,.36,.85,w*.6,'trim',0xa38665);
  if(index%3===0)b(w*.35,-.18,3.02,.52,1.28,.34,'trim',0x7d5644);
  for(const z of [-w*.47,0,w*.47])b(z,.1,0,.61,3.9,.47,'post',stone);
  for(const z of [-w*.24,w*.24]){
   b(z,-.06,4.55,.18,2.4,w*.32,'metal',0x465955);
   const half=w*.19;
   for(let j=0;j<6;j++){
    const arch=k=>physicalPos(at+z+Math.cos(k*Math.PI/6)*half,side*(front-.19),y+5.97+Math.sin(k*Math.PI/6)*1.05);
    link(arch(j),arch(j+1),.26,.22,'trim',at,stone,true);
   }
   b(z,-.12,4.48,.32,.24,w*.37,'trim',stone);
  }
  b(0,.12,h-.1,.82,.37,w+.08,'trim',stone);
  for(let j=0;j<3;j++)b(0,.12,h+j*.48,.55,.53,w*(.88-j*.24),'loft',brick);
  b(0,.12,h+1.47,.75,.18,w*.42,'trim',stone);
 }else{
  const floors=6+index%4,stone=0xcccbc0,glass=0x667c80,plant=0x687f62;
  b(0,d*.5+1.6,0,d-3.2,4.4,w,'plinth',0x9e9e92);
  b(0,3.12,.42,.22,3.65,w*.68,'metal',glass);
  for(const z of [-w*.44,w*.44])b(z,1.6,0,3.2,4.4,w*.12,'trim',stone);
  for(const z of [-w*.33,w*.33]){b(z,-1.45,.05,2.2,.66,w*.19,'plinth',0x999787);b(z,-1.45,.71,1.8,1.05,w*.16,'green',plant);}
  b(0,1.25,.05,3.7,.23,w*.5,'trim',stone);
  b(0,1,4.3,5.8,.52,w*.82,'canopy',stone);
  for(let i=0;i<floors;i++){
   const level=4.8+i*3.45,set=2.5+(i>=floors-2?2.2:0),ww=w*(i>=floors-2?.77:.91);
   b(0,set+d*.41,level,d*.82,3.45,ww,'tower',glass);
   b(0,set+d*.38-.9,level,d*.82+2.7,.40,ww+2.1,'trim',stone);
   b(0,set-2,level+.43,.33,.74,ww+1,'trim',stone);
   b(-ww*.31,set-1.7,level+1,.85,.65,ww*.28,'green',plant);
   for(const z of [-ww*.47,0,ww*.47])b(z,set-.1,level+.4,.78,3.08,.48,'trim',0xb5b5a7);
  }
 }
}
