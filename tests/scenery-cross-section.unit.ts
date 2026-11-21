import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {addJourneyScenery} from '../src/scenery';
import {prepareRoadChunk} from '../src/road-chunk';
import {planScenerySections,scenerySectionAt,sceneryGroundMixAt,
 sceneryGroundY,sceneryFarReach,type ScenerySection,SECTION_LABELS} from '../src/scenery-cross-section';

const fakeStageSection=(kind:ScenerySection['kind'],left:ScenerySection['left'],right:ScenerySection['right']):readonly ScenerySection[]=>[
 {id:'test-section',kind,start:0,end:1500,left,right},
];
const flat=(distance:number)=>({position:new THREE.Vector3(0,45,distance),
 right:new THREE.Vector3(1,0,0),tangent:new THREE.Vector3(0,0,1),
 roadHeading:0,curvature:0});
const bodies=(sections:readonly ScenerySection[])=>{
 const scene=new THREE.Scene(),length=1500;
 addJourneyScenery(scene,flat as any,length,2,1,()=>7,()=>[0,0,1],
  {start:0,end:900,openRoad:true,landmarkSites:[],scenerySections:sections});
 const wallColors=new Set(['eed6b4','e6a48b','a9c9bf','e3c286','d7b9bf']);
 const items:{x:number;y:number;bottom:number;h:number}[]=[];
 const matrix=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();
 scene.traverse(o=>{
  if(!(o instanceof THREE.InstancedMesh)||o.geometry.type!=='BoxGeometry'||
   !wallColors.has((o.material as THREE.MeshStandardMaterial).color.getHexString()))return;
  for(let i=0;i<o.count;i++){
   o.getMatrixAt(i,matrix);matrix.decompose(p,q,scale);
   if(scale.y<8||scale.x<7)continue;
   items.push({x:p.x,y:p.y,bottom:p.y-scale.y/2,h:scale.y});
  }
 });
 return items;
};

describe('Scenery Credibility R1.0 — city cross-section and physical grounding',()=>{
 it('plans section roles from explicit authored beats, without Trip generators',()=>{
  const beats=[
   {id:'coast',startS:0,endS:1800,world:'coast' as const},
   {id:'city-1',startS:1800,endS:3600,world:'city' as const},
   {id:'city-2',startS:3600,endS:5400,world:'city' as const},
   {id:'canyon',startS:5400,endS:7000,world:'canyon' as const},
  ];
  const sections=planScenerySections(beats);
  expect(Object.isFrozen(sections)).toBe(true);
  expect(sections.map(s=>s.kind)).toEqual(['coastal-left','urban-both','urban-both','canyon']);
  expect(sections.map(s=>s.start)).toEqual([350,2150,3950,5750]);
  for(const section of sections){
   expect(Object.isFrozen(section)).toBe(true);
   expect(SECTION_LABELS[section.kind].length).toBeGreaterThan(3);
   expect(scenerySectionAt(sections,(section.start+section.end)/2)).toEqual(section);
  }
 });
 it('eases role transitions over absolute route distance with no stream chunk seam discontinuity',()=>{
  const sections=[
   ...fakeStageSection('waterfront-left','sea','city'),
   {id:'urban',kind:'urban-both' as const,start:1500,end:3200,left:'city' as const,right:'city' as const},
  ];
  for(const point of [1320,1499,1500,1501,1680]){
   const before=sceneryGroundMixAt(sections,point-.01);
   const after=sceneryGroundMixAt(sections,point+.01);
   expect(Math.abs(before.leftLand-after.leftLand)).toBeLessThan(.001);
   expect(Math.abs(before.rightSea-after.rightSea)).toBeLessThan(.001);
  }
  expect(sceneryGroundMixAt(sections,1300).leftLand).toBe(0);
  expect(sceneryGroundMixAt(sections,1500).leftLand).toBeCloseTo(.5);
  expect(sceneryGroundMixAt(sections,1700).leftLand).toBe(1);
 });
 it('the ocean-facing side drops to sea level; a city/canyon far shelf supports actual structures',()=>{
  const physical=(x:number)=>x,none={leftLand:0,rightSea:0},city={leftLand:1,rightSea:0},flipped={leftLand:1,rightSea:1};
  expect(sceneryGroundY(-160,45,0,physical,0,none)).toBeCloseTo(-5.05);
  expect(sceneryGroundY(-160,45,0,physical,0,city)).toBeGreaterThan(30);
  expect(sceneryGroundY(-450,45,0,physical,0,city)).toBeGreaterThan(20);
  expect(sceneryGroundY(160,45,0,physical,0,city)).toBeGreaterThan(25);
  expect(sceneryGroundY(160,45,0,physical,0,flipped)).toBeCloseTo(-5.05);
  expect(sceneryGroundY(-13,45,0,physical,0,flipped)).toBeCloseTo(44.9);
  expect(sceneryGroundY(13,45,0,physical,0,flipped)).toBeCloseTo(44.9);
 });
 it('avoids extending far terrain across tight hairpins',()=>{
  expect(sceneryFarReach(0)).toBe(450);
  expect(sceneryFarReach(.0016)).toBeGreaterThan(300);
  expect(sceneryFarReach(.005)).toBe(160);
 });
 it('streams extra land to 450m on both sides with identical 100m chunk seams',()=>{
  const sections=fakeStageSection('urban-both','city','city');
  const build=(a:number,b:number)=>prepareRoadChunk(
   flat as any,()=>7,()=>[0,0,1],a,b,1500,false,true,[],
   undefined,undefined,true,undefined,sections);
  const a=build(0,100),b=build(100,200),old=prepareRoadChunk(
   flat as any,()=>7,()=>[0,0,1],0,100,1500);
  const sand=a.find(m=>m.kind==='sand')!,right=a.find(m=>m.kind==='grass')!;
  expect(sand.positions.length).toBeGreaterThan(old.find(m=>m.kind==='sand')!.positions.length);
  expect(right.positions.length).toBeGreaterThan(old.find(m=>m.kind==='grass')!.positions.length);
  const landFar=sceneryGroundY(-450,45,0,x=>x,0,{leftLand:1,rightSea:0});
  expect(sand.positions[1]).toBeCloseTo(landFar,4);
  // The first 66 position floats are the added far-left 0–100m strip.
  expect(Array.from(sand.positions.slice(60,66))).toEqual(
   Array.from(b.find(m=>m.kind==='sand')!.positions.slice(0,6)));
  const x=flat(100).position.y;
  expect(x).toBe(45);
 });
 it('grounds near and distant city buildings on both sides, without city blocks out over the sea',()=>{
  const both=fakeStageSection('urban-both','city','city');
  const left=bodies(both);
  expect(left.filter(p=>p.x< -28).length).toBeGreaterThan(5);
  expect(left.filter(p=>p.x>28).length).toBeGreaterThan(5);
  for(const b of left){
   const y=sceneryGroundY(b.x,45,0,x=>x,0,{leftLand:1,rightSea:0});
   expect(Math.abs(b.bottom-y),`building x=${b.x.toFixed(2)} h=${b.h.toFixed(2)}`).toBeLessThan(.05);
  }
  const coastline=bodies(fakeStageSection('waterfront-left','sea','city'));
  expect(coastline.some(p=>p.x< -28)).toBe(false);
  expect(coastline.some(p=>p.x>28)).toBe(true);
  const mirrored=bodies(fakeStageSection('waterfront-right','city','sea'));
  expect(mirrored.some(p=>p.x< -28)).toBe(true);
  expect(mirrored.some(p=>p.x>28)).toBe(false);
 },30000);
});
