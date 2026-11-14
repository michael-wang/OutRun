import bpy,json
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='C:/astra-dev/tools/outrun-h1ar3d/heroine-color-study.blend')
for o in bpy.data.objects:
 if o.type!='MESH':continue
 counts={};bounds={}
 for p in o.data.polygons:
  k=p.material_index;counts[k]=counts.get(k,0)+len(p.vertices)-2
  if k not in bounds:bounds[k]=[[1e9]*3,[-1e9]*3]
  for i in p.vertices:
   v=o.matrix_world@o.data.vertices[i].co
   for a in range(3):bounds[k][0][a]=min(bounds[k][0][a],v[a]);bounds[k][1][a]=max(bounds[k][1][a],v[a])
 print(json.dumps({'object':o.name,'verts':len(o.data.vertices),'matrix':[list(r) for r in o.matrix_world],'materials':[(s.material.name,counts.get(i),bounds.get(i)) for i,s in enumerate(o.material_slots)],'attributes':[(a.name,a.domain,a.data_type) for a in o.data.attributes]}))
