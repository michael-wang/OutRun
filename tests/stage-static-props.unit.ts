import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {coastStaticStage,staticPrefabCatalog,
 replacesLegacySite,validateStageStaticContent,type StageStaticContent,type PrefabCatalog} from '../src/content/stage-data';
import {staticPropPose} from '../src/content/static-props';

describe('R1 static stage assets — data, not per-house engine code',()=>{
 it('can swap a prefab GLB using only content data',()=>{
  const stage=structuredClone(coastStaticStage);
  const catalog=structuredClone(staticPrefabCatalog);
  validateStageStaticContent(stage,catalog);
  expect(stage.id).toBe('coast');
  expect(stage.staticProps).toHaveLength(1);
  expect(stage.staticProps[0].prefab).toBe('taiwan-farmhouse');
  expect(replacesLegacySite(stage,'coast-rural-house',1085)).toBe(true);
  catalog.prefabs['taiwan-farmhouse'].model='assets/coast-props/alternate.glb';
  stage.staticProps[0].lateral=60;
  stage.staticProps[0].roadDistance=1170;
  validateStageStaticContent(stage,catalog);
  // Replaced source is unchanged even when the new authored house moves.
  expect(replacesLegacySite(stage,'coast-rural-house',1085)).toBe(true);
  expect(stage.staticProps[0].roadDistance).toBe(1170);
  expect(catalog.prefabs['taiwan-farmhouse'].model).toBe('assets/coast-props/alternate.glb');
 });
 it('rejects unsafe paths, duplicate IDs and unknown prefabs',()=>{
  const stage=structuredClone(coastStaticStage) as StageStaticContent;
  const catalog=structuredClone(staticPrefabCatalog) as PrefabCatalog;
  stage.staticProps.push({...stage.staticProps[0]});
  expect(()=>validateStageStaticContent(stage,catalog)).toThrow('Duplicate');
  stage.staticProps.pop();
  stage.staticProps[0].prefab='unknown';
  expect(()=>validateStageStaticContent(stage,catalog)).toThrow('Unknown');
  stage.staticProps[0].prefab='taiwan-farmhouse';
  catalog.prefabs['taiwan-farmhouse'].model='../private.glb';
  expect(()=>validateStageStaticContent(stage,catalog)).toThrow('Unsafe');
 });
 it('places models using a shared road-relative transform',()=>{
  const road={position:new THREE.Vector3(20,4,80),right:new THREE.Vector3(-1,0,0),roadHeading:.3};
  const pose=staticPropPose(road,45,.62,2.75);
  expect(pose.position.toArray()).toEqual([-25,2.75,80]);
  expect(pose.yaw).toBeCloseTo(Math.PI+.62-.3);
 });
 it('includes a real single-material locally served GLB',()=>{
  const file=readFileSync(new URL('../public/assets/coast-props/r1-farmhouse.glb',import.meta.url));
  expect(file.toString('ascii',0,4)).toBe('glTF');
  expect(file.readUInt32LE(4)).toBe(2);
  expect(file.readUInt32LE(8)).toBe(file.length);
  const jsonLength=file.readUInt32LE(12);
  const header=JSON.parse(file.toString('utf8',20,20+jsonLength));
  expect(header.meshes).toHaveLength(1);
  expect(header.materials).toHaveLength(1);
  expect(header.meshes[0].primitives).toHaveLength(1);
  expect(header.accessors[0].count).toBeLessThan(1500);
  expect(header.buffers[0].byteLength).toBeGreaterThan(500);
 });
});
