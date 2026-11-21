import * as THREE from 'three';

/** Two rotating emissive lamp heads and inexpensive translucent light volumes. No shadow pass. */
export function addLighthouseBeacon(tower:THREE.Group){
 const rotor=new THREE.Group();rotor.name='rotating-lighthouse-beacon';rotor.position.y=15.1;tower.add(rotor);
 const glow=new THREE.MeshBasicMaterial({color:0xffefb5,toneMapped:false});
 const haze=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
  vertexShader:'varying float fade;void main(){fade=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'varying float fade;void main(){gl_FragColor=vec4(1.0,.82,.48,.06*fade*fade);}' });
 for(const side of [-1,1]){
  const lens=new THREE.Mesh(new THREE.SphereGeometry(.28,12,8),glow);lens.scale.set(1,1,.55);lens.position.z=side*1.6;rotor.add(lens);
  const beam=new THREE.Mesh(new THREE.ConeGeometry(3.8,44,16,1,true),haze);beam.rotation.x=-side*Math.PI/2;beam.position.z=side*23.6;rotor.add(beam);
 }
 rotor.userData={angle:0,periodSeconds:12,method:'rotating emissive heads plus translucent light volumes, not a dynamic shadow-casting sun',update:(time:number)=>{rotor.rotation.y=(time*Math.PI/6)%(Math.PI*2);rotor.userData.angle=rotor.rotation.y;}};
 return rotor;
}
