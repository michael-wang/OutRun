import {it,expect,vi} from 'vitest';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {COAST_VILLAGE_SITES,COAST_TOWN_SIDE_STREETS} from '../src/coast-village-layout';
import {buildCoastTownStreets} from '../src/coast-town-streets';
import {COAST_DISTRICTS} from '../src/coast-layout';
import {GamepadInput} from '../src/gamepad';
import {nextPaint} from '../src/car-paint-picker';

const sample=(d:number)=>({
 position:new THREE.Vector3(0,0,d),
 right:new THREE.Vector3(1,0,0),
 tangent:new THREE.Vector3(0,0,1),
 roadHeading:0,halfWidth:8.75,
}) as unknown as ReturnType<typeof import('../src/track').createTrack>['sample'] extends (d:number)=>infer R?R:never;

it('chooses a few inhabited town streets in gaps between actual buildings',()=>{
 expect(COAST_TOWN_SIDE_STREETS.length).toBeGreaterThanOrEqual(5);
 expect(COAST_TOWN_SIDE_STREETS.length).toBeLessThanOrEqual(9);
 for(const road of COAST_TOWN_SIDE_STREETS){
  const district=COAST_DISTRICTS[road.district];
  expect(road.d).toBeGreaterThan(district.start+20);
  expect(road.d).toBeLessThan(district.end-20);
  expect(road.width).toBeLessThan(8);
  expect(road.length).toBeGreaterThanOrEqual(64);
  expect(COAST_VILLAGE_SITES.filter(h=>Math.abs(h.d-road.d)<10.5)).toHaveLength(0);
 }
});

it('uses existing instanced grass assets and no triangle-rock meadow geometry',()=>{
 const streets=buildCoastTownStreets(sample,3400,4000);
 expect(streets).not.toBeNull();
 try{
  expect(streets!.userData.noShadowGround).toBe(true);
  expect(streets!.getAttribute('color').count).toBe(streets!.getAttribute('position').count);
  expect(streets!.index!.count).toBeGreaterThan(0);
  expect(streets!.index!.count/3).toBeLessThan(3500);
  const scene=readFileSync(new URL('../src/scenery.ts',import.meta.url),'utf8');
  expect(scene).not.toContain('buildCoastMeadow');
  const nature=readFileSync(new URL('../src/coast-nature.ts',import.meta.url),'utf8');
  expect(nature).not.toContain("plant('Grass_Common_Short'");
  expect(nature).not.toContain('coast-instanced-grass');
  const worker=readFileSync(new URL('../src/road-worker.ts',import.meta.url),'utf8');
  const stream=readFileSync(new URL('../src/streamed-scene.ts',import.meta.url),'utf8');
  expect(worker).toContain('noShadowGround:!!object.userData.noShadowGround');
  expect(stream).toContain('mesh.castShadow=!!this.farmSample&&!data.coastDrainWater&&!data.noShadowGround');
 }finally{streets?.dispose();}
});

it('gamepad navigation cycles paint without asking browser to click a native select',()=>{
 expect(nextPaint('pure-white',1)).toBe('seafoam-green');
 expect(nextPaint('pure-white',-1)).toBe('ferrari-red');
 expect(nextPaint('seafoam-green',1)).toBe('ferrari-red');
 const picker=readFileSync(new URL('../src/car-paint-picker.ts',import.meta.url),'utf8');
 expect(picker).toContain("this.select.dispatchEvent(new Event('change'");
 expect(picker).toContain('aria-selected');
 expect(picker).toContain("if(action==='confirm'){this.open();return true;}");
});

it('accepts held accelerator and steering immediately on resuming from OPTIONS',()=>{
 const pad:{connected:boolean;mapping:string;id:string;buttons:{pressed:boolean;value:number}[];axes:number[]}={
  connected:true,mapping:'standard',id:'Mock DS4',
  buttons:Array.from({length:18},()=>({pressed:false,value:0})),
  axes:[0,0],
 };
 const input={release:vi.fn(),press:vi.fn(),setAnalog:vi.fn()};
 const actions:string[]=[];
 const fakeStatus:Record<string,unknown>={hidden:true,textContent:'',setAttribute:()=>{}};
 vi.stubGlobal('document',{
  createElement:()=>({...fakeStatus}),
  querySelector:()=>({append:()=>{}}),
  getElementById:()=>null,
  hasFocus:()=>true,hidden:false,
 });
 vi.stubGlobal('window',{addEventListener:()=>{}});
 vi.stubGlobal('navigator',{getGamepads:()=>[pad]});
 try{
  const controller=new GamepadInput(input as any,action=>actions.push(action));
  pad.buttons[7]={pressed:true,value:1};pad.axes[0]=.6;
  controller.neutralize();controller.poll(true);
  expect(input.press).toHaveBeenCalledWith('pad:gas','gas');
  expect(input.setAnalog).toHaveBeenCalledWith('pad:axis',.6);
  controller.poll(false);
  pad.buttons[14]={pressed:true,value:1};controller.poll(false);
  expect(actions).toContain('left');
 }finally{vi.unstubAllGlobals();}
});
