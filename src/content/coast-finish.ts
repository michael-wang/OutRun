import * as THREE from 'three';
import type {SceneAnnotation} from '../streamed-scene';
import type {createTrack} from '../track';

/** The race timing station is the centre of both the paint and the gantry. */
export function coastFinish(distance:number,sample:ReturnType<typeof createTrack>['sample'],half:number):SceneAnnotation{
 const paint=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});
 const structure=new THREE.MeshBasicMaterial({color:0x263944});
 const sign=document.createElement('canvas');sign.width=512;sign.height=80;
 const ctx=sign.getContext('2d')!;
 ctx.fillStyle='#142432';ctx.fillRect(0,0,512,80);
 ctx.fillStyle='#fff2d4';ctx.font='bold 66px sans-serif';ctx.textAlign='center';
 ctx.fillText('FINISH',256,64);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++)if((row+col)%2===0){
  ctx.fillRect(col*20,row*20,20,20);ctx.fillRect(432+col*20,row*20,20,20);
 }
 const texture=new THREE.CanvasTexture(sign);texture.colorSpace=THREE.SRGBColorSpace;
 const banner=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
 return {distance,create:()=>{
  const frame=sample(distance),width=half*2,cell=width/20;
  const positions:number[]=[],colors:number[]=[];
  for(let row=0;row<3;row++)for(let col=0;col<20;col++){
   const shade=(row+col)%2===0?.94:.025;
   for(const [dx,dz] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]){
    const p=sample(distance+(row+dz-1.5)*cell);
    const vertex=p.position.clone().addScaledVector(p.right,-half+(col+dx)*cell);
    positions.push(vertex.x,vertex.y+.055,vertex.z);colors.push(shade,shade,shade);
   }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const line=new THREE.Mesh(g,paint);line.name='coast-finish-line';
  const posts=[-1,1].map(side=>{
   const post=new THREE.Mesh(new THREE.BoxGeometry(.42,8,.42),structure);
   post.position.copy(frame.position).addScaledVector(frame.right,side*(half+4));
   post.position.y+=4;return post;
  });
  const board=new THREE.Mesh(new THREE.PlaneGeometry(width+8.5,2.6),banner);
  board.name='coast-finish-gantry';board.position.copy(frame.position);board.position.y+=8;
  board.rotation.y=Math.PI-frame.roadHeading;
  return [line,...posts,board];
 }};
}
