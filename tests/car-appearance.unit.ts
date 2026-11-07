import {it,expect} from 'vitest';
import {CAR_COLORS,CAR_PAINT_PRESETS,CAR_PAINT_STORAGE_KEY,DEFAULT_CAR_COLOR,readCarColor,saveCarColor} from '../src/car-appearance';
it('exposes exactly three selectable spider-paint schemes with no added model variants',()=>{
 expect(CAR_COLORS).toEqual(['ferrari-red','silver-white','graphite-black']);
 expect(CAR_COLORS.map(c=>CAR_PAINT_PRESETS[c].label)).toEqual(['法拉利紅','銀白色','灰黑色']);
 expect(new Set(CAR_COLORS.map(c=>CAR_PAINT_PRESETS[c].hex)).size).toBe(3);
});
it('persists car paint, safely defaults when an invalid or inaccessible value is stored',()=>{
 const box=new Map<string,string>();
 const store={getItem:(key:string)=>box.get(key)??null,setItem:(key:string,value:string)=>{box.set(key,value);}};
 expect(readCarColor(store)).toBe(DEFAULT_CAR_COLOR);
 saveCarColor('silver-white',store);expect(box.get(CAR_PAINT_STORAGE_KEY)).toBe('silver-white');
 expect(readCarColor(store)).toBe('silver-white');
 box.set(CAR_PAINT_STORAGE_KEY,'green');expect(readCarColor(store)).toBe(DEFAULT_CAR_COLOR);
 expect(readCarColor({getItem:()=>{throw Error('blocked');}})).toBe(DEFAULT_CAR_COLOR);
 expect(()=>saveCarColor('graphite-black',{setItem:()=>{throw Error('blocked');}})).not.toThrow();
});
