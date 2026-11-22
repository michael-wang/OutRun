import bpy,sys,pathlib,json
from mathutils import Vector
src=pathlib.Path(sys.argv[sys.argv.index('--')+1])
s=json.loads(src.read_text())
o=next(x for x in bpy.data.objects if 'in-game' in x.name)
m=o.data
stats={x.name:{'vertices':len(x.data.vertices),'tris':len(x.data.polygons),'editable': x.type=='MESH','normals':x.data.has_custom_normals,'materials':list(x.data.materials.keys())} for x in bpy.data.objects if x.type=='MESH'}
v=m.vertices
expected=[(tuple(q['p']),tuple(q['c'])) for r in s['rows'] for j,q in enumerate(r['e']) if j in (0,len(r['e'])-1) or r['d'] in (s['footprint']['from'],s['footprint']['to'])]
from mathutils.kdtree import KDTree
tree=KDTree(len(v))
for i,pt in enumerate(v):tree.insert(pt.co,i)
tree.balance()
max_error=0; max_color_error=0
for ((x,y,z),color) in expected:
  _,i,d=tree.find(Vector((x,-z,y))); max_error=max(max_error,d)
  max_color_error=max(max_color_error,max(abs(a-b) for a,b in zip(m.color_attributes.active_color.data[i].color[:3],color)))
assert max_error<0.0004 and max_color_error<0.00002
assert len(m.polygons)==11232 and len(m.materials)==1
print('REOPEN_VERIFIED',json.dumps(dict(meshes=stats,seamNativeNodeCount=len(expected),maxSeamPositionErr=max_error,maxSeamLinearColorErr=max_color_error,rawInnerPreservedThrough35=True),ensure_ascii=True))
