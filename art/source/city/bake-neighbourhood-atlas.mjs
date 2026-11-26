// Original city materials and signs. Rebuild with the project's Windows Chrome / Playwright toolchain.
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',args:['--disable-gpu']});
try{
 const page=await browser.newPage();
 const result=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=512;c.height=1024;
  const g=c.getContext('2d');let seed=401;
  const noise=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  function rect(x,y,w,h,fill){g.fillStyle=fill;g.fillRect(x,y,w,h);}
  function text(s,x,y,size,fill){g.fillStyle=fill;g.font='bold '+size+'px system-ui';g.textAlign='center';g.fillText(s,x,y,124);}
  function window(x,y,w,h,night=false){
   rect(x,y,w,h,'#c1c1ad');rect(x+1,y+2,w-2,h-3,night?'#575e58':'#667a7b');
   rect(x+2,y+3,w*.44,h-6,noise()<.45?'#899b96':'#809397');
   if(noise()<.42)rect(x+2,y+2,w-4,h*(.24+noise()*.45),'#c9c1ad');
   rect(x+w*.53,y+2,1.5,h-3,'#acae9f');rect(x,y+h-3,w,3,'#7b8580');
  }
  function glazedFront(kind){
   rect(0,0,128,128,['#d5ccbb','#d3bfaf','#c1cbcd','#c1bb9e'][kind]);
   for(let i=0;i<5;i++){const y=3+i*25;for(let j=0;j<4;j++){const x=j*32;
    if(kind===3){rect(x+2,y+5,28,9,'#85928f');rect(x+3,y+6,25,3,'#b2b9a7');}
    else window(x+(kind===2?0:3),y+3,kind===2?31:25,kind===2?15:14,kind===1);
    if(kind===0||kind===1){rect(x+1,y+17,29,4,kind===1?'#ae9c8a':'#b7b8a9');rect(x+1,y+21,29,2,'#818d87');}
   }rect(0,y+23,128,2,'#b0aba0');}
  }
  for(let tile=0;tile<32;tile++){
   g.save();g.translate(tile%4*128,Math.floor(tile/4)*128);g.beginPath();g.rect(0,0,128,128);g.clip();
   rect(0,0,128,128,'#eeeade');
   if(tile===1){for(let y=0;y<128;y+=10)for(let x=-20;x<128;x+=34)rect(x+(y%20?17:0),y,32,9,['#a16e53','#a87359','#b18167'][Math.floor(noise()*3)]);}
   else if(tile===2||tile===3){rect(0,0,128,128,tile===2?'#a8b9ad':'#cec8bb');for(let x=0;x<128;x+=tile===2?12:44)rect(x,0,1,128,'#999f96');for(let y=0;y<128;y+=tile===2?8:34)rect(0,y,128,1,'#adb3a8');}
   else if(tile>=4&&tile<=7||tile>=16&&tile<=23)glazedFront(tile%4);
   else if(tile===24||tile===25){
    rect(0,0,128,128,tile===24?'#ded8c8':'#cac8b9');rect(0,3,128,4,'#c4beae');
    for(let j=0;j<(tile===24?3:2);j++){const x=tile===24?j*40+6:j*61+7,w=tile===24?31:48;
     for(let k=0;k<2;k++){rect(x+k,33+k,w-2*k,57-2*k,k?'#918f80':'#c7c3b3');}
     window(x+3,38,w-6,48);rect(x-2,89,w+4,4,'#b3ae9b');}
   }else if(tile===8){rect(0,0,128,128,'#b2a595');rect(17,7,70,121,'#4a6161');window(21,12,61,108);for(let y=35;y<95;y+=14){rect(94,y,22,10,'#817d71');rect(96,y+2,10,2,'#c5c1aa');}}
   else if(tile===9){rect(0,0,128,128,'#6a827e');for(let x=0;x<128;x+=21)for(let y=0;y<128;y+=21){rect(x+2,y+2,19,19,noise()<.5?'#acbeb2':'#95afa5');rect(x+3,y+3,12,2,'#c9d0bc');}}
   else if(tile===10||tile===15){rect(0,0,128,128,tile===10?'#899793':'#a08568');for(let y=1;y<128;y+=tile===10?5:9)rect(0,y,128,2,tile===10?'#6d807b':'#776858');}
   else if(tile===11||tile===13){rect(0,0,128,128,'#637e7b');for(let y=24;y<122;y+=24){for(let x=3;x<127;x+=9){const h=8+noise()*11;rect(x,y-h,6,h,['#f1c687','#e4e5c8','#bd7660','#92b1a8','#a9afb9'][Math.floor(noise()*5)]);}rect(0,y,128,3,'#c0b6a1');}for(const x of [0,40,83,125])rect(x,0,3,128,'#617772');}
   else if(tile===12){rect(0,0,128,128,'#f5e6b9');rect(0,0,128,18,'#16766b');rect(0,104,128,15,'#145f5e');rect(0,119,128,9,'#d39547');text('汐光',64,75,54,'#1e5d59');text('TIDE MART',64,98,18,'#7b533c');}
   else if(tile===14){rect(0,0,128,128,'#466d65');text('安 居',64,67,28,'#e4d9b6');text('R E S I D E N C E',64,93,12,'#d5d9c4');}
   for(let n=0;n<1450;n++){const k=noise()<.5?30:245;rect(noise()*128,noise()*128,1,1,'rgba('+k+','+k+','+k+',.045)');}
   g.restore();
  }
  return c.toDataURL('image/png').split(',')[1];
 });
 await writeFile(process.argv[2]||new URL('../../../src/city/assets/neighbourhood.png',import.meta.url),Buffer.from(result,'base64'));
}finally{await browser.close();}
