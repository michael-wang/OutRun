"""Derive a gameplay bust from the approved coloured sculpt; never regenerate a face.
Original master remains untouched. Run Blender -b -t 4 -P this.py.
"""
import bpy,bmesh,math,json,hashlib
from pathlib import Path
from mathutils import Vector
source=Path('C:/astra-dev/tools/outrun-h1ar3d/heroine-color-study.blend')
out=Path('public/assets/characters/coast-heroine-r7a.glb')
review=Path('docs/art-review/r7a');review.mkdir(parents=True,exist_ok=True)
source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
body=next(o for o in bpy.data.objects if o.type=='MESH');body.name='heroine-bust'
for o in list(bpy.data.objects):
 if o!=body:bpy.data.objects.remove(o,do_unlink=True)
bpy.context.view_layer.objects.active=body;body.select_set(True)
bm=bmesh.new();bm.from_mesh(body.data)
bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index==1],context='FACES')
# Disconnected old scalp/hair vertices must not survive as invisible weight data.
bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
bm.to_mesh(body.data);bm.free();body.data.update()
tri_before=len(body.data.polygons)
# Protect eyelid/iris/lip boundaries and the front face; spend fewer vertices on
# hidden back and clothing. This transfers existing colours, not a new face formula.
group=body.vertex_groups.new(name='Facial preservation')
group.add(list(range(len(body.data.vertices))),.45,'REPLACE')
for v in body.data.vertices:
 if v.co.y<-.30 and v.co.z>-.32:group.add([v.index],.25,'REPLACE')
for p in body.data.polygons:
 if p.material_index==2:group.add(list(p.vertices),.25,'REPLACE')
 if p.material_index==3:group.add(list(p.vertices),.55,'REPLACE')
 if p.material_index in [4,5,6,7]:group.add(list(p.vertices),0,'REPLACE')
dec=body.modifiers.new('Gameplay reduction preserving facial surface','DECIMATE');dec.ratio=32000/tri_before
dec.use_collapse_triangulate=True;dec.vertex_group=group.name;dec.vertex_group_factor=8
bpy.ops.object.modifier_apply(modifier=dec.name)
body.data.validate(clean_customdata=True)
# The source is a cut-off bust with outer arm stumps. Trim only those stumps
# inside the existing animated deltoids, rather than drawing two shoulders.
bm=bmesh.new();bm.from_mesh(body.data)
for side in [-1,1]:
 bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-6,plane_co=(side*.72,0,0),plane_no=(side,0,0),clear_outer=True,clear_inner=False)
bm.to_mesh(body.data);bm.free();body.data.update()
body.vertex_groups.clear()
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
# Original sculpt axes are Blender Z up / -Y front. R6d came from this source
# family at .25m/unit, with crown height offset -.048. Bake dimensions once;
# runtime passenger group remains 1.0, at the original seat/pivots.
original=[v.co.copy() for v in body.data.vertices]
for v in body.data.vertices:
 x,y,z=v.co
 seat=smooth(.30,.80,-z)
 v.co=(x*.25,y*(.25+.15*seat)+.465+.025*seat,1.437+z*.25-.045*seat)
for p in body.data.polygons:p.use_smooth=True
# Consolidate the accepted eight painted regions into four opaque material
# families. The actual vertex paint supplies iris, brows, lips and blush.
old_to_new={0:0,2:1,3:2,4:0,5:0,6:0,7:3}
indices=[old_to_new.get(p.material_index,0) for p in body.data.polygons]
body.data.materials.clear()
for name,rough,metal in [('Skin and painted features',.72,0),('Ivory halter',.83,0),('Gold earrings',.30,.65),('Brown eyes',.28,0)]:
 mat=bpy.data.materials.new('R7A '+name);mat.use_nodes=True
 bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 color=mat.node_tree.nodes.new('ShaderNodeVertexColor');color.layer_name='Heroine paint';mat.node_tree.links.new(color.outputs['Color'],bs.inputs['Base Color'])
 body.data.materials.append(mat)
for p,i in zip(body.data.polygons,indices):p.material_index=i
# Minimal pose keys on the derived surface: subdued smile and jaw/lip opening.
# Preserve the accepted base anatomy, no new mesh-based face generation.
body.shape_key_add(name='Basis')
smile=body.shape_key_add(name='smile');mouth=body.shape_key_add(name='mouthOpen')
for i,p in enumerate(original):
 x,y,z=p;front=1-smooth(-.40,-.28,y)
 corner=math.exp(-((abs(x)-.15)/.085)**2-((z+.115)/.09)**2)*front
 smile.data[i].co.z+=.0018*corner
 lip=math.exp(-(x/.19)**4-((z+.14)/.065)**2)*front
 mouth.data[i].co.z-=.0035*lip*smooth(.09,.14,-z)
 jaw=math.exp(-(x/.25)**4-((z+.25)/.13)**2)*front
 mouth.data[i].co.z-=.0015*jaw
arm=bpy.data.armatures.new('R7A minimal neck rig');rig=bpy.data.objects.new('heroine-rig',arm);bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
root=arm.edit_bones.new('bust-root');root.head=(0,.48,.8);root.tail=(0,.48,1.10)
head=arm.edit_bones.new('heroine-head');head.head=(0,.46,1.30);head.tail=(0,.46,1.48);head.parent=root
bpy.ops.object.mode_set(mode='OBJECT')
base=body.vertex_groups.new(name='bust-root');neck=body.vertex_groups.new(name='heroine-head')
for v in body.data.vertices:
 w=smooth(1.26,1.36,v.co.z)
 if w<1:base.add([v.index],1-w,'REPLACE')
 if w>0:neck.add([v.index],w,'REPLACE')
mod=body.modifiers.new('Head turn without a neck seam','ARMATURE');mod.object=rig;body.parent=rig
rig['sourceSha256']=source_hash;rig['source']='heroine-color-study.blend';rig['hairIncluded']=False
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=body
bpy.ops.export_scene.gltf(filepath=str(out.resolve()),use_selection=True,export_animations=False,export_skins=True,export_morph=True,export_extras=True)
bpy.context.preferences.filepaths.save_version=0
study=Path('art-prototype/output/r7a-heroine-upper-body.blend').resolve();bpy.ops.wm.save_as_mainfile(filepath=str(study),compress=True)
counts={m.name:sum(len(p.vertices)-2 for p in body.data.polygons if p.material_index==i) for i,m in enumerate(body.data.materials)}
report={'source':str(source),'sourceSha256':source_hash,'sourceUnchanged':hashlib.sha256(source.read_bytes()).hexdigest()==source_hash,'blend':str(study),'vertices':len(body.data.vertices),'triangles':sum(counts.values()),'materialTriangles':counts,'bytes':out.stat().st_size,'bones':2,'morphs':['smile','mouthOpen'],'runtimeHair':'unchanged coast-blonde-r6d.glb'}
(review/'asset-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
