/** Cheap R0 regression: moving a site never mutates its asset recipe. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {compileScenicContent} from './build-scenic-layout.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
const source={
  packages:await read('content/scenery/packages.json'),
  layout:await read('content/stages/coast/scenic-layout.json'),
  scene:await read('content/stages/coast/scene.json'),
  direction:await read('content/stages/coast/direction.json'),
  road:await read('content/stages/coast/road.json'),
  catalog:await read('content/prefabs/catalog.json'),
};
const before=compileScenicContent(source);
assert.deepStrictEqual(before.scene,source.scene);
assert.deepStrictEqual(before.direction,source.direction);

// A mock sail-bay group uses a known GLB for this structural test only.
// This is NOT a request to spawn an actual farmhouse on the water.
const movable=structuredClone(source);
movable.layout.sites.push({id:'portability-probe',package:'rural-hamlet-pilot',
  heroId:'bay-entrance',lateral:-45,yaw:0,scale:1});
const beforeMove=compileScenicContent(movable);
const bay=movable.layout.heroAnchors.find(a=>a.id==='bay-entrance');
bay.roadDistance=7350;
const afterMove=compileScenicContent(movable);
assert.notDeepStrictEqual(beforeMove.scene,afterMove.scene);
assert.equal(beforeMove.scene.staticProps.at(-1).prefab,afterMove.scene.staticProps.at(-1).prefab);
assert.equal(afterMove.scene.staticProps.at(-1).roadDistance,7350);
assert.equal(afterMove.direction.heroSlots.find(s=>s.id==='bay-entrance').distance,7350);
assert.deepStrictEqual(movable.packages,source.packages);
assert.deepStrictEqual(movable.catalog,source.catalog);
assert.deepStrictEqual(afterMove.scene.staticProps[0],source.scene.staticProps[0]);

const bad=structuredClone(source);
bad.layout.sites.push({...bad.layout.sites[0]});
assert.throws(()=>compileScenicContent(bad),/duplicate site/);
console.log('Scenic portable-site contract PASS: hero position + generated GLB location move together; asset recipe/catalog unchanged.');
