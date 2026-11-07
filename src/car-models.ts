/** Three original, period-inspired convertible bodies. These are not
 * replicas or licensed depictions of any production car. All use the exact
 * same four-wheel contact frame, seat positions, and existing physics.
 */
export const CAR_MODELS=['riviera-62','grand-tourer-67','wedge-spider-76'] as const;
export type CarModel=(typeof CAR_MODELS)[number];
export const DEFAULT_CAR_MODEL:CarModel='riviera-62';
export const CAR_MODEL_LABELS:Record<CarModel,string>={
 'riviera-62':'Riviera 62 · 義式 Barchetta',
 'grand-tourer-67':'Grand Tourer 67 · 英式長鼻 GT',
 'wedge-spider-76':'Wedge Spider 76 · 七〇年代楔形',
};
export const CAR_MODEL_STORAGE_KEY='outrun-hero-car-model';
export const isCarModel=(s:unknown):s is CarModel=>CAR_MODELS.some(m=>m===s);
export function readCarModel(storage?:Pick<Storage,'getItem'>):CarModel{
 try{const v=(storage??(typeof localStorage!=='undefined'?localStorage:undefined))?.getItem(CAR_MODEL_STORAGE_KEY);
  return isCarModel(v)?v:DEFAULT_CAR_MODEL;
 }catch{return DEFAULT_CAR_MODEL;}
}
export function saveCarModel(model:CarModel,storage?:Pick<Storage,'setItem'>):void{
 try{(storage??(typeof localStorage!=='undefined'?localStorage:undefined))?.setItem(CAR_MODEL_STORAGE_KEY,model);}
 catch{/* Private browsing may disable persistence. */}
}
