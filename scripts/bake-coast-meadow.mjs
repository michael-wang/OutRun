// Bake the linear data tile used at three world scales on the coastal hills.
// Run from the repository root with Node and ImageMagick. The game loads the baked PNG.
import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const size=512, pixels=Buffer.alloc(size*size*3), mask=size-1;
let seed=77209;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const lattice=Float32Array.from({length:64*64},random);
function noise(x,y,period){
 const ix=Math.floor(x),iy=Math.floor(y),m=period-1;
 const cell=(a,b)=>lattice[(b&m)*64+(a&m)];
 let u=x-ix,v=y-iy;u*=u*(3-2*u);v*=v*(3-2*v);
 const lo=cell(ix,iy)*(1-u)+cell(ix+1,iy)*u,hi=cell(ix,iy+1)*(1-u)+cell(ix+1,iy+1)*u;
 return lo+(hi-lo)*v;
}
for(let y=0;y<size;y++)for(let x=0;x<size;x++){
 const u=x/size,v=y/size,offset=(y*size+x)*3;
 const warp=noise(u*4,v*4,4),cross=noise(u*4+13.2,v*4+6.4,4);
 const roll=noise(4*u+1.8*cross,4*v+warp,4);
 const fringe=noise(16*u+5*warp,16*v+3*cross,16);
 const tussock=noise(32*u+9*cross,32*v+5*warp,32);
 pixels[offset]=255*(.62*roll+.26*fringe+.12*tussock);
 pixels[offset+1]=28+56*tussock+18*random();
}
function stroke(x,y,tone,opacity){
 const col=Math.floor(x),row=Math.floor(y),fx=x-col,fy=y-row;
 for(let dy=0;dy<=1;dy++)for(let dx=0;dx<=1;dx++){
  const i=(((row+dy)&mask)*size+((col+dx)&mask))*3+1;
  const weight=opacity*(dx?fx:1-fx)*(dy?fy:1-fy);
  pixels[i]+=Math.round((tone-pixels[i])*weight);
 }
}
// Fans of overlapping curved blades. The rooted side of each blade is shaded,
// with a narrow rim catching the sun. Both strokes wrap across the tile edges.
for(let tuft=0;tuft<1150;tuft++){
 const x=random()*size,y=random()*size,angle=1.57+(random()-.5)*2.3;
 const length=8+random()*19,value=170+random()*85;
 for(let blade=0;blade<11;blade++){
  const a=angle+(random()-.5)*2.5,dx=Math.cos(a),dy=Math.sin(a);
  const reach=length*(.48+random()*.9),curl=(random()-.5)*reach,steps=Math.ceil(reach*1.4);
  const rootX=x+(random()-.5)*3,rootY=y+(random()-.5)*3;
  for(let j=0;j<=steps;j++){
   const t=j/steps,bend=curl*t*t,px=rootX+dx*reach*t-dy*bend,py=rootY+dy*reach*t+dx*bend;
   const tone=value*(.36+.64*Math.sqrt(t));
   stroke(px-dy*1.9*(1-t),py+dx*1.9*(1-t),26+28*t,.91);
   stroke(px+dy*(1-t),py-dx*(1-t),tone*.74,.9);
   stroke(px,py,tone,.97-.21*t*t);
  }
 }
}
// A side view of an unbroken grass bank in B. U repeats across the bank;
// V runs from the rooted mat to the uneven, sunlit blade tips.
for(let band=0;band<16;band++)for(let fan=0;fan<105;fan++){
 const root=random()*size,lean=(random()-.50)*19,height=9+random()*21;
 for(let blade=0;blade<14;blade++){
  const reach=lean+(random()-.5)*30,h=height*(.46+.54*random());
  const width=.85+random()*2.1,tipTone=120+random()*135;
  for(let row=0;row<h;row++){
   const t=row/h,center=root+reach*(.42*t+.58*t*t),w=width*(1.-t);
   for(let col=Math.floor(center-w);col<=Math.ceil(center+w);col++){
    const a=Math.min(1,Math.max(0,w+.55-Math.abs(col-center)));
    const idx=((size-1-band*32-row)*size+(col&mask))*3+2;
    pixels[idx]=Math.max(pixels[idx],Math.round(a*tipTone*(.40+.60*t)));
   }
  }
 }
}
// Keep the average reflectance constant across a bank: mipmapping distant tips
// or crossing from one stand to the next must not draw rows on the hillside.
for(let y=0;y<size;y++){
 let sum=0;
 for(let x=0;x<size;x++)sum+=pixels[(y*size+x)*3+2];
 const mean=sum/size;
 for(let x=0;x<size;x++){
  const i=(y*size+x)*3+2;
  pixels[i]=Math.max(0,Math.min(255,Math.round(128+(pixels[i]-mean)*.95)));
 }
}
const png=execFileSync('magick',['-size',size+'x'+size,'-depth','8','rgb:-','-strip','-define','png:exclude-chunks=date,time','PNG24:-'],{input:pixels});
writeFileSync('src/assets/coast-meadow.png',png);
