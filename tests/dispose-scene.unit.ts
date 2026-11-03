import {it,expect,vi} from 'vitest';
import * as THREE from 'three';
import {sceneDisposal} from '../src/dispose-scene';

it('releases shared resources even after a streamed chapter detaches its meshes',()=>{
 const scene=new THREE.Scene(),geometry=new THREE.BoxGeometry(),texture=new THREE.Texture(),material=new THREE.MeshStandardMaterial({map:texture});
 const a=new THREE.Mesh(geometry,material),b=new THREE.Mesh(geometry,material);scene.add(a,b);
 const onTexture=vi.fn(),onMaterial=vi.fn(),onGeometry=vi.fn();
 texture.addEventListener('dispose',onTexture);material.addEventListener('dispose',onMaterial);geometry.addEventListener('dispose',onGeometry);
 const release=sceneDisposal(scene);a.removeFromParent();b.removeFromParent();release();
 expect(onTexture).toHaveBeenCalledTimes(1);expect(onMaterial).toHaveBeenCalledTimes(1);expect(onGeometry).toHaveBeenCalledTimes(1);
});
