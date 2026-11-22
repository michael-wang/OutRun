import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {describe,expect,it,vi} from 'vitest';
import {InstancedMesh,Matrix4,Scene,Vector3} from 'three';
import {configureKentingCoast} from '../src/beach-macro';
import {addCoastNature,coastNatureGround,loadCoastNature} from '../src/coast-nature';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {prepareRoadChunk} from '../src/road-chunk';
import {canonicalGameQuery,isDevelopmentRace} from '../src/runtime-query';
import {shoulderProfile} from '../src/road-profile';
import {SLOPE_ART,SLOPE_STRUCTURE,parseSlopeArtMode,slopeArtMix,type SlopeArtMode} from '../src/kenting-slope-art';

configureKentingCoast();
const {track,stage,halfAt,weightsAt}=coastWorkerRoad();
const meshes=(start:number,end:number,mode?:SlopeArtMode)=>
 prepareRoadChunk(track.sample,halfAt,weightsAt,start,end,track.length,false,true,[],d=>shoulderProfile(d,stage.seed),
  undefined,true,undefined,stage.scenerySections,undefined,false,false,mode);
const bytes=(v:ArrayBufferView|undefined)=>v?createHash('sha256').update(new Uint8Array(v.buffer,v.byteOffset,v.byteLength)).digest('hex'):'none';

describe('Kenting uphill visual-art spike',()=>{
 it('is opt-in and limited to 240 track metres with smooth material decay',()=>{
  expect(SLOPE_ART.end-SLOPE_ART.start).toBe(240);
  expect([undefined,null,'baseline','mixed','','MATERIAL'].map(parseSlopeArtMode)).toEqual(Array(6).fill('baseline'));
  expect(parseSlopeArtMode('material')).toBe('material');
  expect(parseSlopeArtMode('structure')).toBe('structure');
  expect(slopeArtMix(4620,53,15,.75).rock).toBeGreaterThan(slopeArtMix(4620,53,15,.09).rock);
  for(const [d,x] of [[4500,80],[4750,80],[4590,-30],[4600,16],[4600,164]])
    expect(slopeArtMix(d,x,17,.85)).toEqual({rock:0,soil:0,grass:0});
  expect(slopeArtMix(4749.999,60,17,.7).rock).toBeLessThan(.001);
 });
 it('survives canonical URL rewriting only in dev without changing ordinary START',()=>{
  const normalize=(s:string)=>canonicalGameQuery(new URLSearchParams(s));
  const a=normalize('at=4050&trafficSeed=8&slopeArt=material');
  const b=normalize('slopeArt=structure');
  expect(a.get('slopeArt')).toBe('material');
  expect(b.get('slopeArt')).toBe('structure');
  expect(isDevelopmentRace(a)).toBe(true);
  expect(isDevelopmentRace(b)).toBe(false);
  expect(isDevelopmentRace(normalize('hero3d=1&slopeArt=material'))).toBe(false);
  for(const value of ['baseline','bad','MATERIAL'])expect(normalize('slopeArt='+value).has('slopeArt')).toBe(false);
  vi.stubEnv('DEV',false);
  try{expect(normalize('slopeArt=material&at=4050').toString()).toBe('at=4050');}
  finally{vi.unstubAllEnvs();}
 });
 it('leaves default data exact and changes only grass RGB and existing UV cover inside the probe',()=>{
  const base=meshes(4490,4780),explicit=meshes(4490,4780,'baseline');
  const a=meshes(4490,4780,'material'),b=meshes(4490,4780,'structure');
  let grassPaint=0;
  expect(a).toHaveLength(base.length);expect(b).toHaveLength(base.length);
  for(let i=0;i<base.length;i++){
   const [m,n,o]=[base[i],a[i],b[i]];
   expect(m.kind).toBe(n.kind);
   for(const key of ['positions','indices','normals'] as const){
    expect(bytes(m[key])).toBe(bytes(explicit[i][key]));
    expect(bytes(n[key])).toBe(bytes(m[key]));
    expect(bytes(o[key])).toBe(bytes(m[key]));
   }
   expect(n.rayRanges).toEqual(m.rayRanges);
   for(const key of ['colors','uvs'] as const){
    expect(bytes(m[key])).toBe(bytes(explicit[i][key]));
    expect(bytes(n[key])).toBe(bytes(o[key]));
    if(m.kind!=='grass')expect(bytes(m[key])).toBe(bytes(n[key]));
   }
   if(m.kind==='grass')for(let v=0;v<m.colors.length;v+=3){
    if(m.colors[v]!==n.colors[v]||m.colors[v+1]!==n.colors[v+1]||m.colors[v+2]!==n.colors[v+2])grassPaint++;
   }
  }
  expect(grassPaint).toBeGreaterThan(200);
  const exit=meshes(4820,4920,'structure'),untouched=meshes(4820,4920);
  for(let i=0;i<exit.length;i++){
   expect(bytes(exit[i].colors)).toBe(bytes(untouched[i].colors));
   expect(bytes(exit[i].uvs)).toBe(bytes(untouched[i].uvs));
  }
 });
 it('uses real terrain anchors and a small existing opaque-mesh budget in B only',async()=>{
  const fetch=vi.fn(async(path:string)=>new Response(await readFile(new URL('../public/'+path.replace(/^\//,''),import.meta.url))));
  vi.stubGlobal('fetch',fetch);
  try{await loadCoastNature();}finally{vi.unstubAllGlobals();}
  const pre=new Scene(),onlyPaint=new Scene(),post=new Scene();
  const x=addCoastNature(pre,track.sample,4000,5000);
  expect(addCoastNature(onlyPaint,track.sample,4000,5000,'material')).toEqual(x);
  const y=addCoastNature(post,track.sample,4000,5000,'structure');
  const triangles=(scene:Scene)=>scene.children.reduce((n,o)=>{
   if(!(o instanceof InstancedMesh))return n;
   return n+o.count*(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;
  },0);
  expect(y.instances-x.instances).toBeGreaterThanOrEqual(10);
  expect(y.draws-x.draws).toBeLessThanOrEqual(7);
  expect(triangles(post)-triangles(pre)).toBe(5208);
  for(const s of SLOPE_STRUCTURE){
   const p=track.sample(s.d),target=p.position.clone().addScaledVector(p.right,s.x);
   target.y=coastNatureGround(track.sample,s.d,s.x,4000,5000)-.06-(s.kind==='rock'?s.h*.24:0);
   const hit=post.children.some(o=>{
    if(!(o instanceof InstancedMesh))return false;
    const m=new Matrix4(),v=new Vector3();
    for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);if(v.setFromMatrixPosition(m).distanceTo(target)<.001)return true;}
    return false;
   });
   expect(hit).toBe(true);expect(s.x).toBeGreaterThan(30);
  }
 });
});
