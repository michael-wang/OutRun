import {compositeVisibleUi} from './photo-dom';
export interface PhotoMeta {buildVersion?:string;fps?:number;stageCode:string;seed:number;capturedAt:string;time:number;distance:number;speed:number;steer:number;grade:number;roadX:number;halfWidth:number;carPosition:number[];carRotation:number[];roadPosition:number[];surfaceGap:number|null;wheels:{name:string;gap:number|null;point:number[];surface:number[]|null}[]}

/** Save exactly the game frame PLUS the DOM HUD currently visible to the player.
 * The old diagnostic black stripe is deliberately gone; evidence stays in metadata. */
export class PhotoCapture {
 private pending:Promise<void>=Promise.resolve();private serial=0;
 constructor(private canvas:HTMLCanvasElement,private redraw:()=>void,private metadata:()=>PhotoMeta,private status:(message:string)=>void=()=>{}){}
 capture(){
  this.redraw();
  const meta=this.metadata(),out=document.createElement('canvas');
  out.width=this.canvas.width;out.height=this.canvas.height;
  const ctx=out.getContext('2d');if(!ctx)return;
  // The frame and computed page styles are frozen on the button press.
  ctx.drawImage(this.canvas,0,0);
  const ui=compositeVisibleUi(out,this.canvas);
  const id=`${Date.now()}-${++this.serial}`;
  this.pending=this.pending.then(async()=>{
   let png:string;
   try{
    await ui;
    png=out.toDataURL('image/png');
   }catch(error){
    console.error('Full screenshot composition failed',error);
    this.status('📸 截圖失敗：無法合成完整 UI');
    return; // Never silently save an incomplete WebGL-only screenshot.
   }
   const download=()=>{
    const a=document.createElement('a');a.href=png;a.download='outrun-'+id+'.png';a.click();
   };
   if(import.meta.env.PROD){download();this.status('📸 PNG downloaded');return;}
   const controller=new AbortController(),timer=window.setTimeout(()=>controller.abort(),10000);
   try{
    const response=await fetch('/__outrun_capture',{method:'POST',
     headers:{'Content-Type':'application/json'},body:JSON.stringify({png,meta}),signal:controller.signal});
    if(!response.ok)throw Error(`HTTP ${response.status}`);
    const data=await response.json();
    if(typeof data.path!=='string'||!data.path.startsWith('captures/'))throw Error('Invalid archive acknowledgement');
    this.status('📸 Saved');
   }catch{
    this.status('PC save unconfirmed. Downloading PNG; check browser downloads.');
    download();
   }finally{clearTimeout(timer);}
  });
  return meta;
 }
}
