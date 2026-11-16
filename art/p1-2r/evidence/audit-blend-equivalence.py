import bpy,json,hashlib,sys
from pathlib import Path
def props(x):
 d={}
 for prop in x.bl_rna.properties:
  k=prop.identifier
  if k=='rna_type': continue
  if prop.type in {'BOOLEAN','INT','FLOAT','STRING','ENUM'}:
   v=getattr(x,k)
   if getattr(prop,'is_array',False): v=list(v)
   if isinstance(v,set): v=sorted(v)
   d[k]=v
 return d
r={'objects':[],'materials':[]}
for o in bpy.data.objects:
 d={'properties':props(o),'matrix_world':[list(x) for x in o.matrix_world], 'matrix_parent_inverse':[list(x) for x in o.matrix_parent_inverse], 'parent':o.parent.name if o.parent else None,'modifiers':[props(m) for m in o.modifiers],'material_slots':[s.material.name if s.material else None for s in o.material_slots]}
 if o.type=='MESH':d['mesh']={'vertices':[list(v.co) for v in o.data.vertices],'edges':[list(e.vertices) for e in o.data.edges],'polygons':[{'vertices':list(f.vertices),'smooth':f.use_smooth,'material':f.material_index} for f in o.data.polygons]}
 r['objects'].append(d)
for m in bpy.data.materials:
 d={'properties':props(m)}
 if m.node_tree:
  d['nodes']=[{'properties':props(n),'inputs':[{ 'name':i.name,'value':list(i.default_value) if hasattr(i.default_value,'__len__') and not isinstance(i.default_value,str) else i.default_value} for i in n.inputs if hasattr(i,'default_value')]} for n in m.node_tree.nodes]
  d['links']=[(l.from_node.name,l.from_socket.identifier,l.to_node.name,l.to_socket.identifier) for l in m.node_tree.links]
 r['materials'].append(d)
encoded=json.dumps(r,sort_keys=True,indent=2,default=list)
Path(sys.argv[sys.argv.index('--')+1]).write_text(encoded,encoding='utf8')
print('EQUIVALENCE_CAPTURE',hashlib.sha256(encoded.encode()).hexdigest())
