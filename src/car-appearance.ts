/** Lightweight, asset-free paint palette. One mesh and one set of materials;
 * no additional car objects, renders or shader variants for color changes.
 */
export const CAR_COLORS=['ferrari-red','silver-white','graphite-black'] as const;
export type CarColor=(typeof CAR_COLORS)[number];
export const DEFAULT_CAR_COLOR:CarColor='ferrari-red';
export const CAR_PAINT_PRESETS={
 'ferrari-red':{label:'法拉利紅',hex:'#e51e2c',metalness:.38,roughness:.23},
 'silver-white':{label:'銀白色',hex:'#d8dee0',metalness:.66,roughness:.20},
 'graphite-black':{label:'灰黑色',hex:'#383b44',metalness:.54,roughness:.24},
} as const satisfies Record<CarColor,{label:string;hex:string;metalness:number;roughness:number}>;
export const CAR_PAINT_STORAGE_KEY='outrun-hero-car-color';
export const isCarColor=(value:unknown):value is CarColor=>CAR_COLORS.some(color=>color===value);
export function readCarColor(storage?:Pick<Storage,'getItem'>):CarColor{
 try{
  const source=storage??(typeof localStorage!=='undefined'?localStorage:undefined);
  const value=source?.getItem(CAR_PAINT_STORAGE_KEY);
  return isCarColor(value)?value:DEFAULT_CAR_COLOR;
 }catch{return DEFAULT_CAR_COLOR;}
}
export function saveCarColor(color:CarColor,storage?:Pick<Storage,'setItem'>):void{
 try{(storage??(typeof localStorage!=='undefined'?localStorage:undefined))?.setItem(CAR_PAINT_STORAGE_KEY,color);}
 catch{/* Browser storage can be blocked in private mode. */}
}
