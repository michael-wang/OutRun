// The static plate is rasterized once. Only the coloured hand moves with road speed.
export function citySpeedDial(canvas){
 const size=256,centre=128,rad=104,angle=v=>(135+270*Math.min(300,Math.max(0,v))/300)*Math.PI/180;
 const plate=document.createElement('canvas');plate.width=plate.height=size;
 const ctx=plate.getContext('2d');
 ctx.fillStyle='rgba(19,32,40,.88)';ctx.beginPath();ctx.arc(centre,centre,124,0,2*Math.PI);ctx.fill();
 ctx.lineWidth=2;ctx.strokeStyle='#7c9396';ctx.stroke();
 for(let v=0;v<=300;v+=5){
  const a=angle(v),major=v%50===0,length=major?15:v%10===0?8:4,c=Math.cos(a),s=Math.sin(a);
  ctx.beginPath();ctx.moveTo(centre+c*(rad-length),centre+s*(rad-length));ctx.lineTo(centre+c*rad,centre+s*rad);
  ctx.strokeStyle=v>=250?'#f4a267':major?'#fff3d9':'#98a7aa';ctx.lineWidth=major?3:2;ctx.stroke();
  if(major){ctx.fillStyle='#e4e5db';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 14px system-ui';ctx.fillText(String(v),centre+c*72,centre+s*72);}
 }
 canvas.width=canvas.height=size;const display=canvas.getContext('2d');let last=-1;
 return function draw(kmh){
  const v=Math.round(kmh);if(v===last)return;last=v;
  display.clearRect(0,0,size,size);display.drawImage(plate,0,0);
  const a=angle(v),c=Math.cos(a),s=Math.sin(a);
  display.beginPath();display.moveTo(centre+6*c-5*s,centre+6*s+5*c);
  display.lineTo(centre+113*c,centre+113*s);display.lineTo(centre+6*c+5*s,centre+6*s-5*c);
  display.closePath();display.fillStyle='#ff8839';display.fill();display.beginPath();display.arc(centre,centre,7,0,Math.PI*2);display.fill();
 };
}
