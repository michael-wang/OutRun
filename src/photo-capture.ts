import {GAME_VERSION} from './build-info';
export interface PhotoMeta {buildVersion?:string;fps?:number;stageCode:string;seed:number;capturedAt:string;time:number;distance:number;speed:number;steer:number;grade:number;roadX:number;halfWidth:number;carPosition:number[];carRotation:number[];roadPosition:number[];surfaceGap:number|null;wheels:{name:string;gap:number|null;point:number[];surface:number[]|null}[]}
export class PhotoCapture {
 private pending:Promise<void>=Promise.resolve();private serial=0;
 constructor(private canvas:HTMLCanvasElement,private redraw:()=>void,private metadata:()=>PhotoMeta,private status:(message:string)=>void=()=>{}){
 }
 capture(){
  this.redraw();const meta=this.metadata(),out=document.createElement('canvas');out.width=this.canvas.width;out.height=this.canvas.height;const ctx=out.getContext('2d');if(!ctx)return;
  const scale=out.height/Math.max(1,this.canvas.clientHeight);
  ctx.drawImage(this.canvas,0,0);ctx.fillStyle='rgba(7,34,41,.85)';ctx.fillRect(0,0,out.width,Math.max(52,out.height*.085));ctx.fillStyle='#fff';ctx.font=`${Math.max(14,Math.round(out.height*.025))}px sans-serif`;ctx.fillText(`${meta.stageCode} · ${meta.time.toFixed(1)}s · ${meta.distance.toFixed(0)}m · ${meta.speed.toFixed(0)} km/h`,12,24,out.width-150*scale);ctx.fillText(`steer ${meta.steer.toFixed(2)} · grade ${meta.grade.toFixed(3)} · x ${meta.roadX.toFixed(1)}/${meta.halfWidth.toFixed(1)} · surface gap ${meta.surfaceGap===null?'unavailable':meta.surfaceGap.toFixed(3)+'m'}`,12,46,out.width-150*scale);
  // WebGL-only captures also include the quiet upper-right public readout.
  const w=112*scale,h=43*scale,x=out.width-w-18*scale,y=12*scale;
  ctx.fillStyle='rgba(24,27,30,.48)';ctx.fillRect(x,y,w,h);ctx.textAlign='right';
  ctx.fillStyle='#c5c8cb';ctx.font=`500 ${16*scale}px Arial`;ctx.fillText(`${meta.fps?Math.round(meta.fps):'—'} FPS`,x+w-8*scale,y+20*scale);
  ctx.fillStyle='#aeb4b9';ctx.font=`${10*scale}px Arial`;ctx.fillText(meta.buildVersion??GAME_VERSION,x+w-8*scale,y+35*scale);
  const photo={id:`${Date.now()}-${++this.serial}`,png:out.toDataURL('image/png'),meta};this.pending=this.pending.then(async()=>{const controller=new AbortController(),timer=window.setTimeout(()=>controller.abort(),10000);try{const response=await fetch('/__outrun_capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({png:photo.png,meta:photo.meta}),signal:controller.signal});if(!response.ok)throw Error(`HTTP ${response.status}`);const data=await response.json();if(typeof data.path!=='string'||!data.path.startsWith('captures/'))throw Error('Invalid archive acknowledgement');this.status('📸 Saved');}catch{this.status('PC save unconfirmed. Downloading PNG; check browser downloads.');const a=document.createElement('a');a.href=photo.png;a.download=`outrun-${photo.id}.png`;a.click();}finally{clearTimeout(timer);}});return photo.meta;
 }
}
