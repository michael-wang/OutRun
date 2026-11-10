import {GEAR_RATIOS} from './powertrain';

export const gearReadout=(gear:number)=>`G${gear}/${GEAR_RATIOS.length}`;
/** Clockwise from twelve o'clock. Leave the lower-right 144° for the speed readout. */
const dialStart=-146,dialSweep=216;
export const needleAngle=(kmh:number)=>dialStart+dialSweep*Math.max(0,Math.min(1,kmh/360));
export function speedometerMarkup(){
 const point=(angle:number,r:number)=>{const a=angle*Math.PI/180;return [100+Math.sin(a)*r,100-Math.cos(a)*r];};
 const color=(speed:number)=>speed>=300?'#ff6852':speed>=240?'#ffb347':'#66e7ff';
 const ticks=Array.from({length:37},(_,i)=>{
  const speed=i*10,angle=needleAngle(speed),major=i%6===0;
  const outer=point(angle,87),inner=point(angle,major?73:81),label=point(angle,58);
  const tick=`<line x1="${outer[0]}" y1="${outer[1]}" x2="${inner[0]}" y2="${inner[1]}" stroke="${color(speed)}" stroke-width="${major?3.6:1.8}"/>`;
  if(!major)return tick;
  return tick+`<text x="${label[0]}" y="${label[1]+4}" text-anchor="middle" fill="${speed>=240?color(speed):'#e8f8ff'}" font-size="13" font-weight="700" font-family="Arial">${speed}</text>`;
 }).join('');
 const arc=(from:number,to:number,radius=92)=>{
  const start=needleAngle(from),end=needleAngle(to),a=point(start,radius),b=point(end,radius);
  return `M${a[0]} ${a[1]} A${radius} ${radius} 0 ${end-start>180?1:0} 1 ${b[0]} ${b[1]}`;
 };
 return `<svg viewBox="0 0 200 200" aria-hidden="true">
  <path class="dial-rim" d="${arc(0,360,97)}" fill="none" stroke-width="1.5"/>
  <path d="${arc(0,240)}" fill="none" stroke="#32bde9" stroke-width="3"/>
  <path d="${arc(240,300)}" fill="none" stroke="#ffb347" stroke-width="3"/>
  <path d="${arc(300,360)}" fill="none" stroke="#ff6852" stroke-width="3"/>
  ${ticks}
  <g id="speed-needle" transform="rotate(${needleAngle(0)} 100 100)"><path d="M97 107 L99 27 L101 23 L103 107Z" fill="#ffd06a" stroke="#ff8b37" stroke-width=".7"/></g>
  <circle cx="100" cy="100" r="6" fill="#ffc268" stroke="#fff0c7" stroke-width="2"/>
 </svg>
 <div class="speed-reading"><strong>000</strong><small>km/hr</small></div>
 <b id="gear" aria-label="檔位">${gearReadout(1)}</b>`;
}
