// Original procedural icon: sunny coast and a winding road. Reproducible, no image dependency.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
const crc32=data=>{let crc=0xffffffff;for(const byte of data){crc^=byte;for(let n=0;n<8;n++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;};
function chunk(name,data){const type=Buffer.from(name),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data])));return Buffer.concat([size,type,data,crc]);}
for(const size of [192,512]){
  const raw=Buffer.alloc((size*4+1)*size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size;let color=v<.46?[93,190,214]:[8,126,170];
    if((u-.73)**2+(v-.23)**2<.095**2)color=[255,211,139];
    const road=.50+.16*Math.sin((v-.46)*7),width=.02+Math.max(0,v-.46)*.26;
    if(v>.46&&Math.abs(u-road)<width+.026)color=[226,208,161];
    if(v>.46&&Math.abs(u-road)<width)color=[48,69,72];
    if(v>.46&&Math.abs(u-road)<.006&&Math.floor(v*23)%2===0)color=[255,246,218];
    const i=y*(size*4+1)+1+x*4;raw.set([...color,255],i);
  }
  const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
  writeFileSync(`public/icons/coast-${size}.png`,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
}
