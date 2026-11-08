// Run from the repository root after changing the two prototype recipes.
// threejs-nanites uses the same EZ-Tree species generator (Daniel Greenheck, MIT).
import {copyFile, writeFile} from 'node:fs/promises';
import * as THREE from 'three';

// EZ-Tree eagerly loads its browser materials. Baking needs geometry only.
THREE.TextureLoader.prototype.load = () => new THREE.Texture();
const {Tree, TreePreset} = await import('@dgreenheck/ez-tree');
const destination = 'public/assets/coast-nature';
const source = 'node_modules/@dgreenheck/ez-tree';
const models = {};
const roadside = {};
for (const [name, preset, species, compact] of [
  ['GroveOak', 'Oak Medium', 'oak', false],
  ['GrovePine', 'Pine Small', 'pine', false],
  ['RoadOak', 'Oak Medium', 'oak', true],
  ['RoadPine', 'Pine Small', 'pine', true],
]) {
  const options = structuredClone(TreePreset[preset]);
  const oak = species === 'oak';
  options.branch.children = oak ? {0: 6, 1: 3, 2: 2} : {0: 46, 1: 0, 2: 0};
  options.branch.sections = {0: 8, 1: 4, 2: 2, 3: 1};
  options.branch.segments = {0: 7, 1: 4, 2: 3, 3: 3};
  options.leaves.count = 7;
  options.leaves.size *= oak ? 1.85 : 2.75;
  if (compact) {
    options.branch.levels = oak ? 2 : 1;
    options.branch.children = {0: oak ? 5 : 17, 1: 2, 2: 0};
    options.branch.sections = {0: 6, 1: 3, 2: 1, 3: 1};
    options.branch.segments = {0: 5, 1: 3, 2: 3, 3: 3};
    options.leaves.count = oak ? 5 : 4;
    options.leaves.size *= oak ? 1.7 : 1.5;
  }
  const tree = new Tree();
  tree.loadFromJson(options);
  const height = new THREE.Box3().setFromObject(tree).max.y;
  const parts = [tree.branchesMesh, tree.leavesMesh].map((mesh, i) => {
    const geometry = mesh.geometry;
    geometry.scale(1 / height, 1 / height, 1 / height);
    const attribute = key => Array.from(geometry.getAttribute(key).array, v => +v.toFixed(4));
    return {position: attribute('position'), normal: attribute('normal'), uv: attribute('uv'),
      index: Array.from(geometry.index.array),
      texture: i ? species + '_color.png' : 'Bark_NormalTree.png',
      ...(i ? {leafCutout: true} : {})};
  });
  (compact ? roadside : models)[name] = {parts};
  if (!compact) await copyFile(source+'/src/lib/assets/leaves/'+species+'_color.png', destination+'/'+species+'_color.png');
  console.log(name, parts.reduce((n, p) => n + p.index.length / 3, 0), 'triangles');
}
await writeFile(destination+'/headland-grove.json', JSON.stringify(models));
await writeFile('src/generated/roadside-trees.json', JSON.stringify(roadside));
await copyFile(source+'/LICENSE', destination+'/EZ-Tree-LICENSE.txt');
