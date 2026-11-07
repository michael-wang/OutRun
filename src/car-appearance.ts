/** Lightweight, asset-free paint palette. One mesh and one set of materials;
 * no additional car objects, renders or shader variants for color changes.
 */
export const CAR_COLORS=['ferrari-red','pure-white','seafoam-green'] as const;
export type CarColor=(typeof CAR_COLORS)[number];
export const DEFAULT_CAR_COLOR:CarColor='ferrari-red';
export const CAR_PAINT_PRESETS={
 'ferrari-red':{label:'法拉利紅',hex:'#e51e2c',metalness:.38,roughness:.23},
 'pure-white':{label:'純白色',hex:'#ffffff',metalness:.12,roughness:.24},
 'seafoam-green':{label:'復古湖水綠',hex:'#80b9ad',metalness:.25,roughness:.25},
} as const satisfies Record<CarColor,{label:string;hex:string;metalness:number;roughness:number}>;
export const CAR_PAINT_STORAGE_KEY='outrun-hero-car-color';
export const isCarColor=(value:unknown):value is CarColor=>CAR_COLORS.some(color=>color===value);
export function readCarColor(storage?:Pick<Storage,'getItem'>):CarColor{
 try{
  const source=storage??(typeof localStorage!=='undefined'?localStorage:undefined);
  const value=source?.getItem(CAR_PAINT_STORAGE_KEY);
  // Preserve a player's previous color choice when upgrading the palette.
  if(value==='silver-white')return 'pure-white';
  // Retired dark/blue paint choices migrate to the brighter classic
  // seafoam green so existing local saves never select an absent option.
  if(value==='graphite-black'||value==='royal-blue')return 'seafoam-green';
  return isCarColor(value)?value:DEFAULT_CAR_COLOR;
 }catch{return DEFAULT_CAR_COLOR;}
}
export function saveCarColor(color:CarColor,storage?:Pick<Storage,'setItem'>):void{
 try{(storage??(typeof localStorage!=='undefined'?localStorage:undefined))?.setItem(CAR_PAINT_STORAGE_KEY,color);}
 catch{/* Browser storage can be blocked in private mode. */}
}
