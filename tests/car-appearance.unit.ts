import {it,expect} from 'vitest';
import {CAR_COLORS,CAR_PAINT_PRESETS,CAR_PAINT_STORAGE_KEY,DEFAULT_CAR_COLOR,readCarColor,saveCarColor} from '../src/car-appearance';
it('exposes exactly three selectable spider-paint schemes with no added model variants',()=>{
 expect(CAR_COLORS).toEqual(['ferrari-red','pure-white','royal-blue']);
 expect(CAR_COLORS.map(c=>CAR_PAINT_PRESETS[c].label)).toEqual(['法拉利紅','純白色','寶藍色']);
 expect(new Set(CAR_COLORS.map(c=>CAR_PAINT_PRESETS[c].hex)).size).toBe(3);
 expect(CAR_PAINT_PRESETS['pure-white'].hex).toBe('#ffffff');
 expect(CAR_PAINT_PRESETS['royal-blue'].hex).toBe('#2c63ed');
});
it('persists car paint, safely defaults when an invalid or inaccessible value is stored',()=>{
 const box=new Map<string,string>();
 const store={getItem:(key:string)=>box.get(key)??null,setItem:(key:string,value:string)=>{box.set(key,value);}};
 expect(readCarColor(store)).toBe(DEFAULT_CAR_COLOR);
 saveCarColor('pure-white',store);expect(box.get(CAR_PAINT_STORAGE_KEY)).toBe('pure-white');
 expect(readCarColor(store)).toBe('pure-white');
 box.set(CAR_PAINT_STORAGE_KEY,'silver-white');expect(readCarColor(store)).toBe('pure-white');
 box.set(CAR_PAINT_STORAGE_KEY,'graphite-black');expect(readCarColor(store)).toBe('royal-blue');
 box.set(CAR_PAINT_STORAGE_KEY,'green');expect(readCarColor(store)).toBe(DEFAULT_CAR_COLOR);
 expect(readCarColor({getItem:()=>{throw Error('blocked');}})).toBe(DEFAULT_CAR_COLOR);
 expect(()=>saveCarColor('royal-blue',{setItem:()=>{throw Error('blocked');}})).not.toThrow();
});
