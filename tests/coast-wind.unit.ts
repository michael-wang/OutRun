import {expect,it} from 'vitest';
import {createFarmWindTexture,COAST_WIND_HEADING_GLSL,farmWindGLSL,
 sampleCoastGust,sampleCoastWind} from '../src/coast-wind';

it('R4c: crop GPU and smoke CPU share the original deterministic RG8 gust source',()=>{
 const a=createFarmWindTexture(),b=createFarmWindTexture();
 expect(a.image.data).toBe(b.image.data);
 expect((a.image.data as Uint8Array).length).toBe(64*64*2);
 expect(COAST_WIND_HEADING_GLSL).toBe('vec2(1.0000,0.0000)');
 expect(farmWindGLSL).toContain('vec2 farmGust(vec2 p)');
 const p=sampleCoastGust(210,175,2);
 expect(sampleCoastGust(210,175,2)).toEqual(p);
 expect(sampleCoastGust(210,175,3)).not.toEqual(p);
 expect(sampleCoastGust(480,175,2)).not.toEqual(p);
 a.dispose();b.dispose();
});
it('R4c: the velocity is world-space and independent of the ocean wave forcing',()=>{
 const a=sampleCoastWind(210,175,2),b=sampleCoastWind(480,175,2);
 expect(Number.isFinite(a.x)&&Number.isFinite(a.z)).toBe(true);
 expect(a.x).toBeGreaterThan(0);
 expect(a).not.toEqual(b);
 const calm=sampleCoastWind(210,175,2,{direction:[1,0],speed:0,gustStrength:0});
 expect(calm).toEqual({x:0,z:0});
 expect(Object.is(calm.x,0)&&Object.is(calm.z,0)).toBe(true);
 // A reversed breeze must ALSO be positively zero when disabled.
 const reversedCalm=sampleCoastWind(210,175,2,{direction:[-1,0],speed:0,gustStrength:0});
 expect(Object.is(reversedCalm.x,0)&&Object.is(reversedCalm.z,0)).toBe(true);
 expect(sampleCoastWind(210,175,2,{direction:[-1,0],speed:2,gustStrength:0}).x).toBeLessThan(0);
});
 
it('R4d: visual wave uses the existing gust and stage clock, not another FFT',async()=>{
 const {farmHeroWaveGLSL}=await import('../src/coast-wind');
 expect(farmHeroWaveGLSL).toContain('float farmHeroWave(');
 expect(farmHeroWaveGLSL).toContain('dot(worldXZ,heading)');
 expect(farmHeroWaveGLSL).toContain('speedMps*farmTime');
 expect(farmHeroWaveGLSL).toContain('gust.y*.9');
});
