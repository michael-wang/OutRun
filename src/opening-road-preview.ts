import * as THREE from 'three';

type RoadFrame = {position:THREE.Vector3;right:THREE.Vector3};

/** Visual-only starting road while the real Worker chunks load. Never used for driving or raycasts. */
export function createOpeningRoadPreview(
  scene:THREE.Scene,
  sample:(distance:number)=>RoadFrame,
  halfAt:(distance:number)=>number,
  distance:number,
  routeLength:number,
) {
  const from=Math.max(0,distance-100),to=Math.min(routeLength,distance+900);
  const positions:number[]=[],indices:number[]=[];
  const segments=Math.max(1,Math.ceil((to-from)/12));
  for(let i=0;i<=segments;i++){
    const d=from+(to-from)*i/segments,frame=sample(d),half=halfAt(d);
    for(const side of [-1,1]){
      const point=frame.position.clone().addScaledVector(frame.right,side*half);
      positions.push(point.x,point.y+.025,point.z);
    }
    if(i<segments){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const roadGeometry=new THREE.BufferGeometry();
  roadGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  roadGeometry.setIndex(indices);
  const roadMaterial=new THREE.MeshBasicMaterial({color:'#4c5657',side:THREE.DoubleSide});
  const road=new THREE.Mesh(roadGeometry,roadMaterial);
  road.name='opening-preview-asphalt';

  const dashPositions:number[]=[],dashIndices:number[]=[];
  for(let d=from+14;d+4<to;d+=12){
    const first=sample(d),last=sample(d+4),base=dashPositions.length/3;
    for(const [f,off] of [[first,-.11],[first,.11],[last,-.11],[last,.11]] as const){
      const point=f.position.clone().addScaledVector(f.right,off);
      dashPositions.push(point.x,point.y+.045,point.z);
    }
    dashIndices.push(base,base+1,base+2,base+1,base+3,base+2);
  }
  const dashGeometry=new THREE.BufferGeometry();
  dashGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dashPositions,3));
  dashGeometry.setIndex(dashIndices);
  const dashMaterial=new THREE.MeshBasicMaterial({color:'#fff4db',side:THREE.DoubleSide});
  const dashes=new THREE.Mesh(dashGeometry,dashMaterial);
  dashes.name='opening-preview-markings';

  const group=new THREE.Group();
  group.name='opening-road-preview';
  group.add(road,dashes);
  scene.add(group);
  return {
    dispose(){
      group.removeFromParent();
      roadGeometry.dispose();
      dashGeometry.dispose();
      roadMaterial.dispose();
      dashMaterial.dispose();
    },
  };
}
