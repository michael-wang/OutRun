/** Original SVG instrument; angles use the same indicated km/h as the readout. */
export const needleAngle=(kmh:number)=>-135+270*Math.max(0,Math.min(1,kmh/360));
export function speedometerMarkup(){
 const point=(angle:number,r:number)=>{const a=angle*Math.PI/180;return [100+Math.sin(a)*r,100-Math.cos(a)*r];};
 const ticks=Array.from({length:37},(_,i)=>{const speed=i*10,angle=needleAngle(speed),major=(i%5===0&&i!==35)||i===36,a=point(angle,83),b=point(angle,major?70:77),label=point(angle,57);return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${speed>=200?'#ffc176':'#e4eee2'}" stroke-width="${major?2.4:1}"/>${major?`<text x="${label[0]}" y="${label[1]+4}" text-anchor="middle" fill="#f4efdc" font-size="12" font-family="Arial">${speed}</text>`:''}`;}).join('');
 return `<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" fill="#12343ef0" stroke="#ffd19a" stroke-width="2"/><circle cx="100" cy="100" r="89" fill="none" stroke="#acc2b84d"/>${ticks}<text x="100" y="72" text-anchor="middle" fill="#aac4be" font-size="7" letter-spacing="2">COAST / GT</text><g id="speed-needle" transform="rotate(-135 100 100)"><path d="M97 110 L100 24 L103 110Z" fill="#ffac70"/></g><circle cx="100" cy="100" r="6" fill="#ffe3b3"/></svg><strong>000</strong><span>KM/H</span><b id="gear" aria-label="Gear">1</b><em id="status">READY FOR THE COAST</em>`;
}
