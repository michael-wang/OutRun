import {it,expect} from 'vitest';
import * as THREE from 'three';
import {addCoastSandLight} from '../src/coast-sand-light';

it('adds wet-sand sunset response to the existing MeshStandardMaterial without another pass',()=>{
 const material=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,vertexColors:true});
 addCoastSandLight(material);
 const shader={
  vertexShader:'#include <common>\nvoid main(){\n#include <begin_vertex>\n}',
  fragmentShader:'#include <common>\nvoid main(){\n#include <color_fragment>\n#include <roughnessmap_fragment>\n}',
  uniforms:{} as Record<string,THREE.IUniform>,
 };
 material.onBeforeCompile(shader as never,{} as never);
 expect(shader.uniforms.uCoastSandSun).toBeDefined();
 expect(shader.vertexShader).toContain('vCoastSandProfileX=uv.x');
 expect(shader.fragmentShader).toContain('coastWetSand');
 expect(shader.fragmentShader).toContain('sunGlance');
 expect(shader.fragmentShader).toContain('roughnessFactor=mix');
 expect(material.customProgramCacheKey()).toContain('coast-sand-sunset');
 expect(material.map).toBeNull();
 material.dispose();
});
