import {expect,it} from 'vitest';
import {configureKentingCoast} from '../src/beach-macro';
import {coastBeachX} from '../src/coast-layout';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {COAST_SHORE_OFFSET} from '../src/scenery-cross-section';
import {HARBOUR_WET_CORE_GAIN,harbourWaterGain,harbourWaterUniforms} from '../src/working-harbour-water';

configureKentingCoast();
const {track}=coastWorkerRoad();
const field=harbourWaterUniforms(track.sample);
const bypass=harbourWaterUniforms(track.sample,false);
const gain=(station:number,offshore:number,water=field)=>{
 const {position,right}=track.sample(station);
 const p=position.clone().addScaledVector(right,coastBeachX(COAST_SHORE_OFFSET,station)-offshore);
 return harbourWaterGain(water,p.x,p.z,offshore);
};

it('preserves the Kenting cove, both sides of the first lighthouse and untuned open sea',()=>{
 for(const station of [4700,5250,5800,6020,6250,6500])
  for(const offshore of [0,10,34,70,150,250])expect(gain(station,offshore)).toBe(1);
 for(const station of [6850,7050,7200,7440,7630])
  expect(gain(station,300)).toBe(1);
 for(const station of [7950,8250,8410,9000])
  for(const offshore of [1,10,70,150])expect(gain(station,offshore)).toBe(1);
 expect(gain(7250,55,bypass)).toBe(1);
});

it('protects the basin but gradually rejoins the original reef and seaward water',()=>{
 for(const station of [7030,7200,7440])
  for(const offshore of [18,50,90])expect(gain(station,offshore)).toBeCloseTo(HARBOUR_WET_CORE_GAIN,8);
 expect(gain(6720,20)).toBeGreaterThan(gain(6820,20));
 expect(gain(6720,20)).toBeLessThan(1);
 expect(gain(7630,35)).toBeGreaterThan(gain(7440,35));
 expect(gain(7630,35)).toBeLessThan(1);
 expect(gain(7200,150)).toBeGreaterThan(gain(7200,90));
 expect(gain(7200,150)).toBeLessThan(gain(7200,300));
});
