import {expect,it} from 'vitest';
import {COAST_EFFECTS,oceanVisualSettings,coastShadowSettings,validateCoastEffects} from '../src/content/coast-effects';
import * as THREE from 'three';
import {COAST_SUN,COAST_SHADOW_STRETCH} from '../src/coast-dusk';
import {configureCoastShadowLights} from '../src/coast-shadow-coverage';
import {sampleCoastWind} from '../src/coast-wind';
import {COAST_STAGE,validateCoastStage} from '../src/content/coast-stage';
import {coastVegetationDensity} from '../src/coast-journey-layout';
import {FARM_FLOWER_COLORS,FARM_FLOWER_DETAIL,FARM_PLOTS,farmFlowerDetail,flowerPlotColor} from '../src/coast-farm-layout';

const road=COAST_STAGE.road;
const check=(effects=COAST_EFFECTS)=>validateCoastEffects(effects,road.startDistance,road.length);

it('R4a: the accepted stage effects are valid and share the stage boundary',()=>{
 expect(()=>check()).not.toThrow();
 expect(COAST_STAGE.effects).toBe(COAST_EFFECTS);
 expect(()=>validateCoastStage(COAST_STAGE)).not.toThrow();
 expect(COAST_EFFECTS.schemaVersion).toBe(1);
 expect(COAST_EFFECTS.id).toBe('coast');
});

it('R4a: Ultra Water keeps accepted FFT and wave settings on desktop and mobile',()=>{
 expect(oceanVisualSettings(COAST_EFFECTS.ocean,true)).toEqual({
  windSpeed:6,waveScale:.55,swellScale:.3,resolution:128,
 });
 expect(oceanVisualSettings(COAST_EFFECTS.ocean,false)).toEqual({
  windSpeed:6,waveScale:.55,swellScale:.3,resolution:256,
 });
 const changed={...COAST_EFFECTS.ocean,windSpeed:9,waveScale:.3,fftMobile:64};
 expect(oceanVisualSettings(changed,true)).toMatchObject({
  windSpeed:9,waveScale:.3,resolution:64,
 });
});

it('R4a: quiet-beach foliage retains the exact original smooth transition',()=>{
 for(const [distance,expected] of [
  [1100,.73],[1810,.73],[1990,.16],[2350,.16],
  [3100,.16],[3240,.16],[3410,.73],[5000,.73],
 ] as const)expect(coastVegetationDensity(distance)).toBeCloseTo(expected,12);
 const edited={...COAST_EFFECTS.vegetation,baseDensity:.9,
  quietBeach:{...COAST_EFFECTS.vegetation.quietBeach,density:.05}};
 expect(coastVegetationDensity(2350,edited)).toBeCloseTo(.05,12);
 expect(coastVegetationDensity(1100,edited)).toBeCloseTo(.9,12);
});

it('R4a: flower palette and two detail bands are stage-configurable',()=>{
 expect(FARM_FLOWER_COLORS).toEqual(['#ecc341','#e679a7','#a382d8']);
 expect(FARM_FLOWER_DETAIL[0]).toEqual({
  bladeDensity:.105,flowerDensity:1.10,maxFlowers:2400,
 });
 expect(FARM_FLOWER_DETAIL[1]).toEqual({
  bladeDensity:.047,flowerDensity:.38,maxFlowers:720,
 });
 expect(farmFlowerDetail(0)).toBe(COAST_EFFECTS.flowers.near);
 expect(farmFlowerDetail(1)).toBe(COAST_EFFECTS.flowers.middle);
 expect(farmFlowerDetail(2)).toBeUndefined();
 const plot=FARM_PLOTS.find(p=>p.kind==='flowers')!;
 const original=flowerPlotColor(plot);
 expect(original).toMatch(/^#[0-9a-f]{6}$/i);
 expect(flowerPlotColor(plot,['#111111','#222222','#333333'])).not.toBe(original);
});

it('R4a: reject invalid mobile costs, misplaced foliage and palettes early',()=>{
 const invalid=(alter:(data:typeof COAST_EFFECTS)=>void)=>{
  const data=structuredClone(COAST_EFFECTS);alter(data);
  expect(()=>check(data)).toThrow();
  expect(()=>validateCoastStage({...COAST_STAGE,effects:data})).toThrow();
 };
 invalid(x=>{x.ocean.windSpeed=Infinity;});
 invalid(x=>{x.ocean.fftMobile=100;});
 invalid(x=>{x.ocean.fftMobile=512;});
 invalid(x=>{x.ocean.reefBreakers.end=x.ocean.reefBreakers.start;});
 invalid(x=>{x.ocean.reefBreakers.waveGain=Infinity;});
 invalid(x=>{x.vegetation.baseDensity=1.5;});
 invalid(x=>{x.vegetation.quietBeach.fullStart=x.vegetation.quietBeach.start;});
 invalid(x=>{x.vegetation.quietBeach.end=road.startDistance+road.length+1;});
 invalid(x=>{x.flowers.palette[0]='not a color';});
 invalid(x=>{x.flowers.near.maxFlowers=5001;});
 invalid(x=>{x.flowers.middle.flowerDensity=NaN;});
});

it('R4b: preserve accepted sunset, haze and shared sun direction',()=>{
 const light=COAST_EFFECTS.lighting;
 expect(COAST_SUN.toArray()).toEqual(new THREE.Vector3(...COAST_EFFECTS.lighting.sunDirection).normalize().toArray());
 expect(COAST_SHADOW_STRETCH).toBe(.70);
 expect(light.hemisphere).toEqual({sky:'#aab1da',ground:'#66534b',intensity:1.25});
 expect(light.sun).toEqual({color:'#ffc080',nearIntensity:.65,farIntensity:1.15});
 expect(light.fog).toEqual({color:'#a8796e',near:250,far:1450});
});

it('R4b: use stage-owned GPU budgets without adding shadow passes',()=>{
 const effects=COAST_EFFECTS;
 expect(coastShadowSettings(effects.shadows,true)).toEqual({
  dynamicMap:false,staticMap:false,boatDepth:true,rockShader:true,
  contactDecals:true,nearMapSize:2048,farMapSize:3072,
 });
 expect(coastShadowSettings(effects.shadows,false)).toEqual({
  dynamicMap:true,staticMap:true,boatDepth:true,rockShader:true,
  contactDecals:true,nearMapSize:3072,farMapSize:4096,
 });
 const near=new THREE.DirectionalLight(),far=new THREE.DirectionalLight();
 const changed=structuredClone(effects.shadows);
 changed.desktop.nearMapSize=2048;changed.desktop.farMapSize=3072;
 configureCoastShadowLights(near,far,false,changed);
 expect(near.shadow.mapSize.x).toBe(2048);
 expect(far.shadow.mapSize.x).toBe(3072);
 expect(far.shadow.autoUpdate).toBe(false);
});

it('R4b: reject invalid light data and mobile shadow cost escalation at stage boundary',()=>{
 const invalid=(alter:(data:typeof COAST_EFFECTS)=>void)=>{
  const data=structuredClone(COAST_EFFECTS);alter(data);
  expect(()=>check(data)).toThrow();
  expect(()=>validateCoastStage({...COAST_STAGE,effects:data})).toThrow();
 };
 invalid(x=>{x.lighting.sunDirection[1]=0;});
 invalid(x=>{x.lighting.sunDirection[0]=Infinity;});
 invalid(x=>{x.lighting.sun.color='gold';});
 invalid(x=>{x.lighting.hemisphere.intensity=-1;});
 invalid(x=>{x.lighting.fog.far=x.lighting.fog.near;});
 invalid(x=>{x.shadows.mobile.nearMapSize=4096;});
 invalid(x=>{x.shadows.mobile.dynamicMap=true;});
 invalid(x=>{x.shadows.desktop.farMapSize=999;});
 invalid(x=>{x.shadows.desktop.boatDepth=1 as unknown as boolean;});
});

it('R4c: shared coast breeze is directional, bounded and stage-validated',()=>{
 expect(COAST_EFFECTS.wind).toEqual({direction:[1,0],speed:2.6,gustStrength:.35});
 for(const [x,z,time] of [[0,0,0],[120,450,1.25],[-12,7500,8]]){
  const w=sampleCoastWind(x,z,time);
  expect(Number.isFinite(w.x)&&Number.isFinite(w.z)).toBe(true);
  expect(w.x).toBeGreaterThan(0);
  expect(Math.hypot(w.x,w.z)).toBeLessThan(6);
 }
 const invalid=(alter:(data:typeof COAST_EFFECTS)=>void)=>{
  const data=structuredClone(COAST_EFFECTS);alter(data);
  expect(()=>check(data)).toThrow();
  expect(()=>validateCoastStage({...COAST_STAGE,effects:data})).toThrow();
 };
 invalid(x=>{x.wind.direction=[0,0];});
 invalid(x=>{x.wind.direction=[2,1];});
 invalid(x=>{x.wind.speed=-1;});
 invalid(x=>{x.wind.gustStrength=Infinity;});
});
 
it('R4d: finite hero wave settings are authored per field type and validated',()=>{
 expect(COAST_EFFECTS.heroWaves.rice.wavelengthM).toBeGreaterThan(COAST_EFFECTS.heroWaves.flowers.wavelengthM);
 expect(COAST_EFFECTS.heroWaves.rice.colorPulse).toBeGreaterThan(COAST_EFFECTS.heroWaves.flowers.colorPulse);
 const invalid=structuredClone(COAST_EFFECTS);invalid.heroWaves.rice.wavelengthM=0;
 expect(()=>check(invalid)).toThrow('Invalid hero field wave parameters');
 expect(()=>validateCoastStage({...COAST_STAGE,effects:invalid})).toThrow();
});
