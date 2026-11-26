// Original overhead field painting for the municipal ballpark. Field-space units are metres.
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';

const browser=await chromium.launch({channel:'chrome',args:['--disable-accelerated-2d-canvas','--disable-gpu']});
try {
 const page=await browser.newPage();
 const image=await page.evaluate(()=>{
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1152;
  const g=canvas.getContext('2d');
  // 12 texels per metre, turf bounds ±64 m and -12 to +84 m. Depth increases up the image.
  g.setTransform(12,0,0,-12,768,1008);
  function shape(fill,paint){g.beginPath();paint();g.fillStyle=fill;g.fill();}
  function circle(x,y,r,color){shape(color,()=>g.arc(x,y,r,0,2*Math.PI));}
  function poly(list,color){shape(color,()=>{for(const [x,y] of list)g.lineTo(x,y);g.closePath();});}
  function stroke(list,color,width){g.beginPath();for(const [x,y] of list)g.lineTo(x,y);g.strokeStyle=color;g.lineWidth=width;g.stroke();}
  g.fillStyle='#578148';g.fillRect(-64,-12,128,96);
  // Broad alternating cuts are visible in motion. Texture and wear stay locked to the turf.
  for(let i=-11;i<13;i++)poly([[i*8-32,-12],[i*8-24,-12],[i*8+14,84],[i*8+6,84]],i%2?'#68a653':'#79ba61');
  g.beginPath();g.arc(0,0,78,-Math.PI,Math.PI);g.strokeStyle='#b58256';g.lineWidth=4.8;g.stroke();
  let seed=18347;function rng(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;}
  // Conventional square, 27.43 m base paths. Skinned arc is centered at the mound.
  const b=27.43/Math.SQRT2;
  shape('#d88050',()=>{g.moveTo(0,-2.1);g.lineTo(27.5,25.0);g.arc(0,18.44,28.8,.22,Math.PI-.22);g.lineTo(0,-2.1);});
  poly([[0,2.5],[b-2.75,b],[0,b*2-2.75],[-b+2.75,b]],'#71b05b');
  circle(0,18.44,2.9,'#b9663d');circle(0,0,4.0,'#c87954');
  for(const side of [-1,1]){
   circle(side*b,b,2.3,'#d88050');
   stroke([[0,0],[side*56,56]],'#fff3d6',.32);
   const x=side*.99;stroke([[x,-.86],[side*2.22,-.86],[side*2.22,1.1],[x,1.1],[x,-.86]],'#eaddc3',.13);
   const xx=side*7;circle(xx,-2.4,1.54,'#ad6948');
   // Coaching box lies outside the respective foul line.
   stroke([[side*18,11],[side*19,11],[side*23,15]],'#e9dcc5',.12);
  }
  for(const [x,y] of [[-b,b],[b,b],[0,2*b]]){circle(x,y,1.65,'#b5633e');poly([[x,y+.40],[x+.40,y],[x,y-.40],[x-.40,y]],'#f4ecd9');}
  poly([[-.38,.18],[.38,.18],[.38,-.14],[0,-.42],[-.38,-.14]],'#faf0d9');
  g.fillStyle='#f1ead4';g.fillRect(-.45,18.35,.9,.24);
  for(let i=0;i<125000;i++){const x=rng()*128-64,y=rng()*96-12;
   g.fillStyle=i%2?'rgba(253,241,203,.045)':'rgba(24,30,18,.07)';g.fillRect(x,y,.10+rng()*.10,.08);}
  return canvas.toDataURL('image/webp',.94).split(',')[1];
 });
 await writeFile(process.argv[2]||new URL('../../../src/city/assets/ballpark.webp',import.meta.url),Buffer.from(image,'base64'));
}finally{await browser.close();}
