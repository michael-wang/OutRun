/**
 * Scenic authoring bridge (offline only). The playable road, Worker and AI remain
 * untouched. Moving a site means changing the layout anchor, not its GLB parts.
 *
 * node scripts/build-scenic-layout.mjs --check
 * node scripts/build-scenic-layout.mjs --write
 */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const fromRoot=path=>resolve(root,path);
const file={
  packages:'content/scenery/packages.json',
  layout:'content/stages/coast/scenic-layout.json',
  scene:'content/stages/coast/scene.json',
  direction:'content/stages/coast/direction.json',
  road:'content/stages/coast/road.json',
  catalog:'content/prefabs/catalog.json',
};
const read=async key=>JSON.parse(await readFile(fromRoot(file[key]),'utf8'));
const requireValid=(value,message)=>{if(!value)throw Error('Scenic layout: '+message);};
const finite=(value,desc)=>requireValid(Number.isFinite(value),desc+' must be finite');
const round=value=>Math.round((value+Number.EPSILON)*1000000)/1000000;
const identifier=/^[a-z][a-z0-9-]*$/;

/**
 * This first bridge composes rigid GLB props in road-space (forward/right).
 * Marine waterlines and large shoreline terrain modules need later adapters;
 * those should reuse the package identity without changing model assets.
 */
export function compileScenicContent({packages,layout,scene,direction,road,catalog}){
  requireValid(packages.schemaVersion===1&&layout.schemaVersion===1&&layout.id==='coast',
    'unsupported packages/layout schema');
  requireValid(scene.schemaVersion===1&&scene.id===layout.id&&direction.id===layout.id,
    'stage ID/schema mismatch');
  const start=road.startDistance,end=start+road.length;
  finite(start,'road.startDistance');finite(end,'road end');
  requireValid(packages.packages&&typeof packages.packages==='object'&&
    Array.isArray(layout.heroAnchors)&&Array.isArray(layout.sites),
    'missing package registry or site/hero arrays');
  const anchors=new Map();
  const heroIds=new Set(direction.heroSlots.map(slot=>slot.id));
  requireValid(layout.heroAnchors.length===heroIds.size,'hero anchor count mismatch');
  for(const a of layout.heroAnchors){
    requireValid(heroIds.has(a.id)&&!anchors.has(a.id),'unknown/duplicate hero anchor '+a.id);
    finite(a.roadDistance,a.id+'.roadDistance');
    requireValid(a.roadDistance>=start&&a.roadDistance<end,'hero anchor outside road '+a.id);
    anchors.set(a.id,a.roadDistance);
  }
  const nextDirection={...direction,heroSlots:direction.heroSlots.map(slot=>({
    ...slot,distance:anchors.get(slot.id),
  })).sort((a,b)=>a.distance-b.distance)};
  for(let i=1;i<nextDirection.heroSlots.length;i++){
    requireValid(nextDirection.heroSlots[i-1].distance<nextDirection.heroSlots[i].distance,
      'hero anchors overlap');
  }
  const ids=new Set(),props=[];
  for(const site of layout.sites){
    requireValid(identifier.test(site.id)&&!ids.has(site.id),'invalid/duplicate site '+site.id);
    ids.add(site.id);
    const pack=packages.packages[site.package];
    requireValid(pack&&Array.isArray(pack.members)&&pack.members.length,
      'unknown or empty package '+site.package);
    requireValid((typeof site.heroId==='string')!==('roadDistance' in site),
      site.id+' must choose exactly one of heroId / roadDistance');
    const at=site.heroId?anchors.get(site.heroId):site.roadDistance;
    finite(at,site.id+' anchor');
    for(const k of ['lateral','yaw','scale'] )finite(site[k],site.id+'.'+k);
    requireValid(site.scale>0,site.id+' invalid scale');
    if(site.heightOffset!==undefined)finite(site.heightOffset,site.id+'.heightOffset');
    if(site.replaces){
      requireValid(site.replaces.source==='coast-rural-house'&&
        pack.members.some(m=>m.id===site.replaces.member),
        site.id+' invalid legacy replacement');
      finite(site.replaces.distance,site.id+'.replaces.distance');
    }
    const memberIds=new Set();
    for(const member of pack.members){
      requireValid(identifier.test(member.id)&&!memberIds.has(member.id),
        'invalid/duplicate member '+site.package+'/'+member.id);
      memberIds.add(member.id);
      requireValid(catalog.prefabs[member.prefab], 'unknown prefab '+member.prefab);
      for(const k of ['forwardM','rightM','yaw','scale','heightOffset'])
        finite(member[k],site.package+'/'+member.id+'.'+k);
      requireValid(member.scale>0,'invalid member scale '+member.id);
      // Rotate a small road-space kit by the site heading. Each member is
      // sampled against the real road at its own forward distance at runtime.
      const c=Math.cos(site.yaw),s=Math.sin(site.yaw);
      const d=round(at+member.forwardM*c-member.rightM*s);
      const lateral=round(site.lateral+member.forwardM*s+member.rightM*c);
      requireValid(d>=start&&d<=end,site.id+'/'+member.id+' outside road');
      const prop={id:`${site.id}-${member.id}`,prefab:member.prefab,
        roadDistance:d,lateral,yaw:round(site.yaw+member.yaw),
        scale:round(site.scale*member.scale),
        heightOffset:round((site.heightOffset??0)+member.heightOffset)};
      // Legacy replacement means "suppress that old source even if this kit
      // is relocated"; the model itself never embeds this site-specific fact.
      if(site.replaces?.member===member.id){
        prop.replaces={source:site.replaces.source,distance:site.replaces.distance};
      }
      props.push(prop);
    }
  }
  const nextScene={schemaVersion:1,id:layout.id,staticProps:props};
  return {scene:nextScene,direction:nextDirection};
}

export async function run(args=process.argv.slice(2)){
  requireValid(args.length===1&&['--check','--write'].includes(args[0]),
    'usage: node scripts/build-scenic-layout.mjs --check|--write');
  const inputs=Object.fromEntries(await Promise.all(Object.keys(file).map(async k=>[k,await read(k)])));
  const result=compileScenicContent(inputs);
  if(args[0]==='--check'){
    assert.deepStrictEqual(inputs.scene,result.scene,
      'scene.json differs from scenic-layout.json; run npm run scenic:build');
    assert.deepStrictEqual(inputs.direction,result.direction,
      'direction.json hero positions differ from scenic-layout.json; run npm run scenic:build');
    process.stdout.write(`Scenic layout OK: ${inputs.layout.heroAnchors.length} hero anchors, ${inputs.layout.sites.length} sites, ${result.scene.staticProps.length} GLB props\n`);
  } else {
    for(const key of ['scene','direction']){
      await writeFile(fromRoot(file[key]),JSON.stringify(result[key],null,2)+'\n');
    }
    process.stdout.write('Generated scene.json + direction.json from movable scenic anchors; GLB files unchanged.\n');
  }
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  run().catch(error=>{console.error(error);process.exitCode=1;});
}
