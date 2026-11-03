"""Open the current Terrain First scene; repair ONLY obsolete road corridors.
The already saved pre-road mesh is a height reference for local restoration.
No canyon geometry is generated or replaced wholesale.
"""
import bpy,json,math
from pathlib import Path
from mathutils import Vector,kdtree
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'art-prototype/output/rim-pass-r1'
scene=bpy.context.scene;land=bpy.data.objects['Connected canyon with two eroded rims']
old=json.loads((OUT/'baseline/terrain-first-road.json').read_text())
layout=json.loads((OUT/'road-layout.json').read_text())
with bpy.data.libraries.load(str(ROOT/'art-prototype/output/terrain-first/GateA_Terrain.blend'),link=False) as (src,dst):
 dst.objects=['Connected canyon with two eroded rims']
original=dst.objects[0]
tree=BVHTree.FromPolygons([v.co for v in original.data.vertices],[tuple(p.vertices) for p in original.data.polygons])
kd=kdtree.KDTree(len(old['frames']))
for i,p in enumerate(old['frames']):kd.insert((p[1],-p[3],0),i)
kd.balance();changed=0
for v in land.data.vertices:
 _,i,dist=kd.find((v.co.x,v.co.y,0));p=old['frames'][i]
 if dist>33:continue
 # Retain the accepted downstream cliff cut (the final southbound section).
 if p[0]>old['cameras'][-1][1]:continue
 hit=tree.ray_cast(Vector((v.co.x,v.co.y,1000)),Vector((0,0,-1)))
 if hit[0]:
  t=max(0,min(1,(dist-24)/9));w=1-t*t*(3-2*t);v.co.z+=(hit[0].z-v.co.z)*w;changed+=1
bpy.data.objects.remove(original,do_unlink=True)
land.data.update()
# Remove only the obsolete bridge, posts and reference roadway/cameras.
for name in ['30_BRIDGE_AND_ROAD_EDGES','00_REFERENCE_DO_NOT_EXPORT','91_GAME_CHASE']:
 c=bpy.data.collections.get(name)
 if c:
  for obj in list(c.objects):bpy.data.objects.remove(obj,do_unlink=True)
  bpy.data.collections.remove(c)
tree=BVHTree.FromPolygons([v.co for v in land.data.vertices],[tuple(p.vertices) for p in land.data.polygons])
heights=[]
for p in layout['frames']:
 hit=tree.ray_cast(Vector((p[1],-p[3],1000)),Vector((0,0,-1)))
 if not hit[0]:raise RuntimeError('New road left existing terrain')
 heights.append(hit[0].z)
(OUT/'surface-profile.json').write_text(json.dumps(heights))
scene['rim_pass_repaired_vertices']=changed;scene['rim_pass_original_vertex_count']=len(land.data.vertices)
scene['rim_pass_scope']='Existing canyon retained. Only obsolete road corridors restored and bridge removed.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Rim_Pass_Working.blend'))
print('Local repair vertices',changed,'of',len(land.data.vertices),'profile',len(heights),flush=True)
