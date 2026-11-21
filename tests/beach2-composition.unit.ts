import {afterEach,expect,it} from 'vitest';
import {setBeach2} from '../src/beach2-profile';
import {beach2VillageClearing} from '../src/beach2-composition-layout';
afterEach(()=>setBeach2(false));
it('keeps village sight clearings opt-in, inland, local and separated by vegetation',()=>{
 setBeach2(false);expect(beach2VillageClearing(5050,25)).toBe(false);
 setBeach2(true);expect(beach2VillageClearing(5050,25)).toBe(true);
 expect(beach2VillageClearing(5250,25)).toBe(true);
 for(const [d,x]of [[5050,-30],[5050,70],[5180,25],[5450,25],[5900,25],[4000,25]])expect(beach2VillageClearing(d,x)).toBe(false);
});
