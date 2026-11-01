import {expect,it} from 'vitest';
import {bridgeApproachAllowsBuilding} from '../src/scenery';

it('keeps city buildings off the water cutout at bridge approaches but permits the rest of town',()=>{
 const bridge={start:31200,end:32100,water:-10};
 expect(bridgeApproachAllowsBuilding(20000,bridge)).toBe(true);
 expect(bridgeApproachAllowsBuilding(bridge.start-200,bridge)).toBe(false);
 expect(bridgeApproachAllowsBuilding(bridge.start+100,bridge)).toBe(false);
 expect(bridgeApproachAllowsBuilding(bridge.end+100,bridge)).toBe(false);
 expect(bridgeApproachAllowsBuilding(bridge.end+400,bridge)).toBe(false);
 expect(bridgeApproachAllowsBuilding(bridge.end+600,bridge)).toBe(true);
 expect(bridgeApproachAllowsBuilding(bridge.end+100)).toBe(true);
});
