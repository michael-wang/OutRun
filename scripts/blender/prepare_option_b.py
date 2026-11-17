"""Local-only Issue 63 conversion; never downloads or overwrites the source.
blender -b -P scripts/blender/prepare_option_b.py -- SOURCE.glb OUTPUT_DIR
"""
import bpy, bmesh, sys, json, hashlib
from pathlib import Path
from mathutils import Vector

source, output = map(Path, sys.argv[sys.argv.index('--')+1:])
assert hashlib.sha256(source.read_bytes()).hexdigest() == '9ff58651c3fd69e7a1d833e3e2e18d02e953dd974d9851f7648d68eadadc825b'
output.mkdir(parents=True, exist_ok=True)
assert not (output/'option-b.blend').exists(), 'Use a new output directory'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
body = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
bpy.context.view_layer.objects.active = body
body.select_set(True)
# One source-to-car transform. Blender -Y exports to glTF +Z.
vs=[body.matrix_world@v.co for v in body.data.vertices]
lo=Vector([min(v[i] for v in vs) for i in range(3)])
hi=Vector([max(v[i] for v in vs) for i in range(3)])
scale=4.9/(hi.y-lo.y)
for v,co in zip(body.data.vertices,vs):
    v.co=Vector(((co.x-(lo.x+hi.x)/2)*scale,(co.y-(lo.y+hi.y)/2)*scale,(co.z-lo.z)*scale))
body.matrix_world.identity()
bm=bmesh.new();bm.from_mesh(body.data)
remove=[]
for f in bm.faces:
    x,y,z=f.calc_center_median()
    # Delete AI wheels, opening clearance for the existing articulated road wheels.
    wheel=abs(x)>.72 and any((y-cy)**2+(z-.46)**2 < .535**2 for cy in (-1.38,1.45))
    # Keep original game seats, dash, glass and occupants instead of doubled cabin.
    cabin=abs(x)<.86 and -.88<y<1.18 and z>.58
    rear=y>2.13 and z<.57  # bounded porous lower fascia removal, covered by diffuser
    if wheel or cabin or rear or f.calc_area()<1e-12: remove.append(f)
bmesh.ops.delete(bm,geom=remove,context='FACES')
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
bm.to_mesh(body.data);bm.free()
before=len(body.data.polygons)
dec=body.modifiers.new('Prototype triangle budget','DECIMATE');dec.ratio=min(1,28000/max(1,before))
bpy.ops.object.modifier_apply(modifier=dec.name)
body.name='option-b-body'
red=bpy.data.materials.new('OptionB Paint');red.use_nodes=True
bs=red.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=(.5,.014,.028,1);bs.inputs['Metallic'].default_value=.55;bs.inputs['Roughness'].default_value=.28
body.data.materials.clear();body.data.materials.append(red)
for f in body.data.polygons:f.use_smooth=True
# A deliberately simple dark cover; no reconstruction of the whole rear.
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,2.29,.43))
diff=bpy.context.object;diff.name='option-b-diffuser';diff.dimensions=(1.85,.35,.32)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
bevel=diff.modifiers.new('Soft edge','BEVEL');bevel.width=.06;bevel.segments=3
bpy.ops.object.modifier_apply(modifier=bevel.name)
dark=bpy.data.materials.new('OptionB Diffuser');dark.diffuse_color=(.012,.018,.024,1);dark.use_nodes=True
dark.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=dark.diffuse_color
dark.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.7
diff.data.materials.append(dark)
bpy.ops.wm.save_as_mainfile(filepath=str(output/'option-b.blend'))
bpy.ops.export_scene.gltf(filepath=str(output/'option-b.glb'),export_format='GLB',export_cameras=False,export_lights=False)
(output/'recipe-result.json').write_text(json.dumps({'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceMetersPerUnit':scale,'removedFaces':len(remove),'beforeDecimation':before,'bodyTriangles':len(body.data.polygons),'blender':bpy.app.version_string,'geometryPolicy':'body only; existing game wheels/cabin/occupants; rear diffuser TODO polish'},indent=2))
