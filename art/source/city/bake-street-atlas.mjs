// Run from any directory with node art/source/city/bake-street-atlas.mjs.
// Original City atlas. Divisions are 256 px, addressed by city-street-kit.mjs.
// Chrome rasterizes the authored vector masks once, outside the game loop.
import { chromium } from 'playwright';
import { writeFile, readFile } from 'node:fs/promises';
const destination=process.argv[2]||new URL('../../../src/city/assets/street-kit.png',import.meta.url);
const browser=await chromium.launch({channel:'chrome',args:['--disable-accelerated-2d-canvas','--disable-gpu']});
try {
 const page=await browser.newPage();
 const png=await page.evaluate(()=>{
  const atlas=document.createElement('canvas');atlas.width=atlas.height=1024;
  const g=atlas.getContext('2d',{willReadFrequently:true});let seed=30871;
  function random(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;}
  function rect(x,y,w,h,col){g.fillStyle=col;g.fillRect(x,y,w,h);}
  function dot(x,y,r,col){g.fillStyle=col;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}
  function line(x,y,xx,yy,col,width){g.strokeStyle=col;g.lineWidth=width;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke();}
  function letters(text,x,y,size,col){g.font='bold '+size+'px Arial';g.fillStyle=col;g.fillText(text,x,y);}
  function grain(count,contrast){for(let i=0;i<count;i++)rect(random()*256,random()*256,1+random()*1.3,1,random()>.5?'rgba(255,255,255,'+contrast+')':'rgba(25,19,12,'+contrast+')');}
  const base=['#e1d8b9','#315755','#c05d3c','#407f73','#879e9d','#b7aea0','#a68057','#244d50','#765334','#66563c','#29575a','#275f62','#225b4d','#295868','#573d28','#555c59'];
  for(let t=0;t<16;t++){g.save();g.translate(t%4*256,Math.floor(t/4)*256);g.beginPath();g.rect(0,0,256,256);g.clip();rect(0,0,256,256,base[t]);
   if(t<2){for(let j=0;j<48;j++)line(random()*256,random()*256,random()*256,random()*256,'rgba(255,255,255,.025)',1);grain(4500,.11);}
   if(t===2||t===3){for(let j=0;j<4;j++){rect(j*64+5,0,26,256,'#e9d9b6');rect(j*64+34,0,3,256,'#d8b895');}for(let y=0;y<256;y+=4)line(0,y,256,y,'rgba(53,46,40,.10)',1);grain(3500,.15);}
   if(t===4||t===15){for(let x=2;x<256;x+=32){rect(x,0,3,256,'rgba(35,45,45,.30)');rect(x+3,0,3,256,'rgba(255,255,255,.25)');}grain(5300,.11);}
   if(t===5){grain(23000,.25);for(let i=0;i<90;i++)dot(random()*256,random()*256,.8+random(),i%2?'#c7bbae':'#9d9589');}
   if(t===6){for(let y=0;y<256;y+=42){rect(0,y,256,3,'#584638');rect(0,y+4,256,2,'#c3a27a');for(let i=0;i<8;i++)line(random()*128,y+8+i*3,120+random()*136,y+10+i*3,'rgba(77,53,38,.21)',1);}}
   if(t===7){const grad=g.createLinearGradient(0,0,70,256);grad.addColorStop(0,'#9eb5af');grad.addColorStop(.54,'#628781');grad.addColorStop(.56,'#4e6b65');grad.addColorStop(.8,'#365652');grad.addColorStop(1,'#46645c');g.fillStyle=grad;g.fillRect(0,0,256,256);for(let x=1;x<256;x+=64){rect(x,0,4,256,'#324c48');rect(x+4,0,1,256,'#b5beb2');}rect(0,71,256,4,'#455f58');}
   if(t===8||t===9){rect(4,4,248,248,'#483d29');for(let y=18;y<249;y+=22)for(let x=15;x<249;x+=22){const xx=x+(random()-.5)*6,yy=y+(random()-.5)*6,r=8+random()*4;dot(xx,yy,r+1,'#403929');dot(xx,yy-1,r,t===8?(random()>.5?'#ea9a39':'#cb7731'):(random()>.5?'#93a44c':'#b1ae58'));dot(xx-2,yy-4,2.8,t===8?'#eeb55d':'#c0bf77');}for(const y of [0,248])rect(0,y,256,8,'#b39360');}
   if(t===10||t===11||t===12||t===13){
    rect(10,12,236,3,'#ddcba3');rect(10,225,236,3,'#ddcba3');
    if(t===10){letters('02',10,170,150,'#e0c38b');letters('CITY LINE',16,212,30,'#fff0cf');}
    if(t===11){for(let j=0;j<3;j++){g.strokeStyle='#e1b567';g.lineWidth=7;g.beginPath();g.ellipse(123,99,78-j*13,41-j*8,-.19,0,2*Math.PI);g.stroke();}letters('ATHLETICS',14,202,42,'#fff1c8');}
    if(t===12){dot(90,104,58,'#e8a342');dot(163,122,39,'#c57136');g.fillStyle='#afc38c';g.beginPath();g.ellipse(115,40,28,9,-.52,0,2*Math.PI);g.fill();letters('CITRUS 06',13,204,42,'#f8e3b1');}
    if(t===13){rect(29,50,90,88,'#ddd5a9');rect(38,58,72,42,'#456a6a');for(const x of [46,100])dot(x,119,7,'#426268');line(50,143,31,167,'#ddca97',7);line(94,143,113,167,'#ddca97',7);letters('CENTRAL',14,205,43,'#fff1c8');letters('01',149,125,73,'#e8b875');}
   }
   if(t===14){for(let y=10;y<256;y+=30){rect(0,y,256,16,'#edc784');rect(0,y+4,256,4,'#f7dfaa');}}
   g.restore();
  }return atlas.toDataURL('image/png').split(',')[1];
 });
 const bytes=Buffer.from(png,'base64');
 const prior=await readFile(destination).catch(error=>{if(error.code!=='ENOENT')throw error;});
 if(!prior?.equals(bytes))await writeFile(destination,bytes);
}finally{await browser.close();}
