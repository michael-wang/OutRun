import {test,expect} from 'vitest';
import {generateTrip} from '../src/trip';

test('canyon favors dramatic elevation across seeded journeys without prohibiting exceptions',()=>{
 const counts:Record<string,{total:number,dramatic:number}>={city:{total:0,dramatic:0},coast:{total:0,dramatic:0},canyon:{total:0,dramatic:0}};
 // This test is about the underlying authored biome/elevation distribution.
 // R2.1's camera-vista planning belongs to the dedicated canyon tests.
 for(let seed=1;seed<=40;seed++)for(const beat of generateTrip(seed,7).beats){counts[beat.world].total++;if(beat.verticality==='dramatic')counts[beat.world].dramatic++;}
 expect(counts.canyon.dramatic/counts.canyon.total).toBeGreaterThan(counts.coast.dramatic/counts.coast.total);
 expect(counts.canyon.dramatic/counts.canyon.total).toBeGreaterThan(counts.city.dramatic/counts.city.total);
 expect(counts.coast.dramatic+counts.city.dramatic).toBeGreaterThan(0);
 expect(counts.canyon.dramatic).toBeLessThan(counts.canyon.total);
});
