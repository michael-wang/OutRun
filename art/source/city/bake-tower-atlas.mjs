// One row of real-world windows per repeated floor. Slots use the City kit UV layout.
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const chrome=await chromium.launch({channel:'chrome',args:['--disable-gpu']});
try{
 const page=await chrome.newPage();const data=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=512;c.height=1024;const g=c.getContext('2d');
  function rect(x,y,w,h,col){g.fillStyle=col;g.fillRect(x,y,w,h);}
  const neutral=['#e1d9c7','#6c7374','#a19076','#9aafab','#83908f','#d1c6b7','#987e62'];
  for(let i=0;i<16;i++){
   g.save();g.translate(i%4*128,Math.floor(i/4)*128);g.beginPath();g.rect(0,0,128,128);g.clip();
   rect(0,0,128,128,neutral[i%7]);
   if(i<7){for(let k=0;k<4;k++)rect(k*32,0,1,128,'rgba(67,63,51,.12)');rect(0,118,128,2,'rgba(48,56,54,.10)');}
   if(i===7||i===8||i===9){
    const office=i===7,works=i===8;
    rect(0,0,128,128,office?'#8a9f9f':works?'#c3a389':'#ddd0bb');
    const count=office?5:works?4:3;
    for(let j=0;j<count;j++){
     const w=128/count,x=j*w+(office?1:works?3:5),ww=w-(office?2:works?5:9);
     const top=office?5:works?20:18,hh=office?111:works?77:77;
     rect(x-1,top-2,ww+2,hh+5,'#646e6e');
     const grad=g.createLinearGradient(0,top,ww*.25,top+hh);
     grad.addColorStop(0,office?'#a5c4cc':'#859fa5');grad.addColorStop(.65,'#687d82');grad.addColorStop(1,office?'#718990':'#4d5e64');
     g.fillStyle=grad;g.fillRect(x,top,ww,hh);
     if((i+j)%3===0){rect(x+ww*.61,top,ww*.39,hh,office?'#b6c4bd':'#b8ad93');}
     rect(x+ww*.48,top,1.4,hh,'#4e6066');
     if(!office){rect(x,top+hh*.27,ww,2,'#646e6e');rect(x-1,top+hh,ww+2,4,'#c9c1af');}
    }
    rect(0,121,128,7,office?'#616e73':works?'#a59179':'#a69f92');
   }
   g.restore();
  }
  return c.toDataURL('image/png').split(',')[1];
 });await writeFile(process.argv[2]||new URL('../../../src/city/assets/tower-atlas.png',import.meta.url),Buffer.from(data,'base64'));
}finally{await chrome.close();}
