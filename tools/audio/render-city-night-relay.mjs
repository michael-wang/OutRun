// Original stereo score "Neon Relay". Run from the repository root with Node and FFmpeg.
import {spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
const rate=32000, beat=60/148, bars=32, duration=beat*4*bars;
const frames=Math.round(duration*rate), left=new Float32Array(frames),right=new Float32Array(frames);
const tau=2*Math.PI,hz=n=>440*2**((n-69)/12);
let seed=5392;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;}
function voice(at,beats,pan,level,sample){
 const start=Math.round(at*beat*rate),count=Math.round(beats*beat*rate);
 const l=level*Math.cos((pan+1)*Math.PI/4),r=level*Math.sin((pan+1)*Math.PI/4);
 for(let i=0;i<count;i++){
  const t=i/rate, end=Math.min(1,(count-i)/(rate*.014));
  const y=sample(t)*end, j=(start+i)%frames;left[j]+=y*l;right[j]+=y*r;
 }
}
function note(at,pitch,len,pan,gain,kind){
 const f=hz(pitch);
 voice(at,len,pan,gain,t=>{
  const a=t*tau*f+(kind==='lead'?.023*Math.sin(t*31)*Math.min(1,t*4):0);
  if(kind==='bass')return Math.min(1,t*220)*Math.exp(-t*3)*(Math.sin(a)+.28*Math.sin(2*a)+.17*Math.sin(3*a)*Math.exp(-t*5));
  if(kind==='keys')return Math.min(1,t*160)*Math.exp(-t*5)*(Math.sin(a+.8*Math.exp(-t*8)*Math.sin(2*a))+.22*Math.sin(2.003*a));
  return Math.min(1,t*80)*Math.exp(-t*1.65)*(.8*Math.sin(a)+.32*Math.sin(2*a)+.24*Math.sin(3*a)+.10*Math.sin(5*a));
 });
}
// D minor, suspended fourths and bright major sevenths; bridge moves the bass away from tonic.
const chords=[[38,53,57,60,64],[34,53,57,62,65],[41,52,57,60,64],[36,52,55,62,67],
 [43,53,58,62,65],[39,55,58,62,67],[34,53,57,62,65],[33,52,55,61,64]];
// Phrases have rests, sustained answers and an upbeat pickup into the next bar.
const phrases=[
 [[0,69,.7],[.75,72,.26],[1.25,74,.75],[2.5,77,.45],[3.25,76,.57]],
 [[.25,74,.9],[1.75,69,.45],[2.5,65,.8],[3.75,67,.25]],
 [[0,69,.38],[.5,72,.38],[1,76,1.05],[2.5,79,.45],[3.25,77,.55]],
 [[0,76,1.25],[1.75,72,.4],[2.5,67,.65],[3.5,69,.4]],
 [[0,70,.9],[1.5,74,.45],[2,77,.9],[3.5,79,.35]],
 [[0,79,.45],[.75,77,.65],[1.75,74,.35],[2.5,70,1.05]],
 [[.5,65,.6],[1.5,69,.45],[2.25,74,1.05],[3.75,72,.23]],
 [[0,73,.8],[1.25,69,.6],[2.25,64,.5],[3.25,67,.38],[3.75,69,.24]]];
for(let b=0;b<bars;b++){
 const at=b*4, bridge=b>=16&&b<24,final=b>=24,index=bridge?4+b%4:b%4;
 const [root,...voicing]=chords[index],phrase=phrases[index];
 const downbeats=bridge?[0,2.5]:[0,1.5,2,3.5];
 for(const k of downbeats)voice(at+k,.73,0,.72,t=>Math.exp(-t*14)*Math.sin(tau*(50*t+2.1*(1-Math.exp(-t*55)))));
 for(const k of [1,3]){let z=0;voice(at+k,.57,.08,.35,t=>{const n=random(),hp=n-z;z=n;return Math.exp(-t*22)*(.48*hp+.42*Math.sin(tau*180*t));});}
 for(let i=0;i<8;i++){let prev=0;const open=i===7&&b%2===1;voice(at+i*.5,open?.45:.23,i%2?.52:-.32,i%2?.075:.105,t=>{const n=random(),hp=n-prev;prev=n;return hp*Math.exp(-t*(open?22:75));});}
 if(b%8===7)for(let i=0;i<4;i++)voice(at+3+i*.25,.27,(i-1.5)*.36,.32,t=>Math.exp(-t*18)*Math.sin(tau*(188-i*29)*t+1.4*(1-Math.exp(-t*33))));
 const bass=bridge?[[0,0,1.2],[1.5,7,.35],[2,0,.85],[3.25,12,.55]]:[[0,0,.68],[.75,12,.26],[1.5,7,.38],[2,0,.58],[2.75,12,.38],[3.5,7,.35]];
 for(const [offset,n,len] of bass)note(at+offset,root+n,len,-.04,.48,'bass');
 for(const k of (bridge?[0,2]:[.5,1.75,2.5,3.25]))for(const [i,p] of voicing.entries())note(at+k+i*.016,p,bridge?1.65:.47,(i-1.5)*.41,.14,'keys');
 if(b>=2||b===0)for(const [k,n,len] of phrase){
  note(at+k,n,len,.12,.31,'lead');note(at+k+.75,n,len,-.50,.064,'lead');
  if(final&&k<2.5)note(at+k,n-12,len,-.33,.115,'lead');
 }
}
const pcm=Buffer.alloc(frames*4);
for(let i=0;i<frames;i++)for(const [ch,buf] of [left,right].entries())pcm.writeInt16LE(Math.round(28200*Math.tanh(buf[i]*1.24)),4*i+2*ch);
mkdirSync('src/city/music',{recursive:true});
const res=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','s16le','-ar',String(rate),'-ac','2','-i','pipe:0','-c:a','libvorbis','-q:a','4','-metadata','title=Neon Relay','src/city/music/neon-relay.ogg'],{input:pcm});
if(res.status!==0)throw Error(String(res.stderr||res.error));console.log(frames/rate,'seconds');
