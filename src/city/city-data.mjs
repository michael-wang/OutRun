// All dimensions are metres. The palette is a separate swappable geometry-independent lookup.
export const citySeed=78217;
export const finishes={
 limestone:{wall:0xbabbb1,trim:0xc7c6ba,base:0x858984},concrete:{wall:0xa5aaa6,trim:0xbfbdaf,base:0x767f80},
 tile:{wall:0xb1afa1,trim:0xc2c1b4,base:0x838880},glass:{wall:0x9ca7a8,trim:0xb9bfba,base:0x717c80}
};
const families={
 row:{width:[7,13],depth:[10,16],gap:[.15,.85],setback:[1.6,2.6],levels:[2,4],storey:[3,3.5],arcade:[2.5,3.8],bays:[2,3],balconies:[1,3],roofs:['steps','gable','terrace']},
 bazaar:{width:[11,19],depth:[12,18],gap:[.4,2.5],setback:[2.1,3.6],levels:[2,3],storey:[3.5,4.2],arcade:[3.6,5.1],bays:[3,5],balconies:[0,2],roofs:['gable','saw','steps']},
 commerce:{width:[17,29],depth:[16,24],gap:[2,6],setback:[3.3,6],levels:[3,7],storey:[3.5,4.2],arcade:[1.8,3],bays:[3,6],balconies:[1,3],roofs:['terrace','lantern']},
 tower:{width:[18,29],depth:[17,28],gap:[6,12],setback:[4.8,8],levels:[8,14],storey:[3.4,4.1],arcade:[2,4],bays:[3,5],balconies:[2,4],roofs:['lantern','terrace']}
};
export const blocks=[
 [0,1060,'row row commerce'],[1060,2200,'row commerce'],[2200,3230,'bazaar bazaar row'],
 [3230,4290,'commerce row tower'],[5680,6510,'commerce bazaar'],[6510,7160,'tower commerce row']
];
const reserves=[[297,381,-1],[1050,2190,0],[2703,2820,1],[3610,3950,1],[4280,5720,0],[5640,6510,0],[6805,6898,-1],[6990,7100,-1]];
function random(seed){let v=seed>>>0;return ()=>{v=(Math.imul(v,1664525)+1013904223)>>>0;return v/4294967296;};}
export function createParcel(family,rng,material){
 const f=families[family],range=k=>f[k][0]+rng()*(f[k][1]-f[k][0]),integer=k=>Math.min(f[k][1],Math.floor(f[k][0]+rng()*(f[k][1]-f[k][0]+1)));
 return {family,width:range('width'),depth:range('depth'),gap:range('gap'),setback:range('setback'),levels:integer('levels'),storey:range('storey'),arcade:range('arcade'),bays:integer('bays'),balconies:integer('balconies'),roof:f.roofs[Math.floor(rng()*f.roofs.length)],material};
}
export function layout(seed=citySeed){
 const lots=[];for(const [begin,end,mix] of blocks)for(const side of [-1,1]){
  const rng=random(seed+begin*37+(side+1)*181),names=mix.split(' ');
  for(let a=begin+3,index=0;a<end-6;index++){
   const key=names[Math.floor(rng()*names.length)],materials=Object.keys(finishes);
   const p=createParcel(key,rng,materials[Math.floor(rng()*materials.length)]),endLot=a+p.width;
   const corner=index%7===3;
   if(corner)p.setback+=2.7;
   if(endLot<=end&&!reserves.some(([i,j,s])=>(!s||side===s)&&a<j&&endLot>i))lots.push({...p,at:a+p.width/2,side,corner,index});
   a=endLot+p.gap+(corner?4.3:0);
  }
 }return lots;
}
export function backdrop(at,side,offset,kind='commerce'){const rng=random(citySeed+at*71+(side+1)*503);return {...createParcel(kind,rng,'concrete'),at,side,offset,index:Math.floor(at),corner:false};}
