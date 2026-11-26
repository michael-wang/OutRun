import {districtAt} from './districts.mjs';
// The sample uses the existing parcels. Finishes can be changed without changing lot geometry.
import {districtFinish} from './quarter.mjs';
export const arcadeStudy = {start:districtFinish.begin,end:districtFinish.end,
 walls:[0xc8a589,0xc0b49a,0xa6b9ad,0xc1b2a3,0xb1bec2],
 accents:[0x386764,0x825545,0x5e6b79,0x857957], soffit:0x685f56,
 glass:0x3b5458, tile:0x979383, brass:0xb19a6d};
export function addStreetStudy(p, tools) {
 const {at,side,width:w,bays,index,arcade,storey}=p, f=arcadeStudy;
 if(at<f.start||at>f.end)return;
 const {box,edge,grade}=tools, y=grade(at),street=edge(at,side)+p.setback;
 const door=street+arcade, h=storey+.65, color=at<1620?f.accents[index%f.accents.length]:districtAt(at).accent;
 // The covered walk reads as a continuous dark band. A pane, sill and mullion
 // sit inside each bay; all frontage stays behind the arcade pillars.
 box(at,side*(street+arcade*.49),y+h-.40,arcade+.62,.13,w-.2,'shopSoffit',f.soffit);
 for(let j=0;j<bays;j++){
  const z=at+w*((j+.5)/bays-.5),span=w/bays;
  box(z,side*(door-.28),y+.25,.13,.68,span-.58,'shopTile',f.tile);
  box(z,side*(door-.31),y+.94,.10,h-2.04,span-.79,'shopGlaze',f.glass);
  box(z-.15*span,side*(door-.4),y+.93,.09,h-2.02,.10,'metal',f.brass);
  box(z,side*(street-.16),y+h-.65,.72,.46,span-.28,'trim',color);
 }
 if(index%3!==1){
  const z=at-w*.33;
  box(z,side*(street-.31),y+h+.48,.88,2.27,.25,'trim',color);
  for(let i=0;i<3;i++)box(z-.14,side*(street-.31),y+h+.84+i*.48,.42,.12,.07,'trim',0xe2d2b1);
 }
}
export function addPlaces({box,grade,physicalPos,link,label,edge,walker,windingPath}){
 // A pair of municipal wholesale halls behind the bus stop leave daylight
 // between loading courts. The broken roof profiles face the approaching car.
 for(const [at,bays] of [[3723,5],[3805,4]]){
  for(let j=0;j<bays;j++){
   const z=at+j*7.6, y=grade(z), inner=edge(z,1)+19;
   box(z,inner+8,y+.16,15.8,5.7,7.62,'plinth',0x9da59c);
   box(z,inner-4,y+.06,9,.78,7.62,'curb');
   box(z,inner-.1,y+.97,.26,3.92,5.3,'metal',0x677675);
   box(z,inner+5,y+7.03,23,.34,8.13,'canopy',0xb2bbaf,-Math.atan2(2.8,7.6));
   box(z+3.52,inner+5,y+5.8,22,2.68,.30,'metal',0x879b9a);
   box(z-2.8,inner-6,y+.80,.29,4.70,.3,'metal');
   if(j%2===0)for(let k=0;k<3;k++)box(z-1.4+k*1.25,inner-3.1,y+.86,1.4,.87+(k%2)*.65,1.12,'trim',0xaa9983);
  }
  const x=edge(at,1)+18.5;
  label(at-3.99,x+4.3,grade(at)+5.05,10,1.25,'批發市場  /  MARKET','#506562');
 }
 windingPath('market-apron',3704,3850,d=>edge(d,1)+12,10,.24,0xacada1);
 // A sheltered pick-up court and parcels wing flank the station square.
 // The sightline to the clock face stays open from the square entrance.
 for(const [at,bays] of [[7006,4],[7053,5]]){
  for(let j=0;j<bays;j++){
   const z=at+j*6, y=grade(z), x=-edge(z,-1)-12;
   box(z,x-2,y+.21,11,.47,6.07,'walk');
   for(const s of [-1,1]){
    box(z,x-2+s*2.65,y+4.815,5.46,.22,6.07,'canopy',0xa7b8b8,0,s*Math.atan2(1.25,5.3));
   }
   box(z,x-2,y+.68,.36,3.70,.36,'metal');
   if(j%2===0)box(z,x-3.4,y+1.12,1,.24,3.4,'trim');
  }
 }
 for(const at of [7019,7063]){
  const x=-edge(at,-1)-35,y=grade(at);
  box(at,x,y+.1,12,6.9,27,'loft',0xa7b2b0);
  box(at,x+2,y+6.9,18,.58,29,'canopy');
  for(let j=0;j<4;j++)box(at-9+j*6,x+6.12,y+.35,.26,3.8,4.45,'metal');
 }
 label(7001,-edge(7001,-1)-13,grade(7001)+4.25,7,.94,'車站接送  /  TAXI','#4d6667');
 for(const [z,x] of [[7010,-22],[7012,-23],[7061,-24]])walker(z,x,1.77);
}
