import {it,expect} from 'vitest';
import * as THREE from 'three';
import {COAST_GRASS_FOG_STRENGTH,softenCoastInlandFog} from '../src/coast-inland-fog';

it('limits sunset fog on inland grass to a small fraction without touching other materials',()=>{
 const coastGrass=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true});
 const otherMaterial=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true});
 const unmodifiedKey=otherMaterial.customProgramCacheKey();
 softenCoastInlandFog(coastGrass);

 expect(COAST_GRASS_FOG_STRENGTH).toBeLessThanOrEqual(.12);
 expect(COAST_GRASS_FOG_STRENGTH).toBeGreaterThan(0);
 expect(coastGrass.fog).toBe(true); // keep gentle long-distance recession
 expect(coastGrass.vertexColors).toBe(true);
 expect(coastGrass.customProgramCacheKey()).not.toBe(unmodifiedKey);
 expect(otherMaterial.customProgramCacheKey()).toBe(unmodifiedKey);

 // Inspect the compiled fragment source hook (no GL device required).
 const shader=({fragmentShader:'void main(){\n#include <fog_fragment>\n}'}) as Parameters<typeof coastGrass.onBeforeCompile>[0];
 coastGrass.onBeforeCompile(shader,{} as THREE.WebGLRenderer);
 expect(shader.fragmentShader).not.toContain('#include <fog_fragment>');
 expect(shader.fragmentShader).toContain('coastGrassFogFactor*0.10');
 expect(shader.fragmentShader).toContain('mix(gl_FragColor.rgb,fogColor');
 expect(shader.fragmentShader).toContain('#ifdef FOG_EXP2');
 coastGrass.dispose();otherMaterial.dispose();
});
