import {it,expect} from 'vitest';
import {CAR_MODELS,CAR_MODEL_LABELS,CAR_MODEL_STORAGE_KEY,DEFAULT_CAR_MODEL,readCarModel,saveCarModel} from '../src/car-models';
it('has three different classic vehicle identities, independent of their paint colours',()=>{
 expect(CAR_MODELS).toEqual(['riviera-62','grand-tourer-67','wedge-spider-76']);
 expect(new Set(CAR_MODELS.map(m=>CAR_MODEL_LABELS[m])).size).toBe(3);
 expect(CAR_MODEL_LABELS['riviera-62']).toContain('Barchetta');
 expect(CAR_MODEL_LABELS['grand-tourer-67']).toContain('GT');
 expect(CAR_MODEL_LABELS['wedge-spider-76']).toContain('楔形');
});
it('persists a selected car in the existing preferences and safely recovers from bad storage',()=>{
 const map=new Map<string,string>(),storage={
  getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);},
 };
 expect(readCarModel(storage)).toBe(DEFAULT_CAR_MODEL);
 for(const model of CAR_MODELS){saveCarModel(model,storage);expect(map.get(CAR_MODEL_STORAGE_KEY)).toBe(model);expect(readCarModel(storage)).toBe(model);}
 map.set(CAR_MODEL_STORAGE_KEY,'something-else');expect(readCarModel(storage)).toBe(DEFAULT_CAR_MODEL);
 expect(readCarModel({getItem:()=>{throw Error('blocked');}})).toBe(DEFAULT_CAR_MODEL);
 expect(()=>saveCarModel(DEFAULT_CAR_MODEL,{setItem:()=>{throw Error('blocked');}})).not.toThrow();
});
