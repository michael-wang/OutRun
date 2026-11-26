// Addresses are assigned in runs along the actual parcels; reserved openings keep their own uses.
// Building dimensions are in metres. Material indices refer to bake-neighbourhood-atlas.mjs.
const corners=[[263,1],[2918,1],[6792,-1]];
export function addressUse(p){
 const {at,side}=p;
 if(corners.some(([d,s])=>s===side&&Math.abs(at-d)<.56))return 'market';
 if(p.style&&at<6500)return null; // preserve the two historic shopping rows and market entrances
 if(at<120)return side>0?'walkup':null;
 if(at<325)return side<0?'flats':'walkup';
 if(at<390)return 'walkup';
 if(at>603&&at<781)return side<0?'walkup':'flats';
 if(at>=825&&at<1060)return side>0?'flats':at>950?'civic':null;
 if(at>2185&&at<2315)return 'walkup';
 if(at>2505&&at<2665)return side>0?'workshop':'walkup';
 if(at>2830&&at<3270)return side<0||at<2980?'walkup':'workshop';
 if(at>3420&&at<4300)return side<0&&at>3630&&at<3920?'flats':'workshop';
 if(at>=6508&&at<6995)return side>0&&at<6670?'civic':side<0&&at>6910?null:'flats';
 return null;
}

export function addAddresses({site,edge,frontages}){
 for(const p of frontages){
  if(!p.use)continue;
  const {at,side,width:w,depth,levels}=p,code=p.index??p.seed??0;
  const variant=(Math.abs(Math.floor(at/60))+code)%3;
  const street=edge(at,side)+p.setback,roof=levels*(p.storey??3.35)+.65;
  site(at,side*street,'neighbourhood',({box,panel})=>{
   const span=w-.56,back=depth+.60,stoop=p.crown?1.55:2.5+variant*.55;
   const wall=[0xe5d8c2,0xded1bc,0xd1c0a8][variant],green=0x4d7861;
   function block(x,y,z,a,h,l,tint=0xffffff,tile=0){box(side*x,y,z,a,h,l,tile,tint);}
   function poster(x,y,z,width,height,tile,tint=0xffffff){
    const d=width*.5;panel([side*x,y,z-side*d],[side*x,y,z+side*d],[side*x,y+height,z+side*d],[side*x,y+height,z-side*d],tile,tint);
   }
   function sidePoster(x,y,z,width,height,tile){
    const a=side*x+width*.5,b=side*x-width*.5;panel([a,y,z],[b,y,z],[b,y+height,z],[a,y+height,z],tile);
   }
   function floorplate(setback,z,width,h,base,tile,tint){
    const thick=back-setback;
    block(setback+thick/2,base,z,thick,h,width,tint,tile);
   }
   // Plinth and footpath join the public pavement inside this parcel's existing envelope.
   block(back*.50,-.65,0,back+.12,.80,span,0xc6bca7,3);
   if(p.use==='market'){
    // Glass corner, refrigerated shelves, projecting sunshade and a pedestrian forecourt.
    const shopFront=2.3,glassWidth=span*.91,storey=3.82;
    floorplate(shopFront,0,span,storey,.15,0,0xddd0ab);
    const windows=Math.max(3,Math.round(glassWidth/3.6));for(let bay=0;bay<windows;bay++){
     const width=glassWidth/windows;poster(shopFront-.04,.35,(bay+.5)*width-glassWidth/2,width-.12,2.66,bay%2?11:13);
    }
    for(const z of [-.44,-.22,0,.22,.44])block(shopFront-.065,.30,z*span,.13,2.79,.14,0x496762);
    const entry=span*.21;poster(shopFront-.095,.23,entry,2.32,2.8,8);
    sidePoster(shopFront+2.75,.35,-span*.5-.022,5.18,2.60,13);
    block(1.3,3.12,0,2.56,.96,span+.16,0xffefcb);
    block(1.25,3.83,0,2.6,.20,span+.25,0x196d66);
    block(1.25,3.14,0,2.6,.14,span+.25,0xc18540);
    poster(.001,3.18,0,Math.min(4.6,span*.6),.81,12);
    sidePoster(1.3,3.23,-span*.5-.10,2.5,.60,12);
    block(.58,.2,-span*.40,.17,5.86,.18,0x4f655d);
    block(.58,4.55,-span*.40-.18,2.16,1.45,.20,0x275e59);sidePoster(.58,4.61,-span*.40-.29,2.02,1.32,12);
    for(const z of [-span*.32,span*.34])block(1.45,.16,z,.84,.42,1.15,0xc9bd9e);
    if(p.crown){const step=(roof-4.14)/2;for(let f=0;f<2;f++)floorplate(.65,0,span,step,4.14+step*f,24,wall);}
    else{block(back*.63,4.02,span*.12,depth*.45,.86,span*.44,0xa8afa3,10);}
    return;
   }
   if(p.use==='workshop'){
    const h=p.crown?roof:5.7+variant*1.25;
    floorplate(1.3,0,span,h,.15,3,0xb8bbaf);
    const bay=span/(w>16?3:2);
    for(let z=-span*.5+bay*.5;z<span*.5;z+=bay){
     poster(1.27,.22,z,bay*.76,3.45,10);block(1.04,3.76,z,.80,.3,bay*.88,0x9c6f52);
    }
    poster(1.27,h-1.8,0,span*.87,1.24,7);
    if(!p.crown){
     for(const z of [-.30,.02,.32]){const a=z*span,len=span*.28;
      panel([side*2,h+.08,a-len*.5],[side*back,h+.08,a-len*.5],[side*back,h+1.20,a+len*.5],[side*2,h+1.20,a+len*.5],3,0xb4c2b7);
      sidePoster((back+2)/2,h+.08,a+len*.5,back-2,1.1,9);
     }
    }return;
   }
   if(p.use==='civic'){
    const h=p.crown?roof:Math.min(12.2,roof);
    floorplate(2.6,0,span,h,.13,3,0xcfbe9d);poster(2.55,1.22,0,span*.87,Math.min(5.1,h-1.5),9);
    block(1.80,3.53,0,1.9,.37,span*.87,0xc49668);
    for(const z of [-.38,.0,.38])block(1.19,.15,z*span,.28,3.36,.30,0x698276);
    block(back*.58,h+.1,0,depth*.5,.65,span*.74,0x92a6a0,3);return;
   }
   const broad=p.use==='flats',front=stoop+.85,stairs=Math.min(3.4,span*.30),
    stairZ=(variant===1?-1:1)*(span-stairs)*.5,entryZ=-stairZ*.19;
   const height=p.crown?roof:Math.max(6.7,Math.min(broad?22:15,roof+(broad?1.4:0)));
   const unitLevels=Math.max(2,Math.round(height/3.14)),pitch=height/unitLevels;
   for(let f=0;f<unitLevels;f++){
    const set=(!p.crown&&variant===2&&f===unitLevels-1)?1.23:0;
    floorplate(front+set,0,span,pitch,.14+pitch*f,24+(broad?0:1),wall);
   }
   // The core rises above the roof and returns around the end elevation.
   const coreHeight=height+(broad?1.65:1.04),courses=Math.ceil(coreHeight/2.2);
   for(let j=0;j<courses;j++)block(front+.45,.14+j*coreHeight/courses,stairZ,2.8,coreHeight/courses,stairs,variant===2?0xc5d1c3:0xdcc7ad,variant===2?2:1);
   poster(front-.965,.66,stairZ,stairs*.46,height-.45,9);
   block(front-.08,.22,entryZ,.47,2.56,Math.min(3.3,span*.40),0x6d7973);
   poster(front-.334,.24,entryZ,Math.min(2.8,span*.35),2.45,8);
   for(let i=0;i<3;i++)block(front-.49-i*.28,.10,entryZ,.58,.40-i*.085,Math.min(3.35,span*.42),0xd4c4a7,3);
   block(front-.59,2.98,entryZ,1.85,.24,span*.39,0xbeb7a6);
   const mid=-stairZ*.46,balcony=span*.48;
   // Cantilevered decks, front parapet and shadowed sides produce real depth.
   for(let f=1;f<unitLevels;f++){
    const y=.14+f*pitch,dx=1.20+.27*((f+variant)%2);
    block(front-dx/2,y,mid,dx,.20,balcony,0xd0c5b1,3);
    block(front-dx+.07,y+.18,mid,.15,.74,balcony,variant===1?0x9eafa3:0xbeb4a1,2);
    for(const s of [-1,1])block(front-dx/2,y+.18,mid+s*(balcony-.16)/2,dx,.78,.16,0xbfb49c);
    if((variant+f)%3===1){block(front-.52,y+.25,mid+balcony*.21,.44,.52,balcony*.24,green);}
   }
   // Boundary wall is interrupted at the door; planter and gate posts stay on the lot.
   const gate=Math.min(3.1,span*.39);
   for(const s of [-1,1]){const lo=s<0?-span/2:entryZ+gate/2,hi=s<0?entryZ-gate/2:span/2;
    if(hi-lo<.25)continue;
    block(.39,.14,(lo+hi)/2,.53,.96,hi-lo,wall,variant===1?1:3);
    block(.56,1.10,(lo+hi)/2,.58,.31,hi-lo-.1,green);
    block(.42,.14,s<0?hi:lo,.50,1.47,.36,0xb7b09c,3);
   }
   if(!p.crown)block(back*.72,height+.14,-stairZ*.18,depth*.24,.82,span*.34,0xa4adb0,10);
  });
 }
}
