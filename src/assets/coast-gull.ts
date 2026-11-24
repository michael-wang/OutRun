import * as THREE from 'three';

// Length axis +Z. A shallow M-shaped wing with charcoal primaries and a
// warm underside reads in silhouette against both the sunset and the hillside.
type P=[number,number,number];
const positions:number[]=[],colors:number[]=[];
function face(a:P,b:P,c:P,tint:number){const rgb=new THREE.Color(tint);for(const p of [a,b,c]){positions.push(...p);colors.push(rgb.r,rgb.g,rgb.b);}}
const breast:P=[0,-.13,.13],back:P=[0,.11,-.10],bill:P=[0,.035,.50],tail:P=[0,.015,-.49];
for(const sign of [-1,1]){
 const side:P=[sign*.13,-.002,.07];
 face(bill,side,back,0xf2e7ca);face(side,bill,breast,0xb8a78f);face(tail,back,side,0xcbc8be);face(tail,side,breast,0xa69a91);
 const wrist:P=[sign*.57,.14,.03],outer:P=[sign*.87,.089,-.08],tip:P=[sign*1.03,.034,-.26],aft:P=[sign*.53,.085,-.27];
 face(back,wrist,side,0xeae5d5);face(side,wrist,aft,0xe3d6bc);face(side,aft,tail,0xc6bcb0);
 face(wrist,outer,aft,0xb7b6b0);face(outer,tip,aft,0x625f61);
}
export const gullAsset={positions:new Float32Array(positions),colors:new Float32Array(colors)};
