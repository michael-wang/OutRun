"""Editable lighthouse, authored from design observation; no photo textures or inference.
Run with existing Blender --background --python this.py -- OUTPUT_DIRECTORY.
Metres, Z-up source, +Y entrance. Export converts to glTF Y-up.
"""
import bpy, bmesh, math, sys, json, hashlib
from pathlib import Path
from mathutils import Vector
out=Path(sys.argv[sys.argv.index('--')+1]); out.mkdir(parents=True,exist_ok=False)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def material(name,color,rough=.6,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Roughness'].default_value=rough;n.inputs['Metallic'].default_value=metal
 return m
white=material('warm white lime plaster',(.86,.85,.79),.72)
trim=material('white painted gallery',(.95,.94,.88),.4)
dark=material('blue grey window recess',(.025,.06,.075),.35)
glass=material('muted lantern glazing',(.20,.40,.43),.22,.25)
bronze=material('weathered bronze roof',(.24,.29,.27),.38,.65)
rock=material('headland stone',(.25,.28,.22),.95)
grass=material('headland grass',(.28,.36,.17),.95)
def finish(o,name,mat):
 o.name=name;o.data.materials.append(mat);return o
def cyl(name,r1,r2,depth,z,mat,xy=(0,0),n=48):
 bpy.ops.mesh.primitive_cone_add(vertices=n,radius1=r1,radius2=r2,depth=depth,location=(*xy,z))
 o=finish(bpy.context.object,name,mat)
 for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
 return o
def box(name,loc,size,mat,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=finish(bpy.context.object,name,mat);o.scale=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:mod=o.modifiers.new('soft masonry edge','BEVEL');mod.width=bevel;mod.segments=2;o.modifiers.new('weighted normals','WEIGHTED_NORMAL')
 return o
def beam(name,a,b,r,mat):
 d=Vector(b)-Vector(a);o=cyl(name,r,r,d.length,0,mat,n=8);o.location=(Vector(a)+Vector(b))/2;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return o
def ring(name,r,z,tube,mat):
 bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=tube,major_segments=64,minor_segments=6,location=(0,0,z));return finish(bpy.context.object,name,mat)
# Low shore plinth is part of this local derivative; shoreline itself is untouched.
cyl('tapered headland foundation',7.4,6.2,2.5,.35,rock,n=16)
cyl('headland turf cap',6.25,6.1,.16,1.67,grass,n=32)
cyl('tower stone foot',2.6,2.6,.3,1.84,white)
cyl('continuous tapered masonry shaft',2.28,1.61,11.3,7.64,white,n=64)
for z,r in [(2.08,2.29),(5.7,2.075),(9.35,1.86),(12.95,1.65)]:cyl('subtle masonry cornice',r+.035,r+.035,.09,z,trim)
cyl('flared gallery corbel',1.62,2.83,.65,13.45,white)
cyl('gallery deck',2.98,2.98,.22,13.88,trim)
for i in range(20):
 a=i*math.tau/20;x,y=2.83*math.cos(a),2.83*math.sin(a)
 beam('gallery baluster',(x,y,14),(x,y,14.93),.035,trim)
 if i%2==0:beam('gallery radial brace',(math.cos(a)*1.68,math.sin(a)*1.68,12.92),(x*.94,y*.94,13.78),.075,trim)
for z in [14.1,14.51,14.94]:ring('continuous gallery rail',2.83,z,.045,trim)
cyl('lantern sill',1.54,1.54,.25,14.14,white)
cyl('lantern glass',1.44,1.44,1.7,15.1,glass,n=16)
for i in range(12):
 a=i*math.tau/12;x,y=1.47*math.cos(a),1.47*math.sin(a)
 beam('lantern mullion',(x,y,14.25),(x,y,15.98),.045,trim)
for z in [14.3,15.1,15.94]:ring('lantern frame',1.48,z,.05,trim)
cyl('lantern roof eave',1.72,1.72,.15,16.1,trim)
cyl('lantern shallow cone roof',1.76,.18,.92,16.63,bronze,n=48)
cyl('finial',.075,.025,.7,17.35,bronze,n=12)
# Recess-colored windows remain closed surfaces: no accidental missing chunks.
for z,angle in [(4.4,0),(8.1,math.pi/2),(11.4,0),(8.1,-math.pi/2),(11.4,math.pi)]:
 r=2.28-(z-1.99)*(.67/11.3);x,y=math.sin(angle)*r,math.cos(angle)*r
 o=box('window stone reveal',(x,y,z),(.55,.14,.79),trim,.035);o.rotation_euler.z=-angle
 o=box('dark window inset',(math.sin(angle)*(r+.085),math.cos(angle)*(r+.085),z),(.36,.04,.59),dark,.015);o.rotation_euler.z=-angle
box('entrance porch',(0,2.36,2.91),(1.5,1.12,1.9),white,.07)
box('entrance dark door',(0,2.94,2.73),(.78,.05,1.52),dark,.025)
box('porch lintel',(0,2.44,3.9),(1.68,1.24,.22),trim,.04)
for i in range(4):box('entry step',(0,3.05+i*.3,1.96-i*.085),(1.8,.62,.18),white,.02)
box('low keeper annex',(4.5,0,2.85),(5.2,3.8,2.3),white,.08)
box('annex parapet cap',(4.5,0,4.07),(5.5,4.1,.22),trim,.04)
for x in [3.1,4.5,5.9]:
 box('annex window border',(x,1.93,3),(.81,.08,.91),trim,.02)
 box('annex dark pane',(x,1.98,3),(.64,.035,.72),dark,.01)
box('annex side door',(7.12,.1,2.7),(.04,.85,1.8),dark,.02)
source=list(bpy.context.scene.objects)
source_count=len(source)
bpy.context.scene['asset_note']='Direct authored editable DCC asset from observation. Not Hunyuan output. Photo never used as texture.'
bpy.context.scene['units']='metres; base at local Z=0; gallery and lantern silhouette prioritized'
bpy.context.scene.unit_settings.system='METRIC'
bpy.ops.wm.save_as_mainfile(filepath=str(out/'lighthouse-editable.blend'))
# Apply bevels then merge per material for small runtime draw count, leaving source intact on disk.
for o in source:
 bpy.context.view_layer.objects.active=o
 for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
for mat in [white,trim,dark,glass,bronze,rock,grass]:
 bpy.ops.object.select_all(action='DESELECT');objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials[0]==mat]
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0]
 if len(objects)>1:bpy.ops.object.join()
 bpy.context.object.name='lighthouse-'+mat.name
removed=0
for o in bpy.context.scene.objects:
 if o.type!='MESH':continue
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.triangulate(bm,faces=list(bm.faces))
 bad=[f for f in bm.faces if f.calc_area()<1e-9];removed+=len(bad)
 bmesh.ops.delete(bm,geom=bad,context='FACES');bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
bpy.ops.export_scene.gltf(filepath=str(out/'lighthouse.glb'),export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
stats={'sourceObjects':source_count,'runtimeMeshes':len(bpy.context.scene.objects),'removedDegenerateFaces':removed}
for o in bpy.context.scene.objects:
 if o.type=='MESH':o.data.calc_loop_triangles()
stats['triangles']=sum(len(o.data.loop_triangles) for o in bpy.context.scene.objects if o.type=='MESH')
stats['sha256']={f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in out.iterdir() if f.is_file()}
(out/'asset.json').write_text(json.dumps(stats,indent=2));print(json.dumps(stats))
