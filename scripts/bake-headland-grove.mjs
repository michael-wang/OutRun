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
    options.leaves.count = oak ? 6 : 5;
    options.leaves.size *= oak ? 2.05 : 1.9;
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

// A tiny untextured fan palm for the arcade cabinet miniatures. Use the
// generator's crown placement and leaf axes to fold each billboard into a frond.
const palm = new Tree();
const recipe = structuredClone(TreePreset['Oak Medium']);
recipe.seed = 18;
Object.assign(recipe.branch, {
  levels: 0, length: {0: 10}, radius: {0: .38}, sections: {0: 9},
  segments: {0: 6}, taper: {0: .42}, gnarliness: {0: .05},
});
Object.assign(recipe.leaves, {count: 12, start: .94, angle: 78, size: 5.4, sizeVariance: .17, billboard: 'single'});
palm.loadFromJson(recipe);
const trunk = palm.branchesMesh.geometry;
const blade = palm.leavesMesh.geometry.getAttribute('position');
const point = i => new THREE.Vector3().fromBufferAttribute(blade,i);
const fronds = [];
for (let i = 0; i < blade.count; i += 4) {
  const base = point(i+1).lerp(point(i+2), .5);
  const tip = point(i).lerp(point(i+3), .5);
  const side = point(i+2).sub(point(i+1)).normalize();
  const rows = [];
  for (let k = 0; k <= 6; k++) {
    const t = k/6, center = base.clone().lerp(tip,t);
    center.y += Math.sin(t*Math.PI)*1.45-t*t*1.7;
    const width = Math.sin(t*Math.PI)*.84+.01;
    const edge = sign => center.clone().addScaledVector(side,sign*width).add(new THREE.Vector3(0,-width*.32,0));
    rows.push([edge(-1),center,edge(1)]);
  }
  for(let k=1;k<rows.length;k++)for(let j=0;j<2;j++){
    const a=rows[k-1], b=rows[k];
    for(const v of [a[j],b[j],a[j+1],b[j],b[j+1],a[j+1]])fronds.push(...v.toArray());
  }
}
const rounded = values => Array.from(values,v=>+v.toFixed(3));
await writeFile('src/generated/menu-palm.json',JSON.stringify({
  trunk:rounded(trunk.toNonIndexed().attributes.position.array),fronds:rounded(fronds)
}));
