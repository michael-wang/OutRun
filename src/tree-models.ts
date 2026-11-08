import * as THREE from 'three';
import roadsideTrees from './generated/roadside-trees.json';

export {roadsideTrees};
export const TREE_DRAW_DISTANCE=1450;
export type RoadTree=keyof typeof roadsideTrees;
export type NaturePart={position:number[];normal:number[];uv:number[];color?:number[];index?:number[];texture?:string;leafCutout?:boolean};
export function natureGeometry(data:NaturePart){
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(data.position,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(data.normal,3));
 if(data.uv.length)g.setAttribute('uv',new THREE.Float32BufferAttribute(data.uv,2));
 if(data.color?.length)g.setAttribute('color',new THREE.Float32BufferAttribute(data.color,3));
 if(data.index)g.setIndex(data.index);
 return g;
}
